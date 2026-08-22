const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');
const { handleUpload } = require('../middleware/upload.middleware');
const { parseExcelBuffer } = require('../services/excelParser.service');
const { generateCertificatePdf } = require('../services/pdfGenerator.service');
const { uploadPdfToDrive } = require('../services/drive.service');
const {
  insertCertificatesBatch,
  getAllCertificates,
  getCertificatesForPdfGeneration,
  updateCertificatePdfUrl,
} = require('../services/certificate.service');

/**
 * POST /api/certificates/bulk-generate
 *
 * Protected: Requires ADMIN role.
 * Accepts: multipart/form-data Excel or CSV file (.xlsx, .xls, .csv, max 5MB).
 * Returns: Batch processing summary { totalRows, successCount, failedRows, insertedCertIds }.
 */
router.post(
  '/bulk-generate',
  authenticateUser,
  requireAdmin,
  handleUpload('file'),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please upload a valid .xlsx, .xls, or .csv file under form-data key "file".',
        });
      }

      // 1. Parse and sanitize spreadsheet buffer
      let parseResult;
      try {
        parseResult = parseExcelBuffer(req.file.buffer);
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          message: parseErr.message || 'Invalid or corrupted spreadsheet file.',
        });
      }

      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: parseResult.error,
          missingColumns: parseResult.missingColumns || [],
        });
      }

      const { totalRows, validRows, failedRows } = parseResult;

      if (totalRows === 0) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file contains no valid student records to process.',
          totalRows: 0,
          successCount: 0,
          failedRows: [],
          insertedCertIds: [],
        });
      }

      // If all rows failed validation, return 400 Bad Request with details
      if (validRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All rows in the spreadsheet failed validation. No certificates were generated.',
          totalRows,
          successCount: 0,
          failedRows,
          insertedCertIds: [],
        });
      }

      // 2. Perform atomic transactional insertion into NeonDB
      let insertedCertIds = [];
      try {
        insertedCertIds = await insertCertificatesBatch(validRows);
      } catch (dbErr) {
        console.error('[BULK GENERATE] Database batch insert error:', dbErr);
        return res.status(500).json({
          success: false,
          message: `Database transaction failure: ${dbErr.message || 'Unable to save certificates to database'}`,
        });
      }

      // 3. Return JSON summary
      const successCount = insertedCertIds.length;
      const isPartial = failedRows.length > 0;

      return res.status(201).json({
        success: true,
        message: isPartial
          ? `Processed batch: ${successCount} certificate(s) generated successfully, ${failedRows.length} row(s) failed.`
          : `All ${successCount} certificate(s) generated and stored with status 'pending' successfully.`,
        totalRows,
        successCount,
        failedRows,
        insertedCertIds,
      });
    } catch (error) {
      console.error('[BULK GENERATE] Unhandled server error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while processing bulk certificate generation',
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/certificates/generate-pdf
 *
 * Protected: Requires ADMIN role.
 * Body: { certIds?: string[], processAllPending?: boolean, allNull?: boolean }
 * Action: Renders high-quality PDF certificates with embedded QR codes & SHA-256 stamps,
 *         uploads them to Google Drive with public view permissions,
 *         and updates NeonDB with pdf_url and pdf_file_id.
 * Returns: { totalAttempted, successCount, generated: [...], failed: [...] }
 */
router.post('/generate-pdf', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { certIds, processAllPending, allNull } = req.body || {};

    // 1. Fetch certificate records from database
    const certificates = await getCertificatesForPdfGeneration({
      certIds,
      processAllPending,
      allNull,
    });

    if (certificates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No certificates found matching the criteria for PDF generation.',
        totalAttempted: 0,
        successCount: 0,
        generated: [],
        failed: [],
      });
    }

    const generated = [];
    const failed = [];

    // 2. Iterate through certificates with isolated try/catch per cert
    for (const cert of certificates) {
      const certId = cert.cert_id;
      try {
        console.log(`[PDF ROUTE] Rendering PDF for Certificate: ${certId} (${cert.name})...`);

        // Render PDF buffer using pdf-lib & qrcode
        const pdfBuffer = await generateCertificatePdf(cert);

        // Upload to Google Drive and get shareable link
        const driveResult = await uploadPdfToDrive(pdfBuffer, certId);

        // Update database with Drive webViewLink and driveFileId
        await updateCertificatePdfUrl(
          certId,
          driveResult.webViewLink,
          driveResult.fileId
        );

        generated.push({
          certId: certId,
          name: cert.name,
          pdfUrl: driveResult.webViewLink,
          pdfFileId: driveResult.fileId,
          isMock: driveResult.isMock || false,
        });
      } catch (err) {
        console.error(`[PDF ROUTE] Failed to process PDF for Certificate ${certId}:`, err);
        failed.push({
          certId: certId,
          reason: err.message || 'Error generating or uploading certificate PDF',
        });
      }
    }

    const totalAttempted = certificates.length;
    const successCount = generated.length;

    return res.status(200).json({
      success: true,
      message: `Processed PDF generation: ${successCount} generated successfully, ${failed.length} failed.`,
      totalAttempted,
      successCount,
      generated,
      failed,
    });
  } catch (error) {
    console.error('[PDF ROUTE] Unhandled error during PDF generation batch:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing certificate PDFs',
      error: error.message,
    });
  }
});

/**
 * POST /api/certificates/approve
 * Approves a single certificate or batch of certificates in NeonDB.
 */
router.post('/approve', authenticateUser, async (req, res) => {
  try {
    const { certId, certIds } = req.body || {};
    const idsToApprove = certIds || (certId ? [certId] : []);

    if (idsToApprove.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No certificate IDs provided for approval.',
      });
    }

    const { approveCertificatesBatch } = require('../services/certificate.service');
    const updated = await approveCertificatesBatch(idsToApprove);

    return res.status(200).json({
      success: true,
      message: `Approved ${updated.length} certificate(s) successfully.`,
      approvedCount: updated.length,
      certificates: updated,
    });
  } catch (error) {
    console.error('[APPROVE ROUTE] Error approving certificates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve certificates in database',
      error: error.message,
    });
  }
});

/**
 * POST /api/certificates/revoke
 * Revokes a certificate in NeonDB.
 */
router.post('/revoke', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { certId } = req.body || {};
    if (!certId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required for revocation.',
      });
    }

    const { updateCertificateStatus } = require('../services/certificate.service');
    const updated = await updateCertificateStatus(certId, 'revoked');

    return res.status(200).json({
      success: true,
      message: `Certificate ${certId} revoked successfully.`,
      certificate: updated,
    });
  } catch (error) {
    console.error('[REVOKE ROUTE] Error revoking certificate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke certificate in database',
      error: error.message,
    });
  }
});

/**
 * GET /api/certificates
 * Lists certificates from NeonDB.
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const status = req.query.status;
    const certs = await getAllCertificates({ status });
    return res.status(200).json({
      success: true,
      count: certs.length,
      certificates: certs,
    });
  } catch (error) {
    console.error('[CERTIFICATES] Error fetching certificates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates from database',
    });
  }
});

module.exports = router;
