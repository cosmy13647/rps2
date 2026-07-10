const pool = require('../config/db');

// GET /api/menu — public, customer-facing
exports.getMenu = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, category, image_url
       FROM menu_items
       WHERE is_available = true
       ORDER BY category ASC, name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ message: 'Failed to fetch menu' });
  }
};

// POST /api/menu — temporary, protected. Full CRUD + Cloudinary upload
// lands with the admin/waiter dashboard build.
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image_url } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO menu_items (name, description, price, category, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, price, category || 'main', image_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Failed to create menu item' });
  }
};
