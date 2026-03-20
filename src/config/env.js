'use strict';

require('dotenv').config();

const REQUIRED_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

function validateEnv() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`[startup] Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };
