/**
 * GGSIPU Revocation Management & Audit Log System
 */

function revokeCertificate(certId, reason, revokedBy) {
  if (!certId) return { status: "error", message: "CertID is required" };

  var ss = getSpreadsheetLedger();
  var ledgerSheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  var revSheet = ss.getSheetByName(CONFIG.SHEET_NAME_REVOCATIONS);

  if (!revSheet) {
    revSheet = ss.insertSheet(CONFIG.SHEET_NAME_REVOCATIONS);
    revSheet.appendRow(["CertID", "RevocationReason", "RevokedBy", "RevocationTimestamp"]);
  }

  if (ledgerSheet) {
    var data = ledgerSheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("CertID");
    var statusIdx = headers.indexOf("Status");

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]).toLowerCase() === String(certId).toLowerCase()) {
        ledgerSheet.getRange(i + 1, statusIdx + 1).setValue("Revoked");
        break;
      }
    }
  }

  var timestamp = new Date().toISOString();
  revSheet.appendRow([certId, reason || "Administrative action", revokedBy || "Dean DSW", timestamp]);

  logAuditEvent("REVOCATION", "Certificate " + certId + " REVOKED. Reason: " + reason, revokedBy);

  return { status: "success", message: "Certificate " + certId + " has been revoked." };
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
