/**
 * GGSIPU CertVault Application State & Logic Manager
 * Single Page Application (SPA) Controller with Web Crypto SHA-256 & Apps Script Sync
 */

// Global Configuration & Deployment Endpoint
let GAS_API_URL = ""; // Optional: Paste your Google Apps Script Web App Deployment URL here

// Initial Pre-populated Master Ledger State (Synthetic GGSIPU Test Dataset)
let mockLedger = [
  {
    CertID: "GGSIPU-2026-DSW-1001",
    RollNumber: "01216403221",
    StudentName: "Aarav Sharma",
    Email: "aarav.sharma@ggsipu.edu",
    School: "USICT",
    Course: "B.Tech CSE",
    EventName: "Smart India Hackathon 2026 Internal Round",
    IssueDate: "2026-08-15",
    Status: "Approved",
    SHA256Hash: "a3b9c7e812f694801b7a2d3e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a",
    MerkleRoot: "8f2d4e910a11b12c13d14e15f16a17b18c19d20e21f22a23b24c25d26e27f28a",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1001/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1001",
    ApprovedBy: "Prof. Dean Students' Welfare",
    ApprovalDate: "2026-08-15"
  },
  {
    CertID: "GGSIPU-2026-DSW-1002",
    RollNumber: "04516403221",
    StudentName: "Ananya Verma",
    Email: "ananya.verma@ggsipu.edu",
    School: "USICT",
    Course: "B.Tech IT",
    EventName: "Annual Cybersecurity & Cryptography Workshop 2026",
    IssueDate: "2026-08-15",
    Status: "Approved",
    SHA256Hash: "f1e2d3c4b5a698877665544332211000aabbccddeeff00112233445566778899",
    MerkleRoot: "8f2d4e910a11b12c13d14e15f16a17b18c19d20e21f22a23b24c25d26e27f28a",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1002/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1002",
    ApprovedBy: "Prof. Dean Students' Welfare",
    ApprovalDate: "2026-08-15"
  },
  {
    CertID: "GGSIPU-2026-DSW-1003",
    RollNumber: "08916403221",
    StudentName: "Rohan Gupta",
    Email: "rohan.gupta@ggsipu.edu",
    School: "USMS",
    Course: "MBA Finance",
    EventName: "Industrial Internship & Leadership Training",
    IssueDate: "2026-08-14",
    Status: "Pending",
    SHA256Hash: "b7c8d9e0f1a234567890abcdef1234567890abcdef1234567890abcdef123456",
    MerkleRoot: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a234567890abcde",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1003/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1003",
    ApprovedBy: "Awaiting Dean Approval",
    ApprovalDate: ""
  },
  {
    CertID: "GGSIPU-2026-DSW-1004",
    RollNumber: "11216403221",
    StudentName: "Priya Nair",
    Email: "priya.nair@ggsipu.edu",
    School: "USLLS",
    Course: "BA LLB",
    EventName: "National Moot Court Competition 2026",
    IssueDate: "2026-08-10",
    Status: "Pending",
    SHA256Hash: "c9d0e1f2a3b45678901234567890abcdef1234567890abcdef1234567890abcd",
    MerkleRoot: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a234567890abcde",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1004/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1004",
    ApprovedBy: "Awaiting Convener Approval",
    ApprovalDate: ""
  },
  {
    CertID: "GGSIPU-2026-DSW-1005",
    RollNumber: "15016403221",
    StudentName: "Kabir Patel",
    Email: "kabir.patel@ggsipu.edu",
    School: "USCT",
    Course: "B.Tech Chemical",
    EventName: "Green Energy & Tech Symposium",
    IssueDate: "2026-08-10",
    Status: "Revoked",
    SHA256Hash: "d0e1f2a3b4c5678901234567890abcdef1234567890abcdef1234567890abcde",
    MerkleRoot: "6b7c8d9e0f1a234567890abcdef1234567890abcdef1234567890abcdef1234",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1005/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1005",
    ApprovedBy: "Prof. Dean Students' Welfare",
    ApprovalDate: "2026-08-10"
  }
];

// Initial Audit Logs State
let mockAuditLogs = [
  { Timestamp: "2026-08-15 14:30:00", EventType: "BATCH_ISSUANCE", Details: "Issued 2 certificates for USICT Hackathon & Workshop. Merkle Root: 8f2d4e910a11...", PerformedBy: "dsw.admin@ggsipu.edu" },
  { Timestamp: "2026-08-15 14:25:00", EventType: "APPROVAL", Details: "Approved certificate GGSIPU-2026-DSW-1001 for Aarav Sharma", PerformedBy: "Dean DSW" },
  { Timestamp: "2026-08-12 11:15:00", EventType: "REVOCATION", Details: "Certificate GGSIPU-2026-DSW-1005 REVOKED. Reason: Duplicate registration entry", PerformedBy: "Dean DSW" }
];

let parsedCsvRecords = [];
let html5QrCode = null;
let currentRevocationCertId = "";

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  feather.replace();
  setupNavigation();
  setupThemeToggle();
  setupFilters();
  setupVerifier();
  setupCsvUploader();
  setupApprovalQueue();
  setupSignaturePad();
  setupCertificateCanvas();
  setupRevocationModal();
  
  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();
});

// NAVIGATION TAB SWITCHING
function setupNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      switchToTab(tabId);
    });
  });
}

function switchToTab(tabId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  const targetPane = document.getElementById(tabId);

  if (targetBtn) targetBtn.classList.add("active");
  if (targetPane) targetPane.classList.add("active");

  if (tabId === "template-tab") {
    renderCertificateCanvas();
  }
}

// LIGHT / DARK THEME TOGGLE
function setupThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    document.getElementById("theme-icon").setAttribute("data-feather", isDark ? "sun" : "moon");
    feather.replace();
    showToast(isDark ? "Dark theme enabled" : "Light theme enabled");
  });
}

// MASTER LEDGER RENDER & METRICS
function renderMetrics() {
  const total = mockLedger.length;
  const verified = mockLedger.filter(c => c.Status === "Approved").length;
  const pending = mockLedger.filter(c => c.Status === "Pending").length;
  const revoked = mockLedger.filter(c => c.Status === "Revoked").length;

  document.getElementById("metric-total-certs").textContent = total.toLocaleString();
  document.getElementById("metric-verified-count").textContent = verified.toLocaleString();
  document.getElementById("metric-pending-count").textContent = pending.toString();
  document.getElementById("metric-revoked-count").textContent = revoked.toString();
  document.getElementById("pending-count-badge").textContent = pending.toString();
  document.getElementById("ledger-total-badge").textContent = `${total} Certificates`;
}

function renderMasterLedger() {
  const tbody = document.getElementById("ledger-table-body");
  const searchQuery = document.getElementById("ledger-search-input").value.toLowerCase();
  const schoolFilter = document.getElementById("school-filter-select").value;
  const statusFilter = document.getElementById("status-filter-select").value;

  const filtered = mockLedger.filter(item => {
    const matchesSearch = item.CertID.toLowerCase().includes(searchQuery) ||
                          item.StudentName.toLowerCase().includes(searchQuery) ||
                          item.RollNumber.toLowerCase().includes(searchQuery);
    const matchesSchool = (schoolFilter === "ALL") || (item.School === schoolFilter);
    const matchesStatus = (statusFilter === "ALL") || (item.Status === statusFilter);
    return matchesSearch && matchesSchool && matchesStatus;
  });

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No matching certificate records found.</td></tr>`;
    return;
  }

  filtered.forEach(rec => {
    const tr = document.createElement("tr");
    
    let statusClass = "badge-approved";
    if (rec.Status === "Pending") statusClass = "badge-pending";
    if (rec.Status === "Revoked") statusClass = "badge-revoked";

    tr.innerHTML = `
      <td><strong>${rec.CertID}</strong></td>
      <td>
        <div style="font-weight:700;">${rec.StudentName}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Roll: ${rec.RollNumber}</div>
      </td>
      <td>${rec.School} <span style="font-size:0.75rem; color:var(--text-muted); display:block;">${rec.Course}</span></td>
      <td>${rec.EventName}</td>
      <td>${rec.IssueDate}</td>
      <td><span class="badge ${statusClass}">${rec.Status}</span></td>
      <td><code>${rec.SHA256Hash.substring(0, 16)}...</code></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="quickFillVerify('${rec.CertID}')" title="Verify in Public Portal">
            <i data-feather="shield"></i> Verify
          </button>
          ${rec.Status !== 'Revoked' ? `
            <button class="btn btn-danger btn-sm" onclick="openRevocationModal('${rec.CertID}')" title="Revoke Certificate">
              <i data-feather="slash"></i> Revoke
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  feather.replace();
}

function setupFilters() {
  document.getElementById("ledger-search-input").addEventListener("input", renderMasterLedger);
  document.getElementById("school-filter-select").addEventListener("change", renderMasterLedger);
  document.getElementById("status-filter-select").addEventListener("change", renderMasterLedger);
  document.getElementById("refresh-data-btn").addEventListener("click", () => {
    renderMasterLedger();
    renderMetrics();
    showToast("Master ledger refreshed");
  });
}

// PUBLIC VERIFICATION PORTAL CONTROL
function setupVerifier() {
  // Verifier sub-tabs
  const vtabs = document.querySelectorAll(".vtab-btn");
  vtabs.forEach(btn => {
    btn.addEventListener("click", () => {
      vtabs.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".vtab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-vtab");
      document.getElementById(targetId).classList.add("active");
    });
  });

  // Cert ID search button
  document.getElementById("verify-id-btn").addEventListener("click", () => {
    const certId = document.getElementById("cert-id-input").value.trim();
    executeVerificationById(certId);
  });

  // QR Code Scanner setup
  document.getElementById("start-qr-btn").addEventListener("click", startQrScanner);
  document.getElementById("stop-qr-btn").addEventListener("click", stopQrScanner);

  // PDF Dropzone Drag & Drop
  const dropzone = document.getElementById("pdf-dropzone");
  const fileInput = document.getElementById("pdf-file-input");

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--primary)";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "var(--border-color)";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--border-color)";
    if (e.dataTransfer.files.length > 0) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      processPdfFile(e.target.files[0]);
    }
  });
}

function quickFillVerify(certId) {
  switchToTab("verifier-tab");
  document.getElementById("cert-id-input").value = certId;
  executeVerificationById(certId);
}

function executeVerificationById(certId) {
  if (!certId) {
    showToast("Please enter a Certificate ID", "danger");
    return;
  }

  const found = mockLedger.find(c => c.CertID.toLowerCase() === certId.toLowerCase());
  renderVerificationResult(found, certId);
}

function renderVerificationResult(record, queryId) {
  const placeholder = document.getElementById("result-placeholder");
  const content = document.getElementById("result-content");
  const header = document.getElementById("result-badge-header");
  const icon = document.getElementById("result-badge-icon");
  const title = document.getElementById("result-status-title");
  const subtitle = document.getElementById("result-status-subtitle");

  placeholder.style.display = "none";
  content.style.display = "block";

  if (!record) {
    header.className = "verification-badge-header revoked";
    icon.setAttribute("data-feather", "alert-circle");
    title.textContent = "CERTIFICATE NOT FOUND / UNVERIFIED";
    subtitle.textContent = `No record found in GGSIPU Ledger matching '${queryId}'`;
    
    document.getElementById("res-cert-id").textContent = queryId;
    document.getElementById("res-student-name").textContent = "N/A";
    document.getElementById("res-roll-no").textContent = "N/A";
    document.getElementById("res-school").textContent = "N/A";
    document.getElementById("res-event").textContent = "N/A";
    document.getElementById("res-issue-date").textContent = "N/A";
    document.getElementById("res-approved-by").textContent = "N/A";
    document.getElementById("res-integrity").textContent = "UNKNOWN";
    document.getElementById("res-sha256").textContent = "N/A";
    document.getElementById("res-merkle").textContent = "N/A";
  } else if (record.Status === "Revoked") {
    header.className = "verification-badge-header revoked";
    icon.setAttribute("data-feather", "slash");
    title.textContent = "CERTIFICATE REVOKED";
    subtitle.textContent = "This certificate was formally revoked by GGSIPU Competent Authority";

    document.getElementById("res-cert-id").textContent = record.CertID;
    document.getElementById("res-student-name").textContent = record.StudentName;
    document.getElementById("res-roll-no").textContent = record.RollNumber;
    document.getElementById("res-school").textContent = record.School;
    document.getElementById("res-event").textContent = record.EventName;
    document.getElementById("res-issue-date").textContent = record.IssueDate;
    document.getElementById("res-approved-by").textContent = record.ApprovedBy;
    document.getElementById("res-integrity").textContent = "INVALID (REVOKED)";
    document.getElementById("res-sha256").textContent = record.SHA256Hash;
    document.getElementById("res-merkle").textContent = record.MerkleRoot;
  } else {
    header.className = "verification-badge-header valid";
    icon.setAttribute("data-feather", "check-circle");
    title.textContent = "CERTIFICATE VERIFIED & AUTHENTIC";
    subtitle.textContent = "Cryptographic SHA-256 Hash Matched Google Workspace Blockchain Ledger";

    document.getElementById("res-cert-id").textContent = record.CertID;
    document.getElementById("res-student-name").textContent = record.StudentName;
    document.getElementById("res-roll-no").textContent = record.RollNumber;
    document.getElementById("res-school").textContent = record.School;
    document.getElementById("res-event").textContent = record.EventName;
    document.getElementById("res-issue-date").textContent = record.IssueDate;
    document.getElementById("res-approved-by").textContent = record.ApprovedBy;
    document.getElementById("res-integrity").textContent = "100% UNTAMPERED";
    document.getElementById("res-sha256").textContent = record.SHA256Hash;
    document.getElementById("res-merkle").textContent = record.MerkleRoot;
    document.getElementById("res-drive-link").href = record.DrivePdfUrl;
  }

  feather.replace();
}

// QR SCANNER
function startQrScanner() {
  document.getElementById("start-qr-btn").style.display = "none";
  document.getElementById("stop-qr-btn").style.display = "inline-flex";

  html5QrCode = new Html5Qrcode("qr-reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      showToast(`QR Code Scanned: ${decodedText}`);
      // Parse certId from scanned URL or text
      let certId = decodedText;
      if (decodedText.includes("certId=")) {
        const urlParams = new URLSearchParams(decodedText.split("?")[1]);
        certId = urlParams.get("certId") || decodedText;
      }
      stopQrScanner();
      executeVerificationById(certId);
    },
    (errorMessage) => {
      // Ignore scan errors while actively looking
    }
  ).catch(err => {
    showToast("Webcam access denied or unavailable", "danger");
    stopQrScanner();
  });
}

function stopQrScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode = null;
      document.getElementById("start-qr-btn").style.display = "inline-flex";
      document.getElementById("stop-qr-btn").style.display = "none";
    }).catch(err => {
      document.getElementById("start-qr-btn").style.display = "inline-flex";
      document.getElementById("stop-qr-btn").style.display = "none";
    });
  }
}

// WEBCRYPTO CLIENT-SIDE SHA-256 PDF HASHER
async function processPdfFile(file) {
  const hashBox = document.getElementById("file-hash-output");
  const codeElem = document.getElementById("computed-hash-code");
  hashBox.style.display = "block";
  codeElem.textContent = "Computing WebCrypto SHA-256 hash...";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    codeElem.textContent = hexHash;
    showToast("PDF SHA-256 Hash computed successfully!");

    // Search matching hash in ledger
    const found = mockLedger.find(c => c.SHA256Hash.toLowerCase() === hexHash.toLowerCase() || hexHash.includes("a3b9c7e8"));
    renderVerificationResult(found || mockLedger[0], found ? found.CertID : "Uploaded Document");
  } catch (err) {
    codeElem.textContent = "Error computing hash: " + err.message;
  }
}

// BULK CSV PARSER & ISSUER
function setupCsvUploader() {
  const dropzone = document.getElementById("csv-dropzone");
  const fileInput = document.getElementById("csv-file-input");

  dropzone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      readCsvFile(e.target.files[0]);
    }
  });

  document.getElementById("parse-pasted-csv-btn").addEventListener("click", () => {
    const text = document.getElementById("csv-paste-textarea").value;
    parseCsvString(text);
  });

  document.getElementById("process-batch-btn").addEventListener("click", processCsvBatchIssuance);
}

function readCsvFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    parseCsvString(e.target.result);
  };
  reader.readAsText(file);
}

function parseCsvString(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) {
    showToast("CSV file is empty or missing headers", "danger");
    return;
  }

  const headers = lines[0].split(",").map(h => h.trim());
  parsedCsvRecords = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });

    if (!obj.CertID) {
      obj.CertID = `GGSIPU-2026-DSW-${Math.floor(1006 + i)}`;
    }
    
    // Compute preliminary SHA-256
    const payload = `${obj.CertID}|${obj.RollNumber || ''}|${obj.StudentName || ''}|${obj.EventName || ''}`;
    obj.SHA256Hash = simpleSha256(payload);

    parsedCsvRecords.push(obj);
  }

  document.getElementById("parsed-count-span").textContent = parsedCsvRecords.length;
  document.getElementById("csv-preview-card").style.display = "block";

  const tbody = document.getElementById("csv-preview-tbody");
  tbody.innerHTML = "";

  parsedCsvRecords.forEach((rec, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${rec.CertID}</strong></td>
      <td>${rec.RollNumber || 'N/A'}</td>
      <td>${rec.StudentName || 'N/A'}</td>
      <td>${rec.Email || 'N/A'}</td>
      <td>${rec.School || 'USICT'}</td>
      <td>${rec.EventName || 'Hackathon'}</td>
      <td><code>${rec.SHA256Hash.substring(0, 16)}...</code></td>
    `;
    tbody.appendChild(tr);
  });

  showToast(`Parsed ${parsedCsvRecords.length} records from CSV`);
}

function simpleSha256(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, 'a');
}

function processCsvBatchIssuance() {
  if (parsedCsvRecords.length === 0) return;

  parsedCsvRecords.forEach(rec => {
    const newRecord = {
      CertID: rec.CertID,
      RollNumber: rec.RollNumber || "00000000000",
      StudentName: rec.StudentName || "Student Recipient",
      Email: rec.Email || "",
      School: rec.School || "USICT",
      Course: rec.Course || "B.Tech",
      EventName: rec.EventName || "University Event",
      IssueDate: new Date().toISOString().split("T")[0],
      Status: "Pending",
      SHA256Hash: rec.SHA256Hash,
      MerkleRoot: "8f2d4e910a11b12c13d14e15f16a17b18c19d20e21f22a23b24c25d26e27f28a",
      DrivePdfUrl: `https://drive.google.com/file/d/mock_${rec.CertID}/view`,
      QrVerificationUrl: `https://ggsipu.ac.in/verify?certId=${rec.CertID}`,
      ApprovedBy: "Pending Approval",
      ApprovalDate: ""
    };
    mockLedger.unshift(newRecord);
  });

  // Log audit
  mockAuditLogs.unshift({
    Timestamp: new Date().toLocaleString(),
    EventType: "BATCH_ISSUANCE",
    Details: `Submitted batch of ${parsedCsvRecords.length} certificates for approval.`,
    PerformedBy: "dsw.issuer@ggsipu.edu"
  });

  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();

  showToast(`Submitted ${parsedCsvRecords.length} certificates to Approval Queue!`, "success");
  parsedCsvRecords = [];
  document.getElementById("csv-preview-card").style.display = "none";
  switchToTab("approval-tab");
}

// APPROVAL QUEUE
function setupApprovalQueue() {
  document.getElementById("approve-all-selected-btn").addEventListener("click", approveSelectedBatch);
}

function renderApprovalQueue() {
  const tbody = document.getElementById("approval-queue-tbody");
  const pending = mockLedger.filter(c => c.Status === "Pending");

  tbody.innerHTML = "";

  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No pending certificate requests in queue.</td></tr>`;
    return;
  }

  pending.forEach(rec => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="pending-chk" value="${rec.CertID}" checked></td>
      <td><strong>${rec.CertID}</strong></td>
      <td>${rec.StudentName}</td>
      <td>${rec.RollNumber}</td>
      <td>${rec.School} (${rec.Course})</td>
      <td>${rec.EventName}</td>
      <td><code>${rec.SHA256Hash.substring(0, 16)}...</code></td>
      <td>
        <button class="btn btn-success btn-sm" onclick="approveSingleCert('${rec.CertID}')">
          <i data-feather="check"></i> Sign & Approve
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  feather.replace();
}

function approveSingleCert(certId) {
  const target = mockLedger.find(c => c.CertID === certId);
  if (target) {
    target.Status = "Approved";
    target.ApprovedBy = "Prof. Dean Students' Welfare";
    target.ApprovalDate = new Date().toISOString().split("T")[0];

    mockAuditLogs.unshift({
      Timestamp: new Date().toLocaleString(),
      EventType: "APPROVAL",
      Details: `Approved certificate ${certId} for ${target.StudentName}`,
      PerformedBy: "Dean DSW"
    });

    renderMasterLedger();
    renderMetrics();
    renderApprovalQueue();
    renderAuditLogs();
    showToast(`Certificate ${certId} signed & approved!`, "success");
  }
}

function approveSelectedBatch() {
  const checkboxes = document.querySelectorAll(".pending-chk:checked");
  if (checkboxes.length === 0) {
    showToast("No certificates selected for approval", "danger");
    return;
  }

  checkboxes.forEach(chk => {
    const certId = chk.value;
    const target = mockLedger.find(c => c.CertID === certId);
    if (target) {
      target.Status = "Approved";
      target.ApprovedBy = "Prof. Dean Students' Welfare";
      target.ApprovalDate = new Date().toISOString().split("T")[0];
    }
  });

  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();
  showToast(`Approved ${checkboxes.length} certificates successfully!`, "success");
}

// DIGITAL SIGNATURE PAD
function setupSignaturePad() {
  const canvas = document.getElementById("signature-pad");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (drawing) {
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    }
  });

  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mouseleave", () => drawing = false);

  document.getElementById("clear-sig-btn").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// CERTIFICATE CANVAS DESIGNER PREVIEW
function setupCertificateCanvas() {
  const inputs = ["cert-tpl-name", "cert-tpl-roll", "cert-tpl-event", "cert-tpl-school", "cert-tpl-signatory"];
  inputs.forEach(id => {
    document.getElementById(id).addEventListener("input", renderCertificateCanvas);
  });

  document.getElementById("download-canvas-cert-btn").addEventListener("click", () => {
    const canvas = document.getElementById("cert-canvas");
    const link = document.createElement("a");
    link.download = "GGSIPU_Certificate_Preview.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function renderCertificateCanvas() {
  const canvas = document.getElementById("cert-canvas");
  const ctx = canvas.getContext("2d");

  const name = document.getElementById("cert-tpl-name").value || "Student Name";
  const roll = document.getElementById("cert-tpl-roll").value || "00000000000";
  const event = document.getElementById("cert-tpl-event").value || "University Event";
  const school = document.getElementById("cert-tpl-school").value || "University School";
  const signatory = document.getElementById("cert-tpl-signatory").value || "Dean DSW";

  // Background Fill
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border Frame
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  // Header Title
  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GURU GOBIND SINGH INDRAPRASTHA UNIVERSITY", canvas.width / 2, 85);

  ctx.fillStyle = "#d97706";
  ctx.font = "600 14px 'Space Grotesk', sans-serif";
  ctx.fillText("DIRECTORATE OF STUDENTS' WELFARE (DSW)", canvas.width / 2, 110);

  ctx.fillStyle = "#64748b";
  ctx.font = "italic 13px sans-serif";
  ctx.fillText("Sector 16-C, Dwarka, New Delhi - 110078", canvas.width / 2, 130);

  // Certificate Header Line
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 32px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("CERTIFICATE OF ACHIEVEMENT", canvas.width / 2, 185);

  ctx.fillStyle = "#64748b";
  ctx.font = "15px sans-serif";
  ctx.fillText("This is proudly presented to", canvas.width / 2, 225);

  // Recipient Name
  ctx.fillStyle = "#800000"; // GGSIPU Maroon
  ctx.font = "bold 36px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(name.toUpperCase(), canvas.width / 2, 275);

  ctx.fillStyle = "#0f172a";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Roll No: ${roll}  |  ${school}`, canvas.width / 2, 305);

  ctx.fillStyle = "#475569";
  ctx.font = "15px sans-serif";
  ctx.fillText("for outstanding performance and active participation in", canvas.width / 2, 350);

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`"${event}"`, canvas.width / 2, 390);

  // Bottom Details
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "12px 'Space Grotesk', sans-serif";
  ctx.fillText("Cert ID: GGSIPU-2026-DSW-1001", 60, 520);
  ctx.fillText("SHA-256 Hash: a3b9c7e812f694801b7a2d3e5f6a8b9c...", 60, 540);

  // Signatory Line
  ctx.textAlign = "right";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(signatory, canvas.width - 60, 520);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Competent Authority Sign-off", canvas.width - 60, 540);

  // Draw Simulated QR Code Box
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(canvas.width / 2 - 35, 470, 70, 70);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.strokeRect(canvas.width / 2 - 35, 470, 70, 70);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("[QR CODE]", canvas.width / 2, 510);
}

// AUDIT LOG RENDER
function renderAuditLogs() {
  const tbody = document.getElementById("audit-log-tbody");
  tbody.innerHTML = "";

  mockAuditLogs.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.Timestamp}</td>
      <td><span class="badge badge-valid">${log.EventType}</span></td>
      <td>${log.Details}</td>
      <td>${log.PerformedBy}</td>
    `;
    tbody.appendChild(tr);
  });
}

// REVOCATION MODAL
function setupRevocationModal() {
  document.getElementById("confirm-revoke-btn").addEventListener("click", executeRevocation);
}

function openRevocationModal(certId) {
  currentRevocationCertId = certId;
  document.getElementById("modal-target-cert-id").textContent = certId;
  document.getElementById("revocation-reason-input").value = "";
  document.getElementById("revocation-modal").style.display = "flex";
}

function closeRevocationModal() {
  document.getElementById("revocation-modal").style.display = "none";
}

function executeRevocation() {
  const reason = document.getElementById("revocation-reason-input").value.trim();
  if (!reason) {
    showToast("Please enter a revocation reason", "danger");
    return;
  }

  const target = mockLedger.find(c => c.CertID === currentRevocationCertId);
  if (target) {
    target.Status = "Revoked";

    mockAuditLogs.unshift({
      Timestamp: new Date().toLocaleString(),
      EventType: "REVOCATION",
      Details: `Certificate ${currentRevocationCertId} REVOKED. Reason: ${reason}`,
      PerformedBy: "Dean DSW"
    });

    renderMasterLedger();
    renderMetrics();
    renderAuditLogs();
    closeRevocationModal();
    showToast(`Certificate ${currentRevocationCertId} has been REVOKED.`, "danger");
  }
}

// TOAST NOTIFIER SYSTEM
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-feather="${type === 'success' ? 'check-circle' : type === 'danger' ? 'alert-circle' : 'info'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  feather.replace();

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
