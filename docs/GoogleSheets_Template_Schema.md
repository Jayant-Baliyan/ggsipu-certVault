# GGSIPU Certificate System - Google Sheets Schema Documentation

## Sheets Structure

### 1. `CertificateLedger` Sheet
Stores all issued, pending, and revoked certificates with cryptographic proof hashes.

| Column Header | Data Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `CertID` | String | Unique Certificate Identifier | `GGSIPU-2026-DSW-1001` |
| `RollNumber` | String | Student Roll Number | `01216403221` |
| `StudentName` | String | Full Name of Recipient | `Aarav Sharma` |
| `School` | String | University School / Centre | `USICT` |
| `Course` | String | Degree / Course Name | `B.Tech CSE` |
| `EventName` | String | Event / Hackathon Title | `Smart India Hackathon 2026` |
| `IssueDate` | Date | Date of Certificate Issuance | `2026-08-15` |
| `Status` | Enum | `Draft` \| `Pending` \| `Approved` \| `Issued` \| `Revoked` | `Approved` |
| `SHA256Hash` | Hex String | Cryptographic SHA-256 Digest | `a3b9c7...` |
| `MerkleRoot` | Hex String | Batch Merkle Tree Root | `8f2d4e...` |
| `DrivePdfUrl` | URL | Encrypted PDF link in Drive | `https://drive.google.com/...` |
| `QrVerificationUrl` | URL | Public Verification Link | `https://ggsipu.ac.in/...` |
| `ApprovedBy` | String | Authority Name & Designation | `Prof. Dean DSW` |
| `ApprovalDate` | Date | Date of Competent Sign-off | `2026-08-15` |

---

### 2. `AuditLogs` Sheet
Immutable log recording all user actions, approvals, and revocations for security auditing.

| Column Header | Data Type | Description |
| :--- | :--- | :--- |
| `Timestamp` | ISO String | Date & Time of action |
| `EventType` | Enum | `BATCH_ISSUANCE` \| `APPROVAL` \| `REVOCATION` \| `VERIFICATION` |
| `Details` | Text | Description of action & cryptographic root |
| `PerformedBy` | String | Email or user identity |

---

### 3. `Revocations` Sheet
Detailed record of revoked certificates for fast blacklist checks.

| Column Header | Data Type | Description |
| :--- | :--- | :--- |
| `CertID` | String | Targeted Certificate ID |
| `RevocationReason` | Text | Formal reason for revocation |
| `RevokedBy` | String | Competent Authority |
| `RevocationTimestamp` | ISO String | Timestamp when status changed to Revoked |
