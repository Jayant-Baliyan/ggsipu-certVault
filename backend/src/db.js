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

const pool = new Pool({
  connectionString,
  ssl: isLocalhost || process.env.DATABASE_SSL === 'false'
    ? false
    : (connectionString ? { rejectUnauthorized: false } : false),
  lookup: (hostname, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' ? { ...options, family: 4 } : { family: 4 };
    dns.lookup(hostname, opts, (err, address, family) => {
      if (!err && address) return cb(null, address, family);
      cb(err);
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

  try {
    await pool.query(createUsersTableQuery);
    console.log('[DATABASE] NeonDB users table verified/initialized successfully.');
  } catch (err) {
    console.error('[DATABASE] Error during database initialization:', err.message || err);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb,
};
