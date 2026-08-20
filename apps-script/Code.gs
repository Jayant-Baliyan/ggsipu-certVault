/**
 * GGSIPU Low-Cost Lite Blockchain-Based Certificate System
 * Directorate of Students' Welfare (DSW) & University Schools
 * Google Apps Script Web App Backend (Unified Single Deployment)
 * 
 * Version: 3.1.0
 */

// Configuration Constants
const CONFIG = {
  SHEET_NAME_LEDGER: "CertificateLedger",
  SHEET_NAME_AUDIT: "AuditLogs",
  SHEET_NAME_REVOCATIONS: "Revocations",
  SHEET_NAME_USERS: "Users",
  DRIVE_FOLDER_NAME: "GGSIPU_Issued_Certificates",
  DEFAULT_SALT: "GGSIPU_SALT_2026_DSW_SECURE_HASH",
  DEFAULT_ADMIN_API_KEY: "GGSIPU_SECURE_ADMIN_KEY_2026",
  ROLES: {
    ADMIN: "Admin",
    APPROVER: "Approver",
    ISSUER: "Issuer",
    VIEWER: "Viewer"
  }
};

/**
 * Validates API Key for external REST endpoints.
 */
function validateAuth(providedKey) {
  if (!providedKey) return false;
  var scriptProperties = PropertiesService.getScriptProperties();
  var configuredKey = scriptProperties.getProperty("ADMIN_API_KEY") || CONFIG.DEFAULT_ADMIN_API_KEY;
  return String(providedKey).trim() === String(configuredKey).trim();
}

/**
 * Helper to include HTML sub-files in Apps Script templates
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Looks up user email in the "Users" sheet and returns their assigned role.
 * Columns in Users sheet: Email | Role | Added On
 */
function getUserRole(email) {
  if (!email) return null;
  var cleanEmail = String(email).trim().toLowerCase();
  
  var ss = getSpreadsheetLedger();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAME_USERS);
  
  if (!usersSheet) {
    usersSheet = ss.insertSheet(CONFIG.SHEET_NAME_USERS);
    usersSheet.appendRow(["Email", "Role", "Added On"]);
    
    var adminEmail = PropertiesService.getScriptProperties().getProperty("INITIAL_ADMIN_EMAIL") || cleanEmail;
    if (adminEmail) {
      var today = new Date().toISOString().split("T")[0];
      usersSheet.appendRow([adminEmail.toLowerCase(), CONFIG.ROLES.ADMIN, today]);
      logAuditEvent("USER_ADDED", "Initial system Admin provisioned: " + adminEmail, "System");
      if (adminEmail.toLowerCase() === cleanEmail) {
        return CONFIG.ROLES.ADMIN;
      }
    }
  }
  
  var data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    var adminProp = PropertiesService.getScriptProperties().getProperty("INITIAL_ADMIN_EMAIL");
    if (adminProp && adminProp.toLowerCase() === cleanEmail) {
      var todayDate = new Date().toISOString().split("T")[0];
      usersSheet.appendRow([cleanEmail, CONFIG.ROLES.ADMIN, todayDate]);
      return CONFIG.ROLES.ADMIN;
    }
    return null;
  }
  
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var emailIdx = headers.indexOf("email");
  var roleIdx = headers.indexOf("role");
  
  if (emailIdx === -1) emailIdx = 0;
  if (roleIdx === -1) roleIdx = 1;
  
  for (var i = 1; i < data.length; i++) {
    var rowEmail = String(data[i][emailIdx]).trim().toLowerCase();
    var rowRole = String(data[i][roleIdx]).trim();
    if (rowEmail === cleanEmail && rowRole) {
      var norm = rowRole.toLowerCase();
      if (norm === "admin") return CONFIG.ROLES.ADMIN;
      if (norm === "approver") return CONFIG.ROLES.APPROVER;
      if (norm === "issuer") return CONFIG.ROLES.ISSUER;
      if (norm === "viewer") return CONFIG.ROLES.VIEWER;
      return rowRole;
    }
  }
  
  return null;
}

/**
 * Web App GET endpoint router (Single Deployment)
 * Defaults to Public Verifier on load, with full Staff Portal accessible upon authentication.
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
  
  // If JSON API request is made
  if (action) {
    return handleJsonApiGet(e, action);
  }

  // Single unified Web App deployment serving Index template
  var activeEmail = "";
  try {
    activeEmail = Session.getActiveUser().getEmail();
  } catch (err) {}

  var activeRole = activeEmail ? getUserRole(activeEmail) : null;
  var template = HtmlService.createTemplateFromFile("Index");
  
  template.detectedEmail = activeEmail || "";
  template.detectedRole = activeRole || "";
  template.initialTab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : "verifier-tab";

  return template.evaluate()
    .setTitle("GGSIPU CertVault - Public Verifier & Staff Portal")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handles JSON GET API requests
 */
function handleJsonApiGet(e, action) {
  var certId = (e && e.parameter && e.parameter.certId) ? e.parameter.certId : "";
  var hash = (e && e.parameter && e.parameter.hash) ? e.parameter.hash : "";
  var apiKey = (e && e.parameter && e.parameter.apiKey) ? e.parameter.apiKey : "";

  var result = {};

  try {
    if (action === "ping") {
      result = { status: "success", message: "GGSIPU Certificate API active", timestamp: new Date().toISOString() };
    } else if (action === "verifyId") {
      result = verifyCertificateById(certId);
    } else if (action === "verifyHash") {
      result = verifyCertificateByHash(hash);
    } else if (action === "getAll") {
      if (!validateAuth(apiKey)) {
        result = { status: "unauthorized", message: "Access denied. Valid API Key required." };
      } else {
        result = getAllCertificates();
      }
    } else if (action === "getAuditLogs") {
      if (!validateAuth(apiKey)) {
        result = { status: "unauthorized", message: "Access denied. Valid API Key required." };
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
 * Web App POST endpoint handler
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

    if (!validateAuth(apiKey)) {
      result = { status: "unauthorized", message: "Unauthorized: Valid admin API key required." };
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

// =========================================================================
// GOOGLE.SCRIPT.RUN RPC BACKEND ENDPOINTS (CALLED FROM CLIENT FRONTEND)
// =========================================================================

/**
 * RPC: Authenticate staff member via Google account / Users sheet
 */
function apiAuthenticateStaff(email) {
  var targetEmail = email;
  if (!targetEmail) {
    try {
      targetEmail = Session.getActiveUser().getEmail();
    } catch (e) {}
  }

  if (!targetEmail) {
    return { 
      status: "unauthenticated", 
      message: "No Google session detected. Please sign in with your Google account." 
    };
  }

  var role = getUserRole(targetEmail);
  if (!role) {
    return {
      status: "unauthorized",
      email: targetEmail,
      message: "Access Denied: '" + targetEmail + "' is not registered in the Users sheet. Contact an administrator to be added."
    };
  }

  return {
    status: "success",
    email: targetEmail,
    role: role,
    message: "Authenticated successfully as " + role + " (" + targetEmail + ")"
  };
}

/**
 * RPC: Get full initial state for Staff Portal
 */
function apiGetInitialState(staffEmail) {
  var email = staffEmail;
  if (!email) {
    try { email = Session.getActiveUser().getEmail(); } catch (e) {}
  }
  
  var role = email ? getUserRole(email) : null;
  var certificates = getAllCertificates().certificates || [];
  
  var auditLogs = [];
  if (role && [CONFIG.ROLES.ADMIN, CONFIG.ROLES.APPROVER, CONFIG.ROLES.VIEWER].indexOf(role) !== -1) {
    auditLogs = getAuditLogs().logs || [];
  }
  
  var users = [];
  if (role === CONFIG.ROLES.ADMIN) {
    users = getStaffUsersListInternal();
  }

  return {
    status: "success",
    user: {
      email: email || "",
      role: role || ""
    },
    certificates: certificates,
    auditLogs: auditLogs,
    users: users
  };
}

/**
 * RPC: Fetch all certificates
 */
function apiGetAllCertificates() {
  return getAllCertificates();
}

/**
 * RPC: Batch certificate creation from Bulk Issuer
 */
function apiCreateCertificatesBatch(records, issuerEmail) {
  var email = issuerEmail;
  if (!email) {
    try { email = Session.getActiveUser().getEmail(); } catch (e) {}
  }
  return createCertificatesBatch(records, email || "Authorized Staff Issuer");
}

/**
 * RPC: Approve single certificate
 */
function apiApproveCertificate(certId, approverName, approverRole, signatureDataUrl) {
  var name = approverName || "Competent Authority";
  var role = approverRole || "Dean DSW";
  return approveCertificate(certId, name, role, signatureDataUrl);
}

/**
 * RPC: Approve multiple certificates in batch
 */
function apiApproveBatchCertificates(certIds, approverName, approverRole) {
  if (!certIds || !Array.isArray(certIds) || certIds.length === 0) {
    return { status: "error", message: "No certificate IDs provided for approval" };
  }
  var name = approverName || "Competent Authority";
  var role = approverRole || "Dean DSW";
  var count = 0;
  for (var i = 0; i < certIds.length; i++) {
    var res = approveCertificate(certIds[i], name, role, "");
    if (res && res.status === "success") count++;
  }
  return { status: "success", message: "Batch approved " + count + " certificates.", count: count };
}

/**
 * RPC: Revoke certificate with mandatory reason
 */
function apiRevokeCertificate(certId, reason, revokedBy) {
  var revoker = revokedBy || "Dean DSW (Competent Authority)";
  return revokeCertificate(certId, reason, revoker);
}

/**
 * RPC: Fetch Audit Logs
 */
function apiGetAuditLogs() {
  return getAuditLogs();
}

/**
 * RPC: List Staff Users
 */
function apiGetStaffUsers() {
  return {
    status: "success",
    users: getStaffUsersListInternal()
  };
}

/**
 * RPC: Add or update a staff user's role in the Users sheet
 */
function apiAddOrUpdateStaffUser(targetEmail, targetRole, adminEmail) {
  if (!targetEmail || !targetRole) {
    return { status: "error", message: "Email and Role are required." };
  }
  var cleanEmail = String(targetEmail).trim().toLowerCase();
  var cleanRole = String(targetRole).trim();
  
  var validRoles = [CONFIG.ROLES.ADMIN, CONFIG.ROLES.APPROVER, CONFIG.ROLES.ISSUER, CONFIG.ROLES.VIEWER];
  var matchedRole = validRoles.find(function(r) { return r.toLowerCase() === cleanRole.toLowerCase(); });
  if (!matchedRole) {
    return { status: "error", message: "Invalid role: " + cleanRole + ". Allowed: " + validRoles.join(", ") };
  }

  var ss = getSpreadsheetLedger();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAME_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(CONFIG.SHEET_NAME_USERS);
    usersSheet.appendRow(["Email", "Role", "Added On"]);
  }

  var data = usersSheet.getDataRange().getValues();
  var foundRow = -1;
  var oldRole = "";
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === cleanEmail) {
      foundRow = i + 1;
      oldRole = String(data[i][1]).trim();
      break;
    }
  }

  var today = new Date().toISOString().split("T")[0];
  var performer = adminEmail || "Admin";
  if (foundRow !== -1) {
    usersSheet.getRange(foundRow, 2).setValue(matchedRole);
    logAuditEvent("USER_ROLE_CHANGED", "Updated role for " + cleanEmail + " from [" + oldRole + "] -> [" + matchedRole + "]", performer);
    return { status: "success", message: "Updated " + cleanEmail + " to role: " + matchedRole, users: getStaffUsersListInternal() };
  } else {
    usersSheet.appendRow([cleanEmail, matchedRole, today]);
    logAuditEvent("USER_ADDED", "Added staff user " + cleanEmail + " with role [" + matchedRole + "]", performer);
    return { status: "success", message: "Successfully added " + cleanEmail + " as " + matchedRole, users: getStaffUsersListInternal() };
  }
}

/**
 * RPC: Remove a staff user from the Users sheet
 */
function apiRemoveStaffUser(targetEmail, adminEmail) {
  if (!targetEmail) {
    return { status: "error", message: "Target email is required." };
  }
  var cleanEmail = String(targetEmail).trim().toLowerCase();

  var ss = getSpreadsheetLedger();
  var usersSheet = ss.getSheetByName(CONFIG.SHEET_NAME_USERS);
  if (!usersSheet) return { status: "error", message: "Users sheet not found" };

  var data = usersSheet.getDataRange().getValues();
  var adminCount = 0;
  var targetRow = -1;
  var targetRole = "";

  for (var i = 1; i < data.length; i++) {
    var rEmail = String(data[i][0]).trim().toLowerCase();
    var rRole = String(data[i][1]).trim();
    if (rRole.toLowerCase() === "admin") adminCount++;
    if (rEmail === cleanEmail) {
      targetRow = i + 1;
      targetRole = rRole;
    }
  }

  if (targetRow === -1) {
    return { status: "error", message: "User " + cleanEmail + " not found in Users sheet." };
  }

  if (targetRole.toLowerCase() === "admin" && adminCount <= 1) {
    return { status: "error", message: "Cannot remove the only remaining Admin account." };
  }

  usersSheet.deleteRow(targetRow);
  logAuditEvent("USER_REMOVED", "Removed staff user " + cleanEmail + " (former role: " + targetRole + ")", adminEmail || "Admin");

  return { status: "success", message: "User " + cleanEmail + " removed successfully.", users: getStaffUsersListInternal() };
}

/**
 * Helper: Reads the Users sheet records
 */
function getStaffUsersListInternal() {
  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_USERS);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      list.push({
        Email: String(data[i][0]).trim(),
        Role: String(data[i][1]).trim(),
        AddedOn: String(data[i][2] || "").trim()
      });
    }
  }
  return list;
}

// =========================================================================
// LEDGER ACCESS & VERIFICATION FUNCTIONS
// =========================================================================

function getSpreadsheetLedger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No active spreadsheet found. Bind script to GGSIPU Certificate Ledger Sheet.");
  }
  return ss;
}

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

function getAllCertificates() {
  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "success", count: 0, certificates: [] };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", count: 0, certificates: [] };

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

function getAuditLogs() {
  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_AUDIT);
  if (!sheet) return { status: "success", count: 0, logs: [] };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "success", count: 0, logs: [] };

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
