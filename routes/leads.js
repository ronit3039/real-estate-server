const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all leads (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, priority, limit, offset } = req.query;
    
    let query = `
      SELECT l.*, p.title as property_title, a.full_name as assigned_to_name
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN admin_users a ON l.assigned_to = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND l.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND l.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += ' ORDER BY l.created_at DESC';

    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      paramCount++;
    }

    if (offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));
    }

    const result = await pool.query(query, params);
    
    const countResult = await pool.query('SELECT COUNT(*) FROM leads');
    
    res.json({
      leads: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single lead (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT l.*, p.title as property_title, a.full_name as assigned_to_name
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN admin_users a ON l.assigned_to = a.id
      WHERE l.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create lead (public - from website form)
router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, message, property_id, source } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await pool.query(`
      INSERT INTO leads (full_name, email, phone, message, property_id, source)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [full_name, email, phone, message, property_id, source || 'website']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update lead (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, notes, full_name, email, phone, message } = req.body;

    const result = await pool.query(`
      UPDATE leads SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        message = COALESCE($4, message),
        status = COALESCE($5, status),
        priority = COALESCE($6, priority),
        assigned_to = COALESCE($7, assigned_to),
        notes = COALESCE($8, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [full_name, email, phone, message, status, priority, assigned_to, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete lead (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get lead statistics (protected)
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
      FROM leads
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

