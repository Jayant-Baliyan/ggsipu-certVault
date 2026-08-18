# GGSIPU Low-Cost Lite Blockchain-Based Certificate Generation, Verification & Management System

> **Problem Statement ID**: `GGSIPU2609`  
> **Organization**: Directorate of Students' Welfare (DSW), Guru Gobind Singh Indraprastha University (GGSIPU), Sector 16-C, Dwarka, New Delhi.  
> **Tech Stack**: Google Apps Script, Google Workspace (Sheets, Drive, Docs, Slides, Gmail), WebCrypto SHA-256 Hashing, HTML5/CSS3/JavaScript SPA, HTML5 Camera QR Code Scanner, Merkle Tree Cryptographic Proof.

---

## 🌟 Executive Summary

Every academic year, GGSIPU's Directorate of Students' Welfare and its various University Schools (USICT, USMS, USLLS, USCT, etc.) issue thousands of certificates for hackathons, workshops, FDPs, industrial training, events, and academic achievements. Previously, these were manually produced via mail-merge, physically signed, and manually verified via email or telephone when requested by employers or institutions.

**GGSIPU CertVault** solves this with a **zero-infrastructure cost, lightweight, blockchain-compatible certificate lifecycle platform** that runs natively on GGSIPU's existing Google Workspace domain.

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
 └──────────────┬───────────────┴─────────────────────────┬──────────────────────────┘
                │                                         │
                │ REST API / Apps Script `doGet` & `doPost` │
                ▼                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────────┐
 │                   GOOGLE APPS SCRIPT BACKEND (CORE ENGINE)                        │
 ├───────────────────────────────────────────────────────────────────────────────────┤
 │  - `Code.gs`: API Routing & Service Controller                                    │
 │  - `CryptoEngine.gs`: SHA-256 Certificate Hashing & Merkle Root Builder           │
 │  - `CertGenerator.gs`: Slides/Docs PDF Generation Engine & QR Embedder           │
 │  - `ApprovalWorkflow.gs`: Draft -> Pending -> Approved -> Issued State Machine    │
 │  - `EmailDispatcher.gs`: Gmail API Email Delivery with PDF Attachment             │
 │  - `RevocationLog.gs`: Status Ledger & Audit Log Recorder                         │
 └──────────────┬────────────────────────────────────────────────────────────────────┘
                │
                ▼
 ┌───────────────────────────────────────────────────────────────────────────────────┐
 │                    GOOGLE WORKSPACE IMMUTABLE DATA STORAGE                        │
 ├───────────────────────────────────────────────────────────────────────────────────┤
 │  - Google Sheets: Master Certificate Ledger, Student DB, Audit Logs               │
 │  - Google Drive: Encrypted PDF Vault (`/GGSIPU_Issued_Certificates/`)             │
 │  - Google Slides/Docs: Customizable Certificate Templates                         │
 └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

1. **Lite Blockchain Hashing & Merkle Tree Validation**:
   - Computes deterministic **SHA-256 cryptographic digests** using normalized student metadata (`Cert ID + Roll No + Student Name + Event + Salt`).
   - Batches certificate hashes into **Merkle Trees** and stores the root hash in an immutable ledger sheet.

2. **Public QR Code & PDF Hash Verification Portal**:
   - Built-in camera QR scanner (`Html5Qrcode`).
   - Client-side WebCrypto SHA-256 calculation for uploaded PDF files to verify against the backend ledger.

3. **Bulk CSV Generation & Gmail Automated Dispatch**:
   - Parses bulk student CSV files, generates unique Certificate IDs, and emails PDF certificates automatically via Gmail API.

4. **Approval Workflow & Digital Signatures**:
   - Multi-tier lifecycle: `Draft` ➔ `Pending Approval` ➔ `Approved & Signed` ➔ `Issued` ➔ `Revoked`.
   - HTML5 Canvas signature pad for Dean / Director / Convener sign-offs.

5. **Revocation & Immutable Audit Trail**:
   - Revocation workflow marks certificates as `REVOKED` in real time with mandatory reason logging.
   - Comprehensive audit log tracking every user action.

---

## 📂 Repository Structure

```
ggsipu-cert-system/
├── apps-script/                        # Production Google Apps Script Engine
│   ├── Code.gs                         # Main REST API Web App router
│   ├── CryptoEngine.gs                 # SHA-256 & Merkle Tree calculation module
│   ├── CertGenerator.gs                # PDF creation, Drive storage, Gmail dispatch
│   ├── ApprovalWorkflow.gs             # Workflow state machine & signature handler
│   ├── RevocationLog.gs                # Revocation ledger & audit log recorder
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

1. Open [`/frontend/index.html`](file:///C:/Users/mitta/.gemini/antigravity/scratch/ggsipu-cert-system/frontend/index.html) directly in any web browser.
2. The web application starts in **Local Demonstration Mode** pre-loaded with synthetic GGSIPU test data.
3. Test features:
   - **Dashboard**: Filter master ledger by school or status.
   - **Public Verifier**: Test Certificate ID `GGSIPU-2026-DSW-1001` (Valid) or `GGSIPU-2026-DSW-1005` (Revoked).
   - **Bulk Issuer**: Upload [`sample_students.csv`](file:///C:/Users/mitta/.gemini/antigravity/scratch/ggsipu-cert-system/sample_students.csv) or click "Download Sample CSV".
   - **Approvals**: Draw signature on canvas and authorize pending batch.
   - **Certificate Designer**: Live preview dynamic certificate canvas and export PNG.
4. To connect to live Google Apps Script, follow [`docs/Deployment_Guide.md`](file:///C:/Users/mitta/.gemini/antigravity/scratch/ggsipu-cert-system/docs/Deployment_Guide.md) to paste your Web App API URL into `frontend/app.js`.

---

## 🏛️ Developed for GGSIPU Hackathon / SIH Problem GGSIPU2609
Directorate of Students' Welfare (DSW), Guru Gobind Singh Indraprastha University.
