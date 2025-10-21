const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all content sections (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM content_sections 
      WHERE is_active = true
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get content sections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single content section (public)
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(`
      SELECT * FROM content_sections 
      WHERE section_key = $1 AND is_active = true
    `, [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content section not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get content section error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update content section (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, image_url, button_text, button_url, metadata, is_active } = req.body;

    const result = await pool.query(`
      UPDATE content_sections SET
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        description = COALESCE($3, description),
        image_url = COALESCE($4, image_url),
        button_text = COALESCE($5, button_text),
        button_url = COALESCE($6, button_url),
        metadata = COALESCE($7, metadata),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [title, subtitle, description, image_url, button_text, button_url, metadata, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content section not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update content section error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

