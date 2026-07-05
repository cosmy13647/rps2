const { Pool } = require('pg');
require('dotenv').config();

console.log(process.env.POSTGRES_URI);

const pool = new Pool({
    connectionString: process.env.POSTGRES_URI
});

module.exports = pool;