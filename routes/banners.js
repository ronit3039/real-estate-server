const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all banner items (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM banner_items 
      WHERE is_active = true 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get banner items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single banner item (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM banner_items WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Banner item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get banner item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create banner item (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text, display_order, is_active } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await pool.query(`
      INSERT INTO banner_items (text, display_order, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [text, display_order || 0, is_active !== undefined ? is_active : true]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create banner item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update banner item (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, display_order, is_active } = req.body;

    const result = await pool.query(`
      UPDATE banner_items SET
        text = COALESCE($1, text),
        display_order = COALESCE($2, display_order),
        is_active = COALESCE($3, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [text, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Banner item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update banner item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete banner item (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM banner_items WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Banner item not found' });
    }

    res.json({ message: 'Banner item deleted successfully' });
  } catch (error) {
    console.error('Delete banner item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;













