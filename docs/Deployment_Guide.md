# GGSIPU Certificate Management System - 10-Minute Deployment Guide

## Step 1: Set up Google Sheets Master Ledger
1. Log in to your GGSIPU Google Workspace account (`@ipu.ac.in` / `@ggsipu.edu`).
2. Create a new Google Sheet named **`GGSIPU_Certificate_Master_Ledger`**.
3. Create three tabs at the bottom:
   - `CertificateLedger`
   - `AuditLogs`
   - `Revocations`

## Step 2: Bind Google Apps Script Backend
1. In your Google Sheet, click **Extensions -> Apps Script**.
2. Replace `Code.gs` with the provided [`Code.gs`](file:///C:/Users/mitta/.gemini/antigravity/scratch/ggsipu-cert-system/apps-script/Code.gs).
3. Create additional `.gs` files in the Apps Script editor:
   - `CryptoEngine.gs`
   - `CertGenerator.gs`
   - `ApprovalWorkflow.gs`
   - `RevocationLog.gs`
4. Copy the respective contents from the [`/apps-script/`](file:///C:/Users/mitta/.gemini/antigravity/scratch/ggsipu-cert-system/apps-script/) directory into each file.

## Step 3: Deploy Apps Script Web App
1. Click **Deploy -> New Deployment**.
2. Select type: **Web App**.
3. Description: `GGSIPU DSW Certificate Verification API v1.0`.
4. Execute as: **Me (your-email@ipu.ac.in)**.
5. Who has access: **Anyone** (Required for public QR code verification without login).
6. Click **Deploy** and grant Google OAuth Permissions (Spreadsheet, Drive, Gmail).
7. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

## Step 4: Configure Web App Portal
1. Open [`/frontend/app.js`](file:///C:/Users/mitta/.gemini/antigravity/scratch/ggsipu-cert-system/frontend/app.js).
2. Set the `GAS_API_URL` variable to your copied Apps Script Web App URL:
   ```javascript
   const GAS_API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
3. Host the `/frontend/` static files on GitHub Pages, Firebase Hosting, or GGSIPU Web Server.

## Step 5: Start Issuing & Verifying Certificates!
- Access the portal to upload bulk student CSV files.
- Submit certificates for Dean / Director approval.
- Scan QR codes using mobile devices or verify PDF SHA-256 hashes instantly!
