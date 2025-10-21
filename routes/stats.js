const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all stats (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM site_stats 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stat (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { stat_value, stat_label } = req.body;

    const result = await pool.query(`
      UPDATE site_stats SET
        stat_value = COALESCE($1, stat_value),
        stat_label = COALESCE($2, stat_label),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [stat_value, stat_label, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stat not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update stat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

