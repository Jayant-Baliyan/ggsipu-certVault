/**
 * GGSIPU Certificate PDF Generator & Mail Engine
 * Handles batch certificate creation, unique collision-free ID generation,
 * cryptographic hashing, Merkle root persistence, and email dispatch.
 */

/**
 * Creates batch of certificates from array of records.
 * Default initial status is 'Pending' (Approval Workflow).
 * Persists calculated Merkle Tree root into every certificate row.
 */
function createCertificatesBatch(records, issuerEmail) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return { status: "error", message: "No records provided for batch issuance" };
  }

  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  
  var expectedHeaders = [
    "CertID", "RollNumber", "StudentName", "School", "Course", 
    "EventName", "IssueDate", "Status", "SHA256Hash", "MerkleRoot", 
    "DrivePdfUrl", "QrVerificationUrl", "ApprovedBy", "ApprovalDate"
  ];

  if (!sheet) {
    // Create sheet if not exists with header
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_LEDGER);
    sheet.appendRow(expectedHeaders);
  }

  // Load existing CertIDs to prevent collisions
  var existingIds = new Set();
  var sheetData = sheet.getDataRange().getValues();
  if (sheetData.length > 1) {
    var headers = sheetData[0];
    var idIdx = headers.indexOf("CertID");
    if (idIdx !== -1) {
      for (var r = 1; r < sheetData.length; r++) {
        var existingVal = String(sheetData[r][idIdx]).trim();
        if (existingVal) existingIds.add(existingVal.toUpperCase());
      }
    }
  }

  var hashesList = [];
  var preparedRecords = [];
  var todayDate = new Date().toISOString().split("T")[0];

  // Pass 1: Prepare records, generate unique IDs and individual SHA-256 hashes
  for (var i = 0; i < records.length; i++) {
    var rawRec = records[i] || {};
    var rec = {
      RollNumber: String(rawRec.RollNumber || rawRec.RollNo || "N/A").trim(),
      StudentName: String(rawRec.StudentName || rawRec.Name || "N/A").trim(),
      School: String(rawRec.School || rawRec.Department || "DSW").trim(),
      Course: String(rawRec.Course || "B.Tech / MCA").trim(),
      EventName: String(rawRec.EventName || rawRec.Event || "Annual University Event").trim(),
      IssueDate: String(rawRec.IssueDate || todayDate).trim(),
      Status: String(rawRec.Status || "Pending").trim(), // Default to Pending (State Machine)
      Email: String(rawRec.Email || "").trim(),
      ApprovedBy: String(rawRec.ApprovedBy || "").trim(),
      ApprovalDate: String(rawRec.ApprovalDate || "").trim()
    };

    // Ensure unique collision-free CertID
    if (rawRec.CertID && !existingIds.has(String(rawRec.CertID).trim().toUpperCase())) {
      rec.CertID = String(rawRec.CertID).trim();
    } else {
      rec.CertID = generateSecureCertId(existingIds);
    }
    existingIds.add(rec.CertID.toUpperCase());

    // Generate SHA-256 Hash
    var hash = CryptoEngine.generateCertificateHash(rec);
    rec.SHA256Hash = hash;
    hashesList.push(hash);

    var qrUrl = "https://ggsipu.ac.in/verify?certId=" + encodeURIComponent(rec.CertID) + "&hash=" + encodeURIComponent(hash);
    rec.QrVerificationUrl = qrUrl;

    // Generate Drive PDF / Mock PDF Vault
    var pdfUrl = createPdfDriveFile(rec);
    rec.DrivePdfUrl = pdfUrl;

    preparedRecords.push(rec);
  }

  // Pass 2: Calculate Merkle Tree Root across the batch
  var batchMerkleRoot = CryptoEngine.calculateMerkleRoot(hashesList);

  // Pass 3: Set MerkleRoot on all records and build rows for atomic sheet write
  var rowsToAppend = [];
  for (var k = 0; k < preparedRecords.length; k++) {
    var current = preparedRecords[k];
    current.MerkleRoot = batchMerkleRoot;

    rowsToAppend.push([
      current.CertID,
      current.RollNumber,
      current.StudentName,
      current.School,
      current.Course,
      current.EventName,
      current.IssueDate,
      current.Status,
      current.SHA256Hash,
      current.MerkleRoot,
      current.DrivePdfUrl,
      current.QrVerificationUrl,
      current.ApprovedBy,
      current.ApprovalDate
    ]);

    // Dispatch email if approved and recipient email exists
    if (current.Status === "Approved" && current.Email) {
      sendCertificateEmail(current.Email, current);
    }
  }

  // Atomically append all rows to Google Sheet
  if (rowsToAppend.length > 0) {
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rowsToAppend.length, expectedHeaders.length).setValues(rowsToAppend);
  }

  // Log in Audit sheet
  logAuditEvent(
    "BATCH_ISSUANCE", 
    "Created batch of " + preparedRecords.length + " certificates with status Pending. Merkle Root: " + batchMerkleRoot, 
    issuerEmail || "Authorized Issuer"
  );

  return {
    status: "success",
    count: preparedRecords.length,
    merkleRoot: batchMerkleRoot,
    certificates: preparedRecords
  };
}

/**
 * Generates a high-entropy, collision-free Certificate ID
 * Format: GGSIPU-[YEAR]-DSW-[BASE36_TIMESTAMP]-[RANDOM_HEX]
 */
function generateSecureCertId(existingIdsSet) {
  var year = new Date().getFullYear();
  var maxAttempts = 100;

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var timeChunk = new Date().getTime().toString(36).toUpperCase().slice(-4);
    var randomChunk = Utilities.getUuid().substring(0, 4).toUpperCase();
    var candidate = "GGSIPU-" + year + "-DSW-" + timeChunk + randomChunk;

    if (!existingIdsSet || !existingIdsSet.has(candidate.toUpperCase())) {
      return candidate;
    }
  }

  // Fallback UUID-based unique ID
  return "GGSIPU-" + year + "-DSW-" + Utilities.getUuid().substring(0, 8).toUpperCase();
}

/**
 * Creates Google Drive Folder & PDF File
 */
function createPdfDriveFile(record) {
  try {
    var folderSearch = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
    var folder;
    if (folderSearch.hasNext()) {
      folder = folderSearch.next();
    } else {
      folder = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
    }

    var blob = Utilities.newBlob(
      "GGSIPU Official Certificate Vault\n" +
      "Certificate ID: " + record.CertID + "\n" +
      "Recipient: " + record.StudentName + " (Roll: " + record.RollNumber + ")\n" +
      "Event: " + record.EventName + "\n" +
      "SHA-256 Hash: " + record.SHA256Hash + "\n" +
      "Merkle Root: " + (record.MerkleRoot || "BATCH_PENDING"),
      "application/pdf", 
      record.CertID + ".pdf"
    );
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "https://drive.google.com/file/d/mock_" + record.CertID + "/view";
  }
}

/**
 * Email Dispatcher via Gmail API
 */
function sendCertificateEmail(recipientEmail, record) {
  try {
    var subject = "🎓 Official GGSIPU Certificate: " + record.EventName + " (" + record.CertID + ")";
    var body = "Respected " + record.StudentName + ",\n\n" +
      "Congratulations! Your official digital certificate for '" + record.EventName + "' issued by Directorate of Students' Welfare, Guru Gobind Singh Indraprastha University (GGSIPU) has been approved and issued.\n\n" +
      "Certificate Details:\n" +
      "- Certificate ID: " + record.CertID + "\n" +
      "- Student Roll No: " + record.RollNumber + "\n" +
      "- Issue Date: " + record.IssueDate + "\n" +
      "- SHA-256 Blockchain Hash: " + record.SHA256Hash + "\n" +
      "- Merkle Root: " + record.MerkleRoot + "\n\n" +
      "Verify Certificate Authenticity online:\n" + record.QrVerificationUrl + "\n\n" +
      "Best Regards,\nDirectorate of Students' Welfare (DSW)\nGuru Gobind Singh Indraprastha University (GGSIPU), Sector 16-C, Dwarka, New Delhi";

    GmailApp.sendEmail(recipientEmail, subject, body);
  } catch (err) {
    Logger.log("Email dispatch failed for " + recipientEmail + ": " + err.toString());
  }
}
