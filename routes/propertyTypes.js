const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, deleteFile, getFilePathFromUrl } = require('../middleware/upload');

const router = express.Router();

// Get all property types (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM property_types 
      WHERE is_active = true 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get property types error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload property type icon
router.post('/upload-icon', authMiddleware, upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const iconUrl = `/uploads/property-types/${req.file.filename}`;
    res.json({ iconUrl });
  } catch (error) {
    console.error('Upload icon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create property type (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type_id, title, description, gradient, size, icon_url, display_order } = req.body;

    if (!type_id || !title) {
      return res.status(400).json({ error: 'Type ID and title are required' });
    }

    const result = await pool.query(`
      INSERT INTO property_types (type_id, title, description, gradient, size, icon_url, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [type_id, title, description, gradient, size, icon_url, display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create property type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update property type (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type_id, title, description, gradient, size, icon_url, display_order, is_active } = req.body;

    // If icon is being updated, delete old icon
    if (icon_url) {
      const oldType = await pool.query('SELECT icon_url FROM property_types WHERE id = $1', [id]);
      if (oldType.rows.length > 0 && oldType.rows[0].icon_url) {
        const oldIconPath = getFilePathFromUrl(oldType.rows[0].icon_url);
        if (oldIconPath && oldType.rows[0].icon_url !== icon_url) {
          deleteFile(oldIconPath);
        }
      }
    }

    const result = await pool.query(`
      UPDATE property_types SET
        type_id = COALESCE($1, type_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        gradient = COALESCE($4, gradient),
        size = COALESCE($5, size),
        icon_url = COALESCE($6, icon_url),
        display_order = COALESCE($7, display_order),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [type_id, title, description, gradient, size, icon_url, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property type not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update property type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete property type (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get property type to delete associated icon
    const propertyType = await pool.query('SELECT icon_url FROM property_types WHERE id = $1', [id]);
    
    if (propertyType.rows.length === 0) {
      return res.status(404).json({ error: 'Property type not found' });
    }

    // Delete associated icon
    if (propertyType.rows[0].icon_url) {
      const filePath = getFilePathFromUrl(propertyType.rows[0].icon_url);
      if (filePath) {
        deleteFile(filePath);
      }
    }

    // Delete from database
    await pool.query('DELETE FROM property_types WHERE id = $1', [id]);

    res.json({ message: 'Property type deleted successfully' });
  } catch (error) {
    console.error('Delete property type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
