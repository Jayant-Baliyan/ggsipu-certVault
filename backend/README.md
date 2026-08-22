# CertVault Backend API & NeonDB Authentication

Express.js backend providing real-time PostgreSQL database authentication and staff management with NeonDB.

## Features

- **Direct NeonDB Authentication**: Authenticates email and password queries directly against PostgreSQL in NeonDB.
- **Zero Hardcoded Users**: Dynamic user lifecycle and role enforcement.
- **Auto Schema Initialization**: Auto-creates the `users` table upon connection if not present.
- **Windows IPv4 DNS Optimization**: Automatically configures `ipv4first` and custom pool DNS lookup to avoid Windows IPv6 CNAME `ENOTFOUND` errors.
- **RESTful Endpoints**: Full CRUD support for staff members.

---

## Configuration (`.env`)

Add your NeonDB connection string in `backend/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:5500
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-ancient-glitter-aznti8xi-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

---

## API Endpoints

### 1. Health Check
```http
GET http://localhost:5000/api/health
```
**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "CertVault API is running"
}
```

### 2. User Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@certvault.demo",
  "password": "CertVault@123"
}
```
**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 4,
    "name": "Admin",
    "email": "admin@certvault.demo",
    "role": "ADMIN",
    "created_at": "2026-08-21T18:18:23.741Z"
  }
}
```

### 3. List Staff Users
```http
GET http://localhost:5000/api/auth/users
```
**Response (`200 OK`)**:
```json
{
  "success": true,
  "count": 10,
  "users": [
    {
      "id": 4,
      "name": "Admin",
      "email": "admin@certvault.demo",
      "role": "ADMIN",
      "is_active": true,
      "created_at": "2026-08-21T18:18:23.741Z"
    }
  ]
}
```

### 4. Create or Update Staff User
```http
POST http://localhost:5000/api/auth/users
Content-Type: application/json

{
  "name": "Prof. R. K. Sharma",
  "email": "rk.sharma@ipu.ac.in",
  "password": "SecurePassword@123",
  "role": "APPROVER",
  "is_active": true
}
```

### 5. Remove Staff User
```http
DELETE http://localhost:5000/api/auth/users/:id
```
