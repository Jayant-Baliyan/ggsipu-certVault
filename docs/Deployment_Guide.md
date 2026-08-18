# GGSIPU Certificate Management System - Production Deployment Guide

## Overview
GGSIPU CertVault runs natively on GGSIPU Google Workspace domain using Google Apps Script, Google Sheets (Immutable Ledger), Google Drive (Encrypted Certificate Vault), and Gmail API with zero external cloud infrastructure costs.

---

## Step 1: Set up Google Sheets Master Ledger
1. Log in to your GGSIPU Google Workspace account (`@ipu.ac.in` / `@ggsipu.edu`).
2. Create a new Google Sheet named **`GGSIPU_Certificate_Master_Ledger`**.
3. Create three sheets (tabs) at the bottom:
   - **`CertificateLedger`**: Stores all issued, pending, and revoked certificates with SHA-256 and Merkle roots.
   - **`AuditLogs`**: Stores tamper-evident action logs of all user actions.
   - **`Revocations`**: Stores formal revocation records and reasons.

---

## Step 2: Bind Google Apps Script Backend
1. In your Google Sheet, click **Extensions -> Apps Script**.
2. Replace `Code.gs` with [`apps-script/Code.gs`](file:///E:/certVault/ggsipu-certVault/apps-script/Code.gs).
3. Create the following additional script files (**+ -> Script**):
   - `CryptoEngine.gs` &larr; copy from [`apps-script/CryptoEngine.gs`](file:///E:/certVault/ggsipu-certVault/apps-script/CryptoEngine.gs)
   - `CertGenerator.gs` &larr; copy from [`apps-script/CertGenerator.gs`](file:///E:/certVault/ggsipu-certVault/apps-script/CertGenerator.gs)
   - `ApprovalWorkflow.gs` &larr; copy from [`apps-script/ApprovalWorkflow.gs`](file:///E:/certVault/ggsipu-certVault/apps-script/ApprovalWorkflow.gs)
   - `RevocationLog.gs` &larr; copy from [`apps-script/RevocationLog.gs`](file:///E:/certVault/ggsipu-certVault/apps-script/RevocationLog.gs)
4. Enable the manifest file view (**Project Settings -> Show "appsscript.json" manifest file in editor**) and paste the contents of [`apps-script/appsscript.json`](file:///E:/certVault/ggsipu-certVault/apps-script/appsscript.json).

---

## Step 3: Configure Security & API Keys
1. In the Apps Script editor, click **Project Settings** (gear icon on the left sidebar).
2. Scroll to **Script Properties** and click **Add script property**.
3. Add the following property:
   - **Property**: `ADMIN_API_KEY`
   - **Value**: `[Set your strong secret admin key, e.g., GGSIPU_DSW_PROD_SECRET_2026]`
4. Click **Save script properties**.

> [!NOTE]
> Setting `ADMIN_API_KEY` ensures only authorized administrative portals can issue batches, approve certificates, revoke certificates, or export ledger dumps. Public verification endpoints (`verifyId` and `verifyHash`) remain open to anyone without credentials.

---

## Step 4: Deploy Apps Script Web App
1. Click **Deploy -> New Deployment**.
2. Select type: **Web App** (click the gear icon next to Select type).
3. Configuration:
   - **Description**: `GGSIPU DSW Certificate Verification API v2.0`
   - **Execute as**: `Me (your-email@ipu.ac.in)`
   - **Who has access**: `Anyone` *(Required so students, employers, and external verifiers can verify certificates via QR code without requiring a Google Workspace login)*
4. Click **Deploy** and grant Google OAuth Permissions (Spreadsheet, Drive, Gmail).
5. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 5: Configure Frontend Web Portal
1. Open [`/frontend/index.html`](file:///E:/certVault/ggsipu-certVault/frontend/index.html) in your browser or host the `/frontend/` folder on GitHub Pages / Firebase Hosting / GGSIPU Intranet.
2. Click the **API Config** button in the top navigation bar.
3. Enter your:
   - **Google Apps Script Web App URL**
   - **Admin API Key** (matching the `ADMIN_API_KEY` set in Script Properties)
4. Click **Save & Connect**.

---

## Step 6: Security & Workflow Verification
- **Bulk CSV Issuance**: New certificates are created in `Pending` status with batch Merkle root computed and persisted across all rows.
- **Approval Queue**: Competent authority signs on digital canvas to approve pending batches.
- **Revocation Protection**: Revoked certificates cannot be re-approved; active certificates require mandatory reason logging to revoke.
- **Public Verification**: Fast, unauthenticated QR scan, CertID lookup, or local PDF WebCrypto SHA-256 verification.
