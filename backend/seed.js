require('dotenv').config();
const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
    const username = 'admin';
    const password = 'admin123';
    const full_name = 'System Admin';
    const role = 'admin';

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)`,
        [username, hash, full_name, role]
    );

    console.log('Admin created successfully');
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
