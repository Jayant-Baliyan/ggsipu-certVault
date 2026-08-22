const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DATABASE] WARNING: DATABASE_URL is not set in backend/.env');
}

const isLocalhost = connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'));

const resolver = new dns.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const pool = new Pool({
  connectionString,
  ssl: isLocalhost || process.env.DATABASE_SSL === 'false'
    ? false
    : (connectionString ? { rejectUnauthorized: false } : false),
  lookup: (hostname, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;

    resolver.resolve4(hostname, (resErr, addresses) => {
      if (!resErr && addresses && addresses.length > 0) {
        return cb(null, addresses[0], 4);
      }

      dns.lookup(hostname, { family: 4 }, (err, address, family) => {
        if (!err && address) {
          return cb(null, address, family || 4);
        }
        cb(resErr || err);
      });
    });
  },
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle PostgreSQL client:', err.message || err);
});

/**
 * Initializes the database schema in NeonDB if tables do not already exist.
 */
async function initDb() {
  if (!connectionString) {
    console.warn('[DATABASE] Skipping table initialization: No DATABASE_URL provided.');
    return;
  }

  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const createCertificatesTableQuery = `
    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      cert_id VARCHAR(100) UNIQUE NOT NULL,
      roll_number VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      course VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      cert_type VARCHAR(100) NOT NULL DEFAULT 'Participation',
      issue_date DATE NOT NULL,
      hash VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      pdf_url VARCHAR(500),
      pdf_file_id VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates (cert_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status);

    -- Ensure pdf_url and pdf_file_id exist in case table was created previously
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pdf_file_id VARCHAR(255);
  `;

  try {
    await pool.query(createUsersTableQuery);
    console.log('[DATABASE] NeonDB users table verified/initialized.');
    await pool.query(createCertificatesTableQuery);
    console.log('[DATABASE] NeonDB certificates table verified/initialized with PDF columns.');
  } catch (err) {
    console.error('[DATABASE] Error during database initialization:', err.message || err);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb,
  getClient: () => pool.connect(),
};
