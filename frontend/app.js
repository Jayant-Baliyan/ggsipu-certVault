/**
 * GGSIPU CertVault Application State & Logic Manager
 * Single Page Application (SPA) Controller with Web Crypto SHA-256 & Apps Script Sync
 * 
 * Version: 2.0.0
 * Security Updates: Full Stored XSS Mitigation, State-Machine Guards, Collision-Free ID Generation,
 * Standardized Canonical WebCrypto SHA-256 & Merkle Tree Root Calculation, API Key Authentication.
 */

// Global Configuration & Deployment State
let GAS_API_URL = localStorage.getItem("GGSIPU_GAS_API_URL") || "";
let ADMIN_API_KEY = localStorage.getItem("GGSIPU_ADMIN_API_KEY") || "";
const DEFAULT_SALT = "GGSIPU_SALT_2026_DSW_SECURE_HASH";

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
    SHA256Hash: "6c2e35327ecad8b417ef2f205c0888dfae8e97a389fc781ea32a39281a8f94d0",
    MerkleRoot: "8f2d4e910a11b12c13d14e15f16a17b18c19d20e21f22a23b24c25d26e27f28a",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1001/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1001",
    ApprovedBy: "Prof. Dean Students' Welfare (Dean DSW)",
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
    SHA256Hash: "e5a7b1c3d9e0f2a4b6c8d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1",
    MerkleRoot: "8f2d4e910a11b12c13d14e15f16a17b18c19d20e21f22a23b24c25d26e27f28a",
    DrivePdfUrl: "https://drive.google.com/file/d/mock_1002/view",
    QrVerificationUrl: "https://ggsipu.ac.in/verify?certId=GGSIPU-2026-DSW-1002",
    ApprovedBy: "Prof. Dean Students' Welfare (Dean DSW)",
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
    ApprovedBy: "",
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
    ApprovedBy: "",
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
    ApprovedBy: "Prof. Dean Students' Welfare (Dean DSW)",
    ApprovalDate: "2026-08-10"
  }
];

// Initial Audit Logs State
let mockAuditLogs = [
  { Timestamp: "2026-08-15 14:30:00", EventType: "BATCH_ISSUANCE", Details: "Created batch of 2 certificates with status Pending. Merkle Root: 8f2d4e910a11...", PerformedBy: "dsw.admin@ggsipu.edu" },
  { Timestamp: "2026-08-15 14:25:00", EventType: "APPROVAL", Details: "Certificate GGSIPU-2026-DSW-1001 transitioned from [Pending] -> [Approved] by Prof. Dean Students' Welfare (Dean DSW)", PerformedBy: "Prof. Dean Students' Welfare" },
  { Timestamp: "2026-08-12 11:15:00", EventType: "REVOCATION", Details: "Certificate GGSIPU-2026-DSW-1005 transitioned from [Approved] -> [Revoked]. Reason: Duplicate registration entry", PerformedBy: "Prof. Dean Students' Welfare" }
];

let parsedCsvRecords = [];
let html5QrCode = null;
let currentRevocationCertId = "";

/**
 * Robust HTML Sanitizer to prevent Stored & Reflected XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Standard WebCrypto SHA-256 Hex Hash computation
 */
async function computeSha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes deterministic SHA-256 hash using the standardized canonical format
 */
async function computeCertificateRecordHash(record) {
  const certId = String(record.CertID || "").trim();
  const rollNo = String(record.RollNumber || record.RollNo || "").trim();
  const name = String(record.StudentName || record.Name || "").trim().toUpperCase();
  const event = String(record.EventName || record.Event || "").trim();
  const date = String(record.IssueDate || "").trim();
  const salt = DEFAULT_SALT;

  const payload = [
    `CERT_ID:${certId}`,
    `ROLL_NO:${rollNo}`,
    `NAME:${name}`,
    `EVENT:${event}`,
    `DATE:${date}`,
    `SALT:${salt}`
  ].join("|");

  return await computeSha256(payload);
}

/**
 * Computes Merkle Tree Root from an array of SHA-256 hashes matching Apps Script CryptoEngine
 */
async function computeMerkleRoot(hashes) {
  if (!hashes || hashes.length === 0) return "";
  if (hashes.length === 1) return hashes[0];

  let currentLayer = hashes.slice();

  while (currentLayer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        const combined = currentLayer[i] + currentLayer[i + 1];
        nextLayer.push(await computeSha256(combined));
      } else {
        // If odd number, duplicate last hash
        const combinedOdd = currentLayer[i] + currentLayer[i];
        nextLayer.push(await computeSha256(combinedOdd));
      }
    }
    currentLayer = nextLayer;
  }

  return currentLayer[0];
}

/**
 * High-Entropy Collision-Free Unique Certificate ID Generator
 */
function generateUniqueCertId(existingSet) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 100; attempt++) {
    const timeChunk = Date.now().toString(36).toUpperCase().slice(-4);
    const randChunk = Math.random().toString(16).substring(2, 6).toUpperCase();
    const candidate = `GGSIPU-${year}-DSW-${timeChunk}${randChunk}`;
    if (!existingSet || !existingSet.has(candidate.toUpperCase())) {
      return candidate;
    }
  }
  return `GGSIPU-${year}-DSW-${Date.now().toString(36).toUpperCase()}`;
}

// INITIALIZATION
document.addEventListener("DOMContentLoaded", async () => {
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
  setupApiConfigModal();
  updateConnectionStatusUI();

  // Recompute initial hashes to ensure 100% cryptographic alignment
  for (let c of mockLedger) {
    c.SHA256Hash = await computeCertificateRecordHash(c);
  }

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

  const issueBtn = document.getElementById("dashboard-issue-btn");
  if (issueBtn) {
    issueBtn.addEventListener("click", () => switchToTab("issuer-tab"));
  }
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
  const searchQuery = (document.getElementById("ledger-search-input").value || "").toLowerCase().trim();
  const schoolFilter = document.getElementById("school-filter-select").value;
  const statusFilter = document.getElementById("status-filter-select").value;

  const filtered = mockLedger.filter(item => {
    const matchesSearch = (item.CertID || "").toLowerCase().includes(searchQuery) ||
                          (item.StudentName || "").toLowerCase().includes(searchQuery) ||
                          (item.RollNumber || "").toLowerCase().includes(searchQuery) ||
                          (item.EventName || "").toLowerCase().includes(searchQuery);
    const matchesSchool = (schoolFilter === "ALL") || (item.School === schoolFilter);
    const matchesStatus = (statusFilter === "ALL") || (item.Status === statusFilter);
    return matchesSearch && matchesSchool && matchesStatus;
  });

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No matching certificate records found in ledger.</td></tr>`;
    return;
  }

  filtered.forEach(rec => {
    const tr = document.createElement("tr");
    
    let statusClass = "badge-approved";
    if (rec.Status === "Pending") statusClass = "badge-pending";
    if (rec.Status === "Revoked") statusClass = "badge-revoked";

    const safeCertId = escapeHtml(rec.CertID);
    const safeStudentName = escapeHtml(rec.StudentName);
    const safeRollNumber = escapeHtml(rec.RollNumber);
    const safeSchool = escapeHtml(rec.School);
    const safeCourse = escapeHtml(rec.Course);
    const safeEventName = escapeHtml(rec.EventName);
    const safeIssueDate = escapeHtml(rec.IssueDate);
    const safeStatus = escapeHtml(rec.Status);
    const safeHash = escapeHtml(rec.SHA256Hash || "");
    const shortHash = safeHash.length > 16 ? safeHash.substring(0, 16) + "..." : safeHash;

    tr.innerHTML = `
      <td><strong>${safeCertId}</strong></td>
      <td>
        <div style="font-weight:700;">${safeStudentName}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Roll: ${safeRollNumber}</div>
      </td>
      <td>${safeSchool} <span style="font-size:0.75rem; color:var(--text-muted); display:block;">${safeCourse}</span></td>
      <td>${safeEventName}</td>
      <td>${safeIssueDate}</td>
      <td><span class="badge ${statusClass}">${safeStatus}</span></td>
      <td><code>${shortHash}</code></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm verify-row-btn" data-cert-id="${safeCertId}" title="Verify in Public Portal">
            <i data-feather="shield"></i> Verify
          </button>
          ${rec.Status !== 'Revoked' ? `
            <button class="btn btn-danger btn-sm revoke-row-btn" data-cert-id="${safeCertId}" title="Revoke Certificate">
              <i data-feather="slash"></i> Revoke
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event handlers safely without raw string interpolation
  tbody.querySelectorAll(".verify-row-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const certId = btn.getAttribute("data-cert-id");
      quickFillVerify(certId);
    });
  });

  tbody.querySelectorAll(".revoke-row-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const certId = btn.getAttribute("data-cert-id");
      openRevocationModal(certId);
    });
  });

  feather.replace();
}

function setupFilters() {
  document.getElementById("ledger-search-input").addEventListener("input", renderMasterLedger);
  document.getElementById("school-filter-select").addEventListener("change", renderMasterLedger);
  document.getElementById("status-filter-select").addEventListener("change", renderMasterLedger);
  document.getElementById("refresh-data-btn").addEventListener("click", async () => {
    if (GAS_API_URL) {
      await fetchRemoteLedger();
    }
    renderMasterLedger();
    renderMetrics();
    showToast("Master ledger refreshed");
  });
}

// PUBLIC VERIFICATION PORTAL CONTROL
function setupVerifier() {
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

  // Sample ID chips
  document.querySelectorAll(".sample-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const sampleId = chip.getAttribute("data-sample-id");
      quickFillVerify(sampleId);
    });
  });

  // Cert ID search button
  document.getElementById("verify-id-btn").addEventListener("click", () => {
    const certId = document.getElementById("cert-id-input").value.trim();
    executeVerificationById(certId);
  });

  // Enter key in input
  document.getElementById("cert-id-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const certId = document.getElementById("cert-id-input").value.trim();
      executeVerificationById(certId);
    }
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

async function executeVerificationById(certId) {
  if (!certId) {
    showToast("Please enter a Certificate ID", "danger");
    return;
  }

  // If connected to remote Apps Script, verify against backend
  if (GAS_API_URL) {
    try {
      const response = await fetch(`${GAS_API_URL}?action=verifyId&certId=${encodeURIComponent(certId)}`);
      const data = await response.json();
      if (data.status === "found") {
        renderVerificationResult(data.certificate, certId, data.integrityCheck);
        return;
      } else {
        renderVerificationResult(null, certId, "NOT_FOUND");
        return;
      }
    } catch (err) {
      console.warn("Backend verification error, checking local ledger:", err);
    }
  }

  // Local ledger lookup with cryptographic integrity check
  const found = mockLedger.find(c => (c.CertID || "").trim().toLowerCase() === certId.trim().toLowerCase());
  if (found) {
    const recomputedHash = await computeCertificateRecordHash(found);
    const isUntampered = (recomputedHash.toLowerCase() === (found.SHA256Hash || "").toLowerCase());
    renderVerificationResult(found, certId, isUntampered ? "PASSED" : "FAILED_TAMPERED");
  } else {
    renderVerificationResult(null, certId, "NOT_FOUND");
  }
}

function renderVerificationResult(record, queryId, integrityStatus = "PASSED") {
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
    subtitle.textContent = `No record found in GGSIPU Ledger matching '${escapeHtml(queryId)}'`;
    
    document.getElementById("res-cert-id").textContent = queryId;
    document.getElementById("res-student-name").textContent = "N/A";
    document.getElementById("res-roll-no").textContent = "N/A";
    document.getElementById("res-school").textContent = "N/A";
    document.getElementById("res-event").textContent = "N/A";
    document.getElementById("res-issue-date").textContent = "N/A";
    document.getElementById("res-approved-by").textContent = "N/A";
    document.getElementById("res-integrity").textContent = "NOT FOUND";
    document.getElementById("res-integrity").className = "d-value text-danger";
    document.getElementById("res-sha256").textContent = "N/A";
    document.getElementById("res-merkle").textContent = "N/A";
  } else if (integrityStatus === "FAILED_TAMPERED") {
    header.className = "verification-badge-header revoked";
    icon.setAttribute("data-feather", "alert-triangle");
    title.textContent = "TAMPER ALERT: INTEGRITY CHECK FAILED";
    subtitle.textContent = "Record metadata in ledger has been modified after hash generation!";

    document.getElementById("res-cert-id").textContent = record.CertID;
    document.getElementById("res-student-name").textContent = record.StudentName;
    document.getElementById("res-roll-no").textContent = record.RollNumber;
    document.getElementById("res-school").textContent = record.School;
    document.getElementById("res-event").textContent = record.EventName;
    document.getElementById("res-issue-date").textContent = record.IssueDate;
    document.getElementById("res-approved-by").textContent = record.ApprovedBy || "N/A";
    document.getElementById("res-integrity").textContent = "TAMPERED / MISMATCH";
    document.getElementById("res-integrity").className = "d-value text-danger";
    document.getElementById("res-sha256").textContent = record.SHA256Hash;
    document.getElementById("res-merkle").textContent = record.MerkleRoot;
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
    document.getElementById("res-approved-by").textContent = record.ApprovedBy || "Competent Authority";
    document.getElementById("res-integrity").textContent = "INVALID (REVOKED)";
    document.getElementById("res-integrity").className = "d-value text-danger";
    document.getElementById("res-sha256").textContent = record.SHA256Hash;
    document.getElementById("res-merkle").textContent = record.MerkleRoot;
  } else if (record.Status === "Pending") {
    header.className = "verification-badge-header revoked";
    icon.setAttribute("data-feather", "clock");
    title.textContent = "CERTIFICATE PENDING APPROVAL";
    subtitle.textContent = "This certificate has been generated but is awaiting Competent Authority signature";

    document.getElementById("res-cert-id").textContent = record.CertID;
    document.getElementById("res-student-name").textContent = record.StudentName;
    document.getElementById("res-roll-no").textContent = record.RollNumber;
    document.getElementById("res-school").textContent = record.School;
    document.getElementById("res-event").textContent = record.EventName;
    document.getElementById("res-issue-date").textContent = record.IssueDate;
    document.getElementById("res-approved-by").textContent = "Awaiting Approval";
    document.getElementById("res-integrity").textContent = "PENDING SIGN-OFF";
    document.getElementById("res-integrity").className = "d-value text-warning";
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
    document.getElementById("res-approved-by").textContent = record.ApprovedBy || "Dean DSW";
    document.getElementById("res-integrity").textContent = "100% UNTAMPERED";
    document.getElementById("res-integrity").className = "d-value text-success";
    document.getElementById("res-sha256").textContent = record.SHA256Hash;
    document.getElementById("res-merkle").textContent = record.MerkleRoot;
    
    const driveLink = document.getElementById("res-drive-link");
    if (driveLink) {
      driveLink.href = record.DrivePdfUrl || "#";
    }
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
      let certId = decodedText;
      if (decodedText.includes("certId=")) {
        try {
          const urlObj = new URL(decodedText);
          certId = urlObj.searchParams.get("certId") || decodedText;
        } catch (e) {
          const parts = decodedText.split("certId=");
          if (parts[1]) certId = parts[1].split("&")[0];
        }
      }
      stopQrScanner();
      executeVerificationById(certId);
    },
    () => {
      // Ignore scan loop frames
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
    }).catch(() => {
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
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    codeElem.textContent = hexHash;
    showToast("Document SHA-256 Hash computed successfully!");

    // Search matching hash in ledger or backend
    if (GAS_API_URL) {
      try {
        const response = await fetch(`${GAS_API_URL}?action=verifyHash&hash=${encodeURIComponent(hexHash)}`);
        const data = await response.json();
        if (data.status === "found") {
          renderVerificationResult(data.certificate, data.certificate.CertID, data.integrityCheck);
          return;
        }
      } catch (err) {
        console.warn("Backend hash verification failed, falling back to local:", err);
      }
    }

    const found = mockLedger.find(c => (c.SHA256Hash || "").toLowerCase() === hexHash.toLowerCase());
    if (found) {
      renderVerificationResult(found, found.CertID, "PASSED");
    } else {
      renderVerificationResult(null, "Uploaded File", "NOT_FOUND");
    }
  } catch (err) {
    codeElem.textContent = "Error computing hash: " + escapeHtml(err.message);
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

async function parseCsvString(csvText) {
  const lines = (csvText || "").trim().split("\n");
  if (lines.length <= 1) {
    showToast("CSV file is empty or missing headers", "danger");
    return;
  }

  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  parsedCsvRecords = [];

  const existingIdsSet = new Set(mockLedger.map(c => (c.CertID || "").toUpperCase()));

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });

    // Ensure high-entropy collision-free CertID
    if (!obj.CertID || existingIdsSet.has(obj.CertID.toUpperCase())) {
      obj.CertID = generateUniqueCertId(existingIdsSet);
    }
    existingIdsSet.add(obj.CertID.toUpperCase());

    obj.IssueDate = obj.IssueDate || new Date().toISOString().split("T")[0];
    obj.Status = "Pending"; // Initial State Machine Rule

    // Compute standardized WebCrypto SHA-256 hash
    obj.SHA256Hash = await computeCertificateRecordHash(obj);

    parsedCsvRecords.push(obj);
  }

  document.getElementById("parsed-count-span").textContent = parsedCsvRecords.length;
  document.getElementById("csv-preview-card").style.display = "block";

  const tbody = document.getElementById("csv-preview-tbody");
  tbody.innerHTML = "";

  parsedCsvRecords.forEach((rec, idx) => {
    const tr = document.createElement("tr");
    const safeCertId = escapeHtml(rec.CertID);
    const safeRoll = escapeHtml(rec.RollNumber || rec.RollNo || "N/A");
    const safeName = escapeHtml(rec.StudentName || rec.Name || "N/A");
    const safeEmail = escapeHtml(rec.Email || "N/A");
    const safeSchool = escapeHtml(rec.School || rec.Department || "USICT");
    const safeEvent = escapeHtml(rec.EventName || rec.Event || "Workshop");
    const safeHash = escapeHtml(rec.SHA256Hash || "");
    const shortHash = safeHash.length > 16 ? safeHash.substring(0, 16) + "..." : safeHash;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${safeCertId}</strong></td>
      <td>${safeRoll}</td>
      <td>${safeName}</td>
      <td>${safeEmail}</td>
      <td>${safeSchool}</td>
      <td>${safeEvent}</td>
      <td><span class="badge badge-pending">Pending</span></td>
      <td><code>${shortHash}</code></td>
    `;
    tbody.appendChild(tr);
  });

  showToast(`Parsed ${parsedCsvRecords.length} records from CSV with unique IDs and hashes`);
}

async function processCsvBatchIssuance() {
  if (parsedCsvRecords.length === 0) return;

  const hashesList = parsedCsvRecords.map(r => r.SHA256Hash);
  const batchMerkleRoot = await computeMerkleRoot(hashesList);

  const newRecords = [];

  for (let rec of parsedCsvRecords) {
    const newRecord = {
      CertID: rec.CertID,
      RollNumber: rec.RollNumber || rec.RollNo || "00000000000",
      StudentName: rec.StudentName || rec.Name || "Student Recipient",
      Email: rec.Email || "",
      School: rec.School || rec.Department || "USICT",
      Course: rec.Course || "B.Tech",
      EventName: rec.EventName || rec.Event || "University Event",
      IssueDate: rec.IssueDate || new Date().toISOString().split("T")[0],
      Status: "Pending", // State Machine: Enforce Pending status upon creation
      SHA256Hash: rec.SHA256Hash,
      MerkleRoot: batchMerkleRoot,
      DrivePdfUrl: `https://drive.google.com/file/d/mock_${rec.CertID}/view`,
      QrVerificationUrl: `https://ggsipu.ac.in/verify?certId=${encodeURIComponent(rec.CertID)}&hash=${encodeURIComponent(rec.SHA256Hash)}`,
      ApprovedBy: "",
      ApprovalDate: ""
    };
    newRecords.push(newRecord);
    mockLedger.unshift(newRecord);
  }

  // If connected to remote Apps Script, push batch with API Key
  if (GAS_API_URL) {
    try {
      const res = await fetch(GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "createCertificates",
          apiKey: ADMIN_API_KEY,
          records: newRecords,
          issuerEmail: "dsw.issuer@ggsipu.edu"
        })
      });
      const remoteData = await res.json();
      if (remoteData.status === "unauthorized") {
        showToast("Apps Script Authentication failed: Invalid Admin API Key", "danger");
      }
    } catch (err) {
      console.warn("Failed to sync batch to remote GAS:", err);
    }
  }

  // Log audit
  mockAuditLogs.unshift({
    Timestamp: new Date().toLocaleString(),
    EventType: "BATCH_ISSUANCE",
    Details: `Created batch of ${parsedCsvRecords.length} certificates with status Pending. Merkle Root: ${batchMerkleRoot}`,
    PerformedBy: "dsw.issuer@ggsipu.edu"
  });

  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();

  showToast(`Submitted ${parsedCsvRecords.length} certificates to Approval Queue! (Status: Pending)`, "success");
  parsedCsvRecords = [];
  document.getElementById("csv-preview-card").style.display = "none";
  document.getElementById("csv-paste-textarea").value = "";
  switchToTab("approval-tab");
}

// APPROVAL QUEUE
function setupApprovalQueue() {
  document.getElementById("approve-all-selected-btn").addEventListener("click", approveSelectedBatch);
  
  const selectAllChk = document.getElementById("select-all-pending");
  if (selectAllChk) {
    selectAllChk.addEventListener("change", (e) => {
      document.querySelectorAll(".pending-chk").forEach(chk => {
        chk.checked = e.target.checked;
      });
    });
  }
}

function renderApprovalQueue() {
  const tbody = document.getElementById("approval-queue-tbody");
  const pending = mockLedger.filter(c => c.Status === "Pending");

  tbody.innerHTML = "";

  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No pending certificate requests in queue. All certificates are processed.</td></tr>`;
    return;
  }

  pending.forEach(rec => {
    const tr = document.createElement("tr");
    const safeCertId = escapeHtml(rec.CertID);
    const safeName = escapeHtml(rec.StudentName);
    const safeRoll = escapeHtml(rec.RollNumber);
    const safeSchool = escapeHtml(rec.School);
    const safeCourse = escapeHtml(rec.Course);
    const safeEvent = escapeHtml(rec.EventName);
    const safeHash = escapeHtml(rec.SHA256Hash || "");
    const shortHash = safeHash.length > 16 ? safeHash.substring(0, 16) + "..." : safeHash;

    tr.innerHTML = `
      <td><input type="checkbox" class="pending-chk" value="${safeCertId}" checked></td>
      <td><strong>${safeCertId}</strong></td>
      <td>${safeName}</td>
      <td>${safeRoll}</td>
      <td>${safeSchool} (${safeCourse})</td>
      <td>${safeEvent}</td>
      <td><code>${shortHash}</code></td>
      <td>
        <button class="btn btn-success btn-sm approve-single-btn" data-cert-id="${safeCertId}">
          <i data-feather="check"></i> Sign & Approve
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".approve-single-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const certId = btn.getAttribute("data-cert-id");
      approveSingleCert(certId);
    });
  });

  feather.replace();
}

async function approveSingleCert(certId) {
  const target = mockLedger.find(c => c.CertID === certId);
  if (!target) {
    showToast(`Certificate ${certId} not found`, "danger");
    return;
  }

  // State Machine Guard: Cannot approve revoked cert
  if (target.Status === "Revoked") {
    showToast(`State Violation: Cannot approve certificate ${certId} because it is REVOKED.`, "danger");
    return;
  }

  if (target.Status === "Approved") {
    showToast(`Certificate ${certId} is already approved.`, "info");
    return;
  }

  target.Status = "Approved";
  target.ApprovedBy = "Prof. Dean Students' Welfare (Dean DSW)";
  target.ApprovalDate = new Date().toISOString().split("T")[0];

  // Remote Apps Script Sync if configured
  if (GAS_API_URL) {
    try {
      await fetch(GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "approveCertificate",
          apiKey: ADMIN_API_KEY,
          certId: certId,
          approverName: "Prof. Dean Students' Welfare",
          approverRole: "Dean DSW"
        })
      });
    } catch (err) {
      console.warn("Remote approval sync failed:", err);
    }
  }

  mockAuditLogs.unshift({
    Timestamp: new Date().toLocaleString(),
    EventType: "APPROVAL",
    Details: `Certificate ${certId} transitioned from [Pending] -> [Approved] by Prof. Dean Students' Welfare`,
    PerformedBy: "Prof. Dean Students' Welfare"
  });

  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();
  showToast(`Certificate ${certId} signed & approved!`, "success");
}

async function approveSelectedBatch() {
  const checkboxes = document.querySelectorAll(".pending-chk:checked");
  if (checkboxes.length === 0) {
    showToast("No certificates selected for approval", "danger");
    return;
  }

  let approvedCount = 0;
  const today = new Date().toISOString().split("T")[0];

  for (let chk of checkboxes) {
    const certId = chk.value;
    const target = mockLedger.find(c => c.CertID === certId);
    if (target && target.Status === "Pending") {
      target.Status = "Approved";
      target.ApprovedBy = "Prof. Dean Students' Welfare (Dean DSW)";
      target.ApprovalDate = today;
      approvedCount++;

      if (GAS_API_URL) {
        try {
          fetch(GAS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              action: "approveCertificate",
              apiKey: ADMIN_API_KEY,
              certId: certId,
              approverName: "Prof. Dean Students' Welfare",
              approverRole: "Dean DSW"
            })
          });
        } catch (e) {}
      }
    }
  }

  mockAuditLogs.unshift({
    Timestamp: new Date().toLocaleString(),
    EventType: "APPROVAL",
    Details: `Batch approved ${approvedCount} certificates by Prof. Dean Students' Welfare`,
    PerformedBy: "Prof. Dean Students' Welfare"
  });

  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();
  showToast(`Approved ${approvedCount} certificates successfully!`, "success");
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
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderCertificateCanvas);
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
  if (!canvas) return;
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
  ctx.fillText("SHA-256 Hash: 6c2e35327ecad8b417ef2f205c0888df...", 60, 540);

  // Signatory Line
  ctx.textAlign = "right";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(signatory, canvas.width - 60, 520);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Competent Authority Sign-off", canvas.width - 60, 540);

  // Draw QR Placeholder
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
  const searchQuery = (document.getElementById("audit-search-input").value || "").toLowerCase().trim();

  tbody.innerHTML = "";

  const filteredLogs = mockAuditLogs.filter(l => {
    return (l.EventType || "").toLowerCase().includes(searchQuery) ||
           (l.Details || "").toLowerCase().includes(searchQuery) ||
           (l.PerformedBy || "").toLowerCase().includes(searchQuery);
  });

  if (filteredLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">No audit log records found.</td></tr>`;
    return;
  }

  filteredLogs.forEach(log => {
    const tr = document.createElement("tr");
    const safeTime = escapeHtml(log.Timestamp);
    const safeType = escapeHtml(log.EventType);
    const safeDetails = escapeHtml(log.Details);
    const safeUser = escapeHtml(log.PerformedBy);

    tr.innerHTML = `
      <td>${safeTime}</td>
      <td><span class="badge badge-valid">${safeType}</span></td>
      <td>${safeDetails}</td>
      <td>${safeUser}</td>
    `;
    tbody.appendChild(tr);
  });
}

// REVOCATION MODAL
function setupRevocationModal() {
  document.getElementById("confirm-revoke-btn").addEventListener("click", executeRevocation);
  document.getElementById("close-revocation-modal-btn").addEventListener("click", closeRevocationModal);
  document.getElementById("cancel-revoke-btn").addEventListener("click", closeRevocationModal);
  
  const searchInput = document.getElementById("audit-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", renderAuditLogs);
  }
}

function openRevocationModal(certId) {
  const target = mockLedger.find(c => c.CertID === certId);
  if (target && target.Status === "Revoked") {
    showToast(`Certificate ${certId} is already REVOKED.`, "danger");
    return;
  }

  currentRevocationCertId = certId;
  document.getElementById("modal-target-cert-id").textContent = certId;
  document.getElementById("revocation-reason-input").value = "";
  document.getElementById("revocation-modal").style.display = "flex";
}

function closeRevocationModal() {
  document.getElementById("revocation-modal").style.display = "none";
}

async function executeRevocation() {
  const reason = document.getElementById("revocation-reason-input").value.trim();
  if (!reason) {
    showToast("Please enter a mandatory revocation reason", "danger");
    return;
  }

  const target = mockLedger.find(c => c.CertID === currentRevocationCertId);
  if (!target) {
    showToast(`Certificate ${currentRevocationCertId} not found`, "danger");
    return;
  }

  // State Machine Guard: Cannot revoke already revoked cert
  if (target.Status === "Revoked") {
    showToast(`Certificate ${currentRevocationCertId} is already REVOKED.`, "danger");
    closeRevocationModal();
    return;
  }

  const prevStatus = target.Status;
  target.Status = "Revoked";

  if (GAS_API_URL) {
    try {
      await fetch(GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "revokeCertificate",
          apiKey: ADMIN_API_KEY,
          certId: currentRevocationCertId,
          reason: reason,
          revokedBy: "Prof. Dean Students' Welfare (Dean DSW)"
        })
      });
    } catch (err) {
      console.warn("Remote revocation sync failed:", err);
    }
  }

  mockAuditLogs.unshift({
    Timestamp: new Date().toLocaleString(),
    EventType: "REVOCATION",
    Details: `Certificate ${currentRevocationCertId} transitioned from [${prevStatus}] -> [Revoked]. Reason: ${reason}`,
    PerformedBy: "Prof. Dean Students' Welfare"
  });

  renderMasterLedger();
  renderMetrics();
  renderApprovalQueue();
  renderAuditLogs();
  closeRevocationModal();
  showToast(`Certificate ${currentRevocationCertId} has been REVOKED.`, "danger");
}

// API CONFIGURATION MODAL
function setupApiConfigModal() {
  const modal = document.getElementById("api-config-modal");
  const openBtn = document.getElementById("api-config-btn");
  const closeBtn = document.getElementById("close-api-config-modal-btn");
  const cancelBtn = document.getElementById("cancel-api-config-btn");
  const saveBtn = document.getElementById("save-api-config-btn");

  openBtn.addEventListener("click", () => {
    document.getElementById("gas-url-input").value = GAS_API_URL;
    document.getElementById("api-key-input").value = ADMIN_API_KEY;
    modal.style.display = "flex";
  });

  const closeModal = () => { modal.style.display = "none"; };
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", async () => {
    GAS_API_URL = document.getElementById("gas-url-input").value.trim();
    ADMIN_API_KEY = document.getElementById("api-key-input").value.trim();

    localStorage.setItem("GGSIPU_GAS_API_URL", GAS_API_URL);
    localStorage.setItem("GGSIPU_ADMIN_API_KEY", ADMIN_API_KEY);

    updateConnectionStatusUI();
    closeModal();

    if (GAS_API_URL) {
      showToast("Attempting connection to Google Apps Script Web App...");
      await fetchRemoteLedger();
    } else {
      showToast("Running in Local Simulation Mode", "info");
    }
  });
}

function updateConnectionStatusUI() {
  const statusText = document.getElementById("status-mode-text");
  const statusDot = document.getElementById("status-dot");

  if (GAS_API_URL) {
    statusText.textContent = "Google Cloud Active";
    statusDot.className = "status-dot online";
  } else {
    statusText.textContent = "Local Engine Active";
    statusDot.className = "status-dot online";
  }
}

async function fetchRemoteLedger() {
  if (!GAS_API_URL) return;
  try {
    const res = await fetch(`${GAS_API_URL}?action=getAll&apiKey=${encodeURIComponent(ADMIN_API_KEY)}`);
    const data = await res.json();
    if (data.status === "success" && Array.isArray(data.certificates)) {
      mockLedger = data.certificates;
      renderMasterLedger();
      renderMetrics();
      renderApprovalQueue();
      showToast(`Loaded ${data.certificates.length} certificates from Google Sheets!`, "success");
    } else if (data.status === "unauthorized") {
      showToast("Access Denied: Please configure valid Admin API Key in API Config", "danger");
    }
  } catch (err) {
    showToast("Failed to fetch remote ledger from Google Apps Script", "danger");
  }
}

// TOAST NOTIFIER SYSTEM
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconName = type === 'success' ? 'check-circle' : type === 'danger' ? 'alert-circle' : 'info';
  const safeMsg = escapeHtml(message);

  toast.innerHTML = `
    <i data-feather="${iconName}"></i>
    <span>${safeMsg}</span>
  `;
  container.appendChild(toast);
  feather.replace();

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
