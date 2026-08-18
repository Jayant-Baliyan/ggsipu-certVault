/**
 * GGSIPU Low-Cost Lite Blockchain-Based Certificate System
 * Directorate of Students' Welfare (DSW) & University Schools
 * Google Apps Script Web App API Backend
 * 
 * Version: 2.0.0
 * Author: GGSIPU DSW Development Team
 */

// Configuration Constants
const CONFIG = {
  SHEET_NAME_LEDGER: "CertificateLedger",
  SHEET_NAME_AUDIT: "AuditLogs",
  SHEET_NAME_REVOCATIONS: "Revocations",
  DRIVE_FOLDER_NAME: "GGSIPU_Issued_Certificates",
  DEFAULT_SALT: "GGSIPU_SALT_2026_DSW_SECURE_HASH",
  DEFAULT_ADMIN_API_KEY: "GGSIPU_SECURE_ADMIN_KEY_2026"
};

/**
 * Validates API Key for protected endpoints against Script Properties or CONFIG default.
 * @param {string} providedKey - The API key provided by the caller.
 * @return {boolean} True if authenticated, false otherwise.
 */
function validateAuth(providedKey) {
  if (!providedKey) return false;
  var scriptProperties = PropertiesService.getScriptProperties();
  var configuredKey = scriptProperties.getProperty("ADMIN_API_KEY") || CONFIG.DEFAULT_ADMIN_API_KEY;
  return String(providedKey).trim() === String(configuredKey).trim();
}

/**
 * Web App GET endpoint handler
 * Public endpoints: ping, verifyId, verifyHash
 * Protected endpoints: getAll, getAuditLogs (requires apiKey parameter)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  var certId = (e && e.parameter && e.parameter.certId) ? e.parameter.certId : "";
  var hash = (e && e.parameter && e.parameter.hash) ? e.parameter.hash : "";
  var apiKey = (e && e.parameter && e.parameter.apiKey) ? e.parameter.apiKey : "";

  var result = {};

  try {
    // Public Endpoints (Verification & Health Check)
    if (action === "ping") {
      result = { status: "success", message: "GGSIPU Certificate API active", timestamp: new Date().toISOString() };
    } else if (action === "verifyId") {
      result = verifyCertificateById(certId);
    } else if (action === "verifyHash") {
      result = verifyCertificateByHash(hash);
    } 
    // Protected Admin Endpoints (Require API Key authentication)
    else if (action === "getAll") {
      if (!validateAuth(apiKey)) {
        result = { status: "unauthorized", message: "Access denied. Valid API Key required to read the master ledger." };
      } else {
        result = getAllCertificates();
      }
    } else if (action === "getAuditLogs") {
      if (!validateAuth(apiKey)) {
        result = { status: "unauthorized", message: "Access denied. Valid API Key required to read audit logs." };
      } else {
        result = getAuditLogs();
      }
    } else {
      result = { status: "error", message: "Invalid action parameter: " + action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App POST endpoint handler for creating, approving, and revoking certificates
 * All POST mutation actions REQUIRE valid API Key authentication.
 */
function doPost(e) {
  var result = {};
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing POST body" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var apiKey = data.apiKey || (e.parameter && e.parameter.apiKey);

    // Enforce Authentication for all POST mutation actions
    if (!validateAuth(apiKey)) {
      result = { 
        status: "unauthorized", 
        message: "Unauthorized: Valid admin API key is required to perform '" + action + "'." 
      };
    } else if (action === "createCertificates") {
      result = createCertificatesBatch(data.records, data.issuerEmail || "Authorized Issuer");
    } else if (action === "approveCertificate") {
      result = approveCertificate(data.certId, data.approverName, data.approverRole, data.signatureDataUrl);
    } else if (action === "revokeCertificate") {
      result = revokeCertificate(data.certId, data.reason, data.revokedBy);
    } else {
      result = { status: "error", message: "Unknown post action: " + action };
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
 * Verifies certificate by Cert ID (Public Endpoint)
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
  if (idIdx === -1) return { status: "error", message: "CertID column not found in ledger" };
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toLowerCase() === String(certId).trim().toLowerCase()) {
      var row = data[i];
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j];
      }
      
      // Recalculate hash from row metadata to verify integrity
      var computedHash = CryptoEngine.generateCertificateHash(record);
      var isIntegrityValid = (String(computedHash).toLowerCase() === String(record.SHA256Hash).toLowerCase());

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
 * Verifies certificate by SHA256 Hash (Public Endpoint)
 * Recomputes hash from row data to ensure sheet data integrity has not been tampered with.
 */
function verifyCertificateByHash(hash) {
  if (!hash) return { status: "error", message: "SHA256 hash is required" };

  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "error", message: "Ledger sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "not_found", message: "Certificate ledger is empty" };

  var headers = data[0];
  var hashIdx = headers.indexOf("SHA256Hash");
  if (hashIdx === -1) return { status: "error", message: "SHA256Hash column not found in ledger" };

  var searchHash = String(hash).trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][hashIdx]).trim().toLowerCase() === searchHash) {
      var row = data[i];
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j];
      }

      // Recompute hash from row fields to verify integrity against manual edits
      var computedHash = CryptoEngine.generateCertificateHash(record);
      var isIntegrityValid = (String(computedHash).toLowerCase() === String(record.SHA256Hash).toLowerCase()) &&
                             (String(computedHash).toLowerCase() === searchHash);

      return {
        status: "found",
        certificate: record,
        integrityCheck: isIntegrityValid ? "PASSED" : "FAILED_TAMPERED",
        recalculatedHash: computedHash
      };
    }
  }

  return { status: "not_found", message: "No certificate matching SHA256 hash found" };
}

/**
 * Fetch all certificates (Protected Endpoint)
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

  return { status: "success", count: list.length, certificates: list };
}

/**
 * Fetch audit logs (Protected Endpoint)
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

  return { status: "success", count: list.length, logs: list };
}
