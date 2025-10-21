const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all FAQs (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM faqs WHERE is_active = true';
    const params = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' ORDER BY display_order ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create FAQ (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { question, answer, category, display_order } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const result = await pool.query(`
      INSERT INTO faqs (question, answer, category, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [question, answer, category, display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update FAQ (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, display_order, is_active } = req.body;

    const result = await pool.query(`
      UPDATE faqs SET
        question = COALESCE($1, question),
        answer = COALESCE($2, answer),
        category = COALESCE($3, category),
        display_order = COALESCE($4, display_order),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [question, answer, category, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete FAQ (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM faqs WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

