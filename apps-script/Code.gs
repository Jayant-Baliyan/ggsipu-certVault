/**
 * GGSIPU Low-Cost Lite Blockchain-Based Certificate System
 * Directorate of Students' Welfare (DSW) & University Schools
 * Google Apps Script Web App API Backend
 * 
 * Version: 1.0.0
 * Author: GGSIPU DSW Development Team
 */

// Configuration Constants
const CONFIG = {
  SHEET_NAME_LEDGER: "CertificateLedger",
  SHEET_NAME_AUDIT: "AuditLogs",
  SHEET_NAME_REVOCATIONS: "Revocations",
  DRIVE_FOLDER_NAME: "GGSIPU_Issued_Certificates",
  DEFAULT_SALT: "GGSIPU_SALT_2026_DSW_SECURE_HASH"
};

/**
 * Web App GET endpoint handler
 */
function doGet(e) {
  var action = e.parameter.action || "ping";
  var certId = e.parameter.certId || "";
  var hash = e.parameter.hash || "";

  var result = {};

  try {
    if (action === "ping") {
      result = { status: "success", message: "GGSIPU Certificate API active", timestamp: new Date().toISOString() };
    } else if (action === "verifyId") {
      result = verifyCertificateById(certId);
    } else if (action === "verifyHash") {
      result = verifyCertificateByHash(hash);
    } else if (action === "getAll") {
      result = getAllCertificates();
    } else if (action === "getAuditLogs") {
      result = getAuditLogs();
    } else {
      result = { status: "error", message: "Invalid action parameter" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App POST endpoint handler for creating, approving, and revoking certificates
 */
function doPost(e) {
  var result = {};
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "createCertificates") {
      result = createCertificatesBatch(data.records, data.issuerEmail);
    } else if (action === "approveCertificate") {
      result = approveCertificate(data.certId, data.approverName, data.approverRole, data.signatureDataUrl);
    } else if (action === "revokeCertificate") {
      result = revokeCertificate(data.certId, data.reason, data.revokedBy);
    } else {
      result = { status: "error", message: "Unknown post action" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper to get or create Google Sheet active ledger
 */
function getSpreadsheetLedger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No active spreadsheet found. Bind script to GGSIPU Certificate Ledger Sheet.");
  }
  return ss;
}

/**
 * Verifies certificate by Cert ID
 */
function verifyCertificateById(certId) {
  if (!certId) return { status: "error", message: "Certificate ID is required" };

  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "error", message: "Ledger sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "not_found", message: "Certificate ledger is empty" };

  var headers = data[0];
  var idIdx = headers.indexOf("CertID");
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).toLowerCase() === String(certId).toLowerCase()) {
      var row = data[i];
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j];
      }
      
      // Recalculate hash to verify integrity
      var computedHash = CryptoEngine.generateCertificateHash(record);
      var isIntegrityValid = (computedHash === record.SHA256Hash);

      return {
        status: "found",
        certificate: record,
        integrityCheck: isIntegrityValid ? "PASSED" : "FAILED_TAMPERED",
        recalculatedHash: computedHash
      };
    }
  }

  return { status: "not_found", message: "No certificate found with ID: " + certId };
}

/**
 * Verifies certificate by SHA256 Hash
 */
function verifyCertificateByHash(hash) {
  if (!hash) return { status: "error", message: "SHA256 hash is required" };

  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "error", message: "Ledger sheet not found" };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var hashIdx = headers.indexOf("SHA256Hash");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][hashIdx]).toLowerCase() === String(hash).toLowerCase()) {
      var row = data[i];
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j];
      }

      return {
        status: "found",
        certificate: record,
        integrityCheck: "PASSED"
      };
    }
  }

  return { status: "not_found", message: "No certificate matching SHA256 hash found" };
}

/**
 * Fetch all certificates
 */
function getAllCertificates() {
  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "success", certificates: [] };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", certificates: [] };

  var headers = data[0];
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = data[i][j];
    }
    list.push(item);
  }

  return { status: "success", certificates: list };
}

/**
 * Fetch audit logs
 */
function getAuditLogs() {
  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_AUDIT);
  if (!sheet) return { status: "success", logs: [] };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", logs: [] };

  var headers = data[0];
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = data[i][j];
    }
    list.push(item);
  }

  return { status: "success", logs: list };
}
