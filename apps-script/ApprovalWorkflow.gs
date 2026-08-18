/**
 * GGSIPU Certificate Approval Workflow Module
 * Manages state machine: Draft / Pending -> Approved -> Revoked
 * Implements strict state-machine guards against illegal transitions.
 */

function approveCertificate(certId, approverName, approverRole, signatureDataUrl) {
  if (!certId) return { status: "error", message: "CertID is required for approval" };

  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "error", message: "Ledger sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: "not_found", message: "Ledger is empty" };

  var headers = data[0];
  var idIdx = headers.indexOf("CertID");
  var statusIdx = headers.indexOf("Status");
  var approvedByIdx = headers.indexOf("ApprovedBy");
  var approvalDateIdx = headers.indexOf("ApprovalDate");

  if (idIdx === -1 || statusIdx === -1) {
    return { status: "error", message: "Ledger missing required column headers" };
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toLowerCase() === String(certId).trim().toLowerCase()) {
      var currentStatus = String(data[i][statusIdx]).trim();

      // State Guard: Check if already revoked
      if (currentStatus.toLowerCase() === "revoked") {
        return { 
          status: "error", 
          message: "State Transition Violation: Cannot approve certificate '" + certId + "' because it is REVOKED." 
        };
      }

      // State Guard: Check if already approved (Idempotent)
      if (currentStatus.toLowerCase() === "approved") {
        return { 
          status: "info", 
          message: "Certificate '" + certId + "' is already in Approved status." 
        };
      }

      var approverFormatted = (approverName || "Competent Authority") + " (" + (approverRole || "Dean DSW") + ")";
      var approvalTimestamp = new Date().toISOString().split("T")[0];

      // Mutate status and approver details
      sheet.getRange(i + 1, statusIdx + 1).setValue("Approved");
      if (approvedByIdx !== -1) {
        sheet.getRange(i + 1, approvedByIdx + 1).setValue(approverFormatted);
      }
      if (approvalDateIdx !== -1) {
        sheet.getRange(i + 1, approvalDateIdx + 1).setValue(approvalTimestamp);
      }

      // Record state change in Audit Trail
      logAuditEvent(
        "APPROVAL", 
        "Certificate " + certId + " transitioned from [" + currentStatus + "] -> [Approved] by " + approverFormatted, 
        approverName || "Competent Authority"
      );

      return { 
        status: "success", 
        message: "Certificate " + certId + " successfully approved and signed.",
        previousStatus: currentStatus,
        newStatus: "Approved"
      };
    }
  }

  return { status: "not_found", message: "Certificate " + certId + " not found in ledger" };
}
