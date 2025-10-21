const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all team members (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM team_members 
      WHERE is_active = true 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create team member (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { full_name, position, email, phone, bio, image_url, linkedin_url, display_order } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await pool.query(`
      INSERT INTO team_members (full_name, position, email, phone, bio, image_url, linkedin_url, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [full_name, position, email, phone, bio, image_url, linkedin_url, display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team member (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, position, email, phone, bio, image_url, linkedin_url, display_order, is_active } = req.body;

    const result = await pool.query(`
      UPDATE team_members SET
        full_name = COALESCE($1, full_name),
        position = COALESCE($2, position),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        bio = COALESCE($5, bio),
        image_url = COALESCE($6, image_url),
        linkedin_url = COALESCE($7, linkedin_url),
        display_order = COALESCE($8, display_order),
        is_active = COALESCE($9, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [full_name, position, email, phone, bio, image_url, linkedin_url, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete team member (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM team_members WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

