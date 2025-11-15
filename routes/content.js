const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, deleteFile, getFilePathFromUrl } = require('../middleware/upload');

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

// Create content section (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { section_key, title, subtitle, description, image_url, button_text, button_url, metadata, is_active } = req.body;

    if (!section_key) {
      return res.status(400).json({ error: 'Section key is required' });
    }

    const result = await pool.query(`
      INSERT INTO content_sections (
        section_key, title, subtitle, description, image_url, 
        button_text, button_url, metadata, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      section_key, 
      title || null, 
      subtitle || null, 
      description || null, 
      image_url || null,
      button_text || null, 
      button_url || null, 
      metadata || null, 
      is_active !== undefined ? is_active : true
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create content section error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Content section with this key already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload content image
router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/content/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update content section (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, image_url, button_text, button_url, metadata, is_active } = req.body;

    // If image is being updated, delete old image
    if (image_url) {
      const oldContent = await pool.query('SELECT image_url FROM content_sections WHERE id = $1', [id]);
      if (oldContent.rows.length > 0 && oldContent.rows[0].image_url) {
        const oldImagePath = getFilePathFromUrl(oldContent.rows[0].image_url);
        if (oldImagePath && oldContent.rows[0].image_url !== image_url) {
          deleteFile(oldImagePath);
        }
      }
    }

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
