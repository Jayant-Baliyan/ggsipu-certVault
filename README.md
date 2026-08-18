# GGSIPU Low-Cost Lite Blockchain-Based Certificate Generation, Verification & Management System

> **Problem Statement ID**: `GGSIPU2609`  
> **Organization**: Directorate of Students' Welfare (DSW), Guru Gobind Singh Indraprastha University (GGSIPU), Sector 16-C, Dwarka, New Delhi.  
> **Tech Stack**: Google Apps Script, Google Workspace (Sheets, Drive, Docs, Slides, Gmail), WebCrypto SHA-256 Hashing, HTML5/CSS3/JavaScript SPA, HTML5 Camera QR Code Scanner, Merkle Tree Cryptographic Proof.

---

## 🌟 Executive Summary

Every academic year, GGSIPU's Directorate of Students' Welfare and its various University Schools (USICT, USMS, USLLS, USCT, etc.) issue thousands of certificates for hackathons, workshops, FDPs, industrial training, events, and academic achievements.

**GGSIPU CertVault** provides a **zero-infrastructure cost, lightweight, blockchain-compatible certificate lifecycle platform** that runs natively on GGSIPU's existing Google Workspace domain with enterprise-grade cryptographic verification, complete state machine security, and automated approval workflows.

---

## 🏗️ System Architecture & Workflow

```
 ┌───────────────────────────────────────────────────────────────────────────────────┐
 │                                   USER INTERFACES                                 │
 ├──────────────────────────────┬────────────────────────────────────────────────────┤
 │  Admin & Issuer Dashboard    │  Public Verification Portal & Mobile QR Scanner    │
 │  - Template Builder          │  - Instant QR Code Scanner (Webcam/Mobile)         │
 │  - Bulk CSV Uploader         │  - Certificate ID Lookup Search Bar                 │
 │  - Multi-stage Approvals     │  - PDF File Drag-and-Drop Hash Verification        │
 │  - Revocation & Audit Logs   │  - Blockchain Cryptographic Proof Inspector        │
 │  - API Key Access Control    │  - Public Open Access (No login required)          │
 └──────────────┬───────────────┴─────────────────────────┬──────────────────────────┘
                │                                         │
                │ REST API / Apps Script `doGet` & `doPost` │
                ▼                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────────┐
 │                   GOOGLE APPS SCRIPT BACKEND (CORE ENGINE)                        │
 ├───────────────────────────────────────────────────────────────────────────────────┤
 │  - `Code.gs`: API Routing, Authentication & Integrity Controller                  │
 │  - `CryptoEngine.gs`: SHA-256 Certificate Hashing & Merkle Root Builder           │
 │  - `CertGenerator.gs`: Unique ID Gen, Batch Merkle Root Storage, Drive/Gmail      │
 │  - `ApprovalWorkflow.gs`: Draft -> Pending -> Approved State Machine Guards       │
 │  - `RevocationLog.gs`: State Guarded Status Ledger & Immutable Audit Trail        │
 └──────────────┬────────────────────────────────────────────────────────────────────┘
                │
                ▼
 ┌───────────────────────────────────────────────────────────────────────────────────┐
 │                    GOOGLE WORKSPACE IMMUTABLE DATA STORAGE                        │
 ├───────────────────────────────────────────────────────────────────────────────────┤
 │  - Google Sheets: Master Certificate Ledger, Audit Trail, Revocation Logs         │
 │  - Google Drive: Encrypted PDF Vault (`/GGSIPU_Issued_Certificates/`)             │
 │  - Google Slides/Docs: Customizable Certificate Templates                         │
 └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Architecture Enhancements (v2.0)

1. **Role-Based Access & Token Authentication**:
   - Administrative and mutation actions (`createCertificates`, `approveCertificate`, `revokeCertificate`, `getAll`, `getAuditLogs`) are protected by secure `ADMIN_API_KEY` token validation via Apps Script `PropertiesService`.
   - Verification endpoints (`verifyId`, `verifyHash`) remain publicly accessible without login for friction-free student and employer verification.

2. **Enforced State Machine Workflow (`Draft` ➔ `Pending` ➔ `Approved` ➔ `Revoked`)**:
   - New batch certificates initialize to `Pending` status.
   - Competent authority approval explicitly signs and transitions status to `Approved`.
   - State-machine guards prevent invalid transitions (e.g., approving revoked certificates or duplicate revocations).

3. **Tamper-Evident SHA-256 & Merkle Tree Root Storage**:
   - Deterministic SHA-256 hashes generated from canonical metadata.
   - Batch Merkle Tree roots are calculated and atomically persisted into every certificate record in Google Sheets.
   - Both ID and Hash verification recompute the cryptographic digest to detect manual tampering of sheet rows.

4. **Stored XSS Sanitization**:
   - Complete contextual HTML escaping (`escapeHtml`) on all user-submitted fields across the UI.

5. **Collision-Free Certificate IDs**:
   - High-entropy timestamp + random hex identifiers with automatic deduplication checks against the master ledger.

---

## 📂 Repository Structure

```
ggsipu-certVault/
├── apps-script/                        # Production Google Apps Script Engine
│   ├── Code.gs                         # REST API Web App router & Auth Controller
│   ├── CryptoEngine.gs                 # SHA-256 & Merkle Tree calculation module
│   ├── CertGenerator.gs                # Batch ID Gen, Merkle root persistence, Mail
│   ├── ApprovalWorkflow.gs             # Workflow state machine & signature handler
│   ├── RevocationLog.gs                # State-guarded revocation ledger & audit logs
│   └── appsscript.json                 # Apps Script manifest file
├── frontend/                           # Single Page Web Application
│   ├── index.html                      # Complete Web UI layout & sections
│   ├── style.css                       # Responsive design system & glassmorphism theme
│   └── app.js                          # SPA state manager, WebCrypto hasher & QR scanner
├── docs/                               # System Documentation
│   ├── GoogleSheets_Template_Schema.md # Google Sheets database schema
│   └── Deployment_Guide.md             # 10-minute step-by-step IT deployment guide
├── sample_students.csv                 # Pre-populated synthetic dataset for bulk testing
└── README.md                           # Project Documentation Overview
```

---

## 🛠️ How to Test & Run Locally

1. Open [`/frontend/index.html`](file:///E:/certVault/ggsipu-certVault/frontend/index.html) directly in any modern web browser.
2. The web application starts in **Local Demonstration Mode** with full state-machine simulation and client-side WebCrypto SHA-256 hashing.
3. Test features:
   - **Dashboard**: Filter master ledger by school or status.
   - **Public Verifier**: Test Certificate ID `GGSIPU-2026-DSW-1001` (Valid), `GGSIPU-2026-DSW-1003` (Pending), or `GGSIPU-2026-DSW-1005` (Revoked).
   - **Bulk Issuer**: Upload [`sample_students.csv`](file:///E:/certVault/ggsipu-certVault/sample_students.csv) or paste CSV data &rarr; submit to Approval Queue as `Pending`.
   - **Approvals**: Review pending certificates, draw signature on canvas, and authorize batch &rarr; transition to `Approved`.
   - **Revocation**: Click Revoke on any approved certificate with a mandatory reason &rarr; transitions to `Revoked`.
   - **Certificate Designer**: Live preview dynamic certificate canvas and export high-res PNG.
4. To connect to live Google Apps Script, follow [`docs/Deployment_Guide.md`](file:///E:/certVault/ggsipu-certVault/docs/Deployment_Guide.md) and configure via the **API Config** modal in the top navbar.

---

## 🏛️ Developed for GGSIPU Hackathon / SIH Problem GGSIPU2609
Directorate of Students' Welfare (DSW), Guru Gobind Singh Indraprastha University.
