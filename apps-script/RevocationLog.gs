/**
 * GGSIPU Revocation Management & Audit Log System
 * Implements state-machine guards, mandatory reason enforcement,
 * and immutable audit trail logging.
 */

function revokeCertificate(certId, reason, revokedBy) {
  if (!certId) {
    return { status: "error", message: "Certificate ID is required for revocation" };
  }

  var cleanReason = String(reason || "").trim();
  if (!cleanReason) {
    return { status: "error", message: "A formal reason is mandatory for certificate revocation" };
  }

  var cleanRevokedBy = String(revokedBy || "Dean DSW (Competent Authority)").trim();

  var ss = getSpreadsheetLedger();
  var ledgerSheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  var revSheet = ss.getSheetByName(CONFIG.SHEET_NAME_REVOCATIONS);

  if (!revSheet) {
    revSheet = ss.insertSheet(CONFIG.SHEET_NAME_REVOCATIONS);
    revSheet.appendRow(["CertID", "RevocationReason", "RevokedBy", "RevocationTimestamp", "PreviousStatus"]);
  }

  if (!ledgerSheet) {
    return { status: "error", message: "Ledger sheet not found" };
  }

  var data = ledgerSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { status: "not_found", message: "Ledger is empty" };
  }

  var headers = data[0];
  var idIdx = headers.indexOf("CertID");
  var statusIdx = headers.indexOf("Status");

  if (idIdx === -1 || statusIdx === -1) {
    return { status: "error", message: "Ledger missing required column headers" };
  }

  var found = false;
  var previousStatus = "";

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toLowerCase() === String(certId).trim().toLowerCase()) {
      found = true;
      previousStatus = String(data[i][statusIdx]).trim();

      // State Guard: Reject re-revoking already revoked certificate
      if (previousStatus.toLowerCase() === "revoked") {
        return { 
          status: "error", 
          message: "State Transition Violation: Certificate '" + certId + "' is already in REVOKED status." 
        };
      }

      // Update status in Master Ledger
      ledgerSheet.getRange(i + 1, statusIdx + 1).setValue("Revoked");
      break;
    }
  }

  if (!found) {
    return { status: "not_found", message: "Certificate '" + certId + "' not found in ledger." };
  }

  // Record in Revocations sheet
  var timestamp = new Date().toISOString();
  revSheet.appendRow([certId, cleanReason, cleanRevokedBy, timestamp, previousStatus]);

  // Log in Audit sheet
  logAuditEvent(
    "REVOCATION", 
    "Certificate " + certId + " transitioned from [" + previousStatus + "] -> [Revoked]. Reason: " + cleanReason, 
    cleanRevokedBy
  );

  return { 
    status: "success", 
    message: "Certificate " + certId + " has been revoked successfully.",
    previousStatus: previousStatus,
    newStatus: "Revoked",
    timestamp: timestamp
  };
}

function logAuditEvent(eventType, details, user) {
  try {
    var ss = getSpreadsheetLedger();
    var auditSheet = ss.getSheetByName(CONFIG.SHEET_NAME_AUDIT);
    if (!auditSheet) {
      auditSheet = ss.insertSheet(CONFIG.SHEET_NAME_AUDIT);
      auditSheet.appendRow(["Timestamp", "EventType", "Details", "PerformedBy"]);
    }
    auditSheet.appendRow([new Date().toISOString(), eventType, details, user || "System"]);
  } catch (e) {
    Logger.log("Audit log failed: " + e.toString());
  }
}
