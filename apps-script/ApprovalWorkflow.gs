/**
 * GGSIPU Certificate Approval Workflow Module
 * Manages states: Draft -> Pending -> Approved -> Revoked
 */

function approveCertificate(certId, approverName, approverRole, signatureDataUrl) {
  if (!certId) return { status: "error", message: "CertID is required" };

  var ss = getSpreadsheetLedger();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LEDGER);
  if (!sheet) return { status: "error", message: "Ledger sheet not found" };

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idIdx = headers.indexOf("CertID");
  var statusIdx = headers.indexOf("Status");
  var approvedByIdx = headers.indexOf("ApprovedBy");
  var approvalDateIdx = headers.indexOf("ApprovalDate");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).toLowerCase() === String(certId).toLowerCase()) {
      sheet.getRange(i + 1, statusIdx + 1).setValue("Approved");
      sheet.getRange(i + 1, approvedByIdx + 1).setValue((approverName || "Competent Authority") + " (" + (approverRole || "Dean DSW") + ")");
      sheet.getRange(i + 1, approvalDateIdx + 1).setValue(new Date().toLocaleDateString("en-IN"));

      logAuditEvent("APPROVAL", "Certificate " + certId + " approved by " + approverName, approverName);

      return { status: "success", message: "Certificate " + certId + " successfully approved." };
    }
  }

  return { status: "not_found", message: "Certificate " + certId + " not found" };
}
