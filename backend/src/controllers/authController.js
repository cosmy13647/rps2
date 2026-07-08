const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        const user = result.rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        // 4. Return token and basic user info
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createUser = async (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;

        // Check if username already exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        // Insert and return new user
        const newUser = await pool.query(
            `INSERT INTO users (username, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, full_name, role`,
            [username, hash, full_name, role]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getWaiters = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name FROM users 
             WHERE role = 'waiter' AND is_active = true 
             ORDER BY full_name ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch waiters:', error);
        res.status(500).json({ message: 'Failed to fetch waiters' });
    }
};