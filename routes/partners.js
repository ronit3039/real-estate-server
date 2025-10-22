const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, deleteFile, getFilePathFromUrl } = require('../middleware/upload');

const router = express.Router();

// Get all partners (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM partners 
      WHERE is_active = true 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload partner logo
router.post('/upload-logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = `/uploads/partners/${req.file.filename}`;
    res.json({ logoUrl });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create partner (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, subtitle, logo_url, website_url, description, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(`
      INSERT INTO partners (name, subtitle, logo_url, website_url, description, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, subtitle, logo_url, website_url, description, display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update partner (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subtitle, logo_url, website_url, description, display_order, is_active } = req.body;

    // If logo is being updated, delete old logo
    if (logo_url) {
      const oldPartner = await pool.query('SELECT logo_url FROM partners WHERE id = $1', [id]);
      if (oldPartner.rows.length > 0 && oldPartner.rows[0].logo_url) {
        const oldLogoPath = getFilePathFromUrl(oldPartner.rows[0].logo_url);
        if (oldLogoPath && oldPartner.rows[0].logo_url !== logo_url) {
          deleteFile(oldLogoPath);
        }
      }
    }

    const result = await pool.query(`
      UPDATE partners SET
        name = COALESCE($1, name),
        subtitle = COALESCE($2, subtitle),
        logo_url = COALESCE($3, logo_url),
        website_url = COALESCE($4, website_url),
        description = COALESCE($5, description),
        display_order = COALESCE($6, display_order),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, subtitle, logo_url, website_url, description, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete partner (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get partner to delete associated logo
    const partner = await pool.query('SELECT logo_url FROM partners WHERE id = $1', [id]);
    
    if (partner.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Delete associated logo
    if (partner.rows[0].logo_url) {
      const filePath = getFilePathFromUrl(partner.rows[0].logo_url);
      if (filePath) {
        deleteFile(filePath);
      }
    }

    // Delete from database
    await pool.query('DELETE FROM partners WHERE id = $1', [id]);

    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
