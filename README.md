# GGSIPU Low-Cost Lite Blockchain-Based Certificate Generation, Verification & Management System

> **Problem Statement ID**: `GGSIPU2609`  
> **Organization**: Directorate of Students' Welfare (DSW), Guru Gobind Singh Indraprastha University (GGSIPU), Sector 16-C, Dwarka, New Delhi.  
> **Tech Stack**: Google Apps Script (V8), Google Workspace (Sheets, Drive, Gmail), WebCrypto SHA-256 Hashing, HTML5/CSS3/JavaScript SPA, HTML5 Camera QR Code Scanner, Merkle Tree Cryptographic Proof, Role-Based Access Control (RBAC).

---

## 🌟 Executive Summary

Every academic year, GGSIPU's Directorate of Students' Welfare (DSW) and its various University Schools (USICT, USMS, USLLS, USCT, etc.) issue thousands of certificates for hackathons, workshops, FDPs, industrial training, events, and academic achievements.

**GGSIPU CertVault** provides a **zero-infrastructure cost, lightweight, blockchain-compatible certificate lifecycle platform** that runs natively on GGSIPU's existing Google Workspace domain with enterprise-grade cryptographic verification, complete state machine security, automated approval workflows, and multi-tier access control.

---

## 🚀 Unified Single Deployment Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │          GGSIPU CertVault (index.html)                 │
                       └──────────────────────────┬─────────────────────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │      DEFAULT VIEW: Public Verifier Portal        │
                        ├──────────────────────────────────────────────────┤
                        │ • Instant QR Code Webcam Scanner                 │
                        │ • Certificate ID Lookup Search Bar                │
                        │ • Client-Side PDF SHA-256 WebCrypto Hasher       │
                        │ • Blockchain Cryptographic Proof Inspector       │
                        │ • Open to Anyone — NO login required             │
                        └─────────────────────────┬────────────────────────┘
                                                  │
                                   User clicks "Staff Portal"
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │       Google Staff Authentication Modal          │
                        │   (Verified against Google Sheets `Users` Tab)   │
                        └─────────────────────────┬────────────────────────┘
                                                  │
                      ┌───────────────────────────┴───────────────────────────┐
                      │                                                       │
                      ▼                                                       ▼
       ┌─────────────────────────────┐                         ┌─────────────────────────────┐
       │         Admin Role          │                         │     Approver / Issuer /     │
       │                             │                         │         Viewer Role         │
       ├─────────────────────────────┤                         ├─────────────────────────────┤
       │ • Dashboard Analytics       │                         │ • Dashboard Analytics       │
       │ • Bulk CSV Uploader         │                         │ • Approver: Sign & Revoke   │
       │ • Approvals & Canvas Sign   │                         │ • Issuer: CSV Upload & Des. │
       │ • Certificate Designer      │                         │ • Viewer: Read-only Logs    │
       │ • Audit Logs & Revocation   │                         │ • Instant Logout button     │
       │ • Staff Users Ledger Mgmt   │                         │ • Return to Verifier anytime│
       └─────────────────────────────┘                         └─────────────────────────────┘
```

### 1. Default Open Access: Public Verifier
When anyone visits the web application (`index.html`), it opens immediately to the **Public Verifier** tab. Visitors can scan certificate QR codes with their camera, search certificate records by ID, or drag-and-drop certificate PDFs for instant client-side WebCrypto SHA-256 verification against the blockchain ledger. No authentication or login is required on this path.

### 2. Staff Portal Authentication
To access administrative and management tools, staff members click the **"Staff Portal"** button in the top navigation bar. This opens the Google Staff Authentication prompt:
- Supports bot / simulated test accounts for instant local demonstration.
- Connects directly to Google Apps Script and validates caller email against the `Users` sheet.
- Unlocks tabs and actions tailored to the user's role:
  - **Admin**: Dashboard, Bulk Issuer, Approvals, Designer, Audit Logs, Staff Users, System Config.
  - **Approver**: Dashboard, Approvals Queue (sign & approve), Audit Logs, and Revocation.
  - **Issuer**: Dashboard, Bulk CSV Issuer (upload & submit batches), and Certificate Designer.
  - **Viewer**: Dashboard, Audit Logs (read-only).

---

## 📂 Repository Structure

```
ggsipu-certVault/
├── apps-script/                        # Production Google Apps Script Engine
│   ├── Code.gs                         # REST API router, Auth & RPC Controller
│   ├── CryptoEngine.gs                 # SHA-256 & Merkle Tree calculation module
│   ├── CertGenerator.gs                # Batch ID Gen, Merkle root persistence, Mail
│   ├── ApprovalWorkflow.gs             # Workflow state machine & signature handler
│   ├── RevocationLog.gs                # State-guarded revocation ledger & audit logs
│   └── appsscript.json                 # Apps Script manifest file
├── frontend/                           # Single Page Web Application
│   ├── index.html                      # Unified Web UI layout (Public Verifier + Staff Portal)
│   ├── style.css                       # Responsive design system & glassmorphism theme
│   └── app.js                          # SPA state manager, WebCrypto hasher & Auth controller
├── docs/                               # System Documentation
│   ├── GoogleSheets_Template_Schema.md # Google Sheets database schema
│   └── Deployment_Guide.md             # Complete step-by-step deployment guide
├── sample_students.csv                 # Pre-populated synthetic dataset for bulk testing
└── README.md                           # Project Documentation Overview
```

---

## 🛠️ Testing the Application

1. Open [`/frontend/index.html`](file:///D:/Ideathon/SIH2026-TechRoaches/frontend/index.html) in any modern web browser.
2. The page loads directly at the **Public Verifier**. Try sample Certificate ID `GGSIPU-2026-DSW-1001` (Valid), `GGSIPU-2026-DSW-1003` (Pending), or `GGSIPU-2026-DSW-1005` (Revoked).
3. Click the **Staff Portal** button in the top navigation bar.
4. Select a simulated staff account (e.g. `dsw.admin@ipu.ac.in` for Admin or `dean.dsw@ipu.ac.in` for Approver) and click **Sign In with Google**.
5. The Staff Portal unlocks, presenting the Dashboard, Bulk Issuer, Approvals Queue, Certificate Designer, Audit Logs, and Staff Users management.
6. Click **Logout** at any time to lock the staff portal and return to the Public Verifier.

---

## 🏛️ Developed for GGSIPU Hackathon / SIH Problem GGSIPU2609
Directorate of Students' Welfare (DSW), Guru Gobind Singh Indraprastha University.
