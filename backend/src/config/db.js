const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URI,
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;