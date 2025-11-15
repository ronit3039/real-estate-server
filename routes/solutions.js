const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, deleteFile, getFilePathFromUrl } = require('../middleware/upload');

const router = express.Router();

// Get all solutions (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM solutions 
      WHERE is_active = true 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get solutions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all solutions including inactive (protected)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM solutions 
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all solutions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single solution (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM solutions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solution not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get solution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload solution image
router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/solutions/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create solution (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, number, image_url, display_order, is_active } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(`
      INSERT INTO solutions (title, number, image_url, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      title,
      number || null,
      image_url || null,
      display_order || 0,
      is_active !== undefined ? is_active : true
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create solution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update solution (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, number, image_url, display_order, is_active } = req.body;

    // If image is being updated, delete old image
    if (image_url) {
      const oldSolution = await pool.query('SELECT image_url FROM solutions WHERE id = $1', [id]);
      if (oldSolution.rows.length > 0 && oldSolution.rows[0].image_url) {
        const oldImagePath = getFilePathFromUrl(oldSolution.rows[0].image_url);
        if (oldImagePath && oldSolution.rows[0].image_url !== image_url) {
          deleteFile(oldImagePath);
        }
      }
    }

    const result = await pool.query(`
      UPDATE solutions SET
        title = COALESCE($1, title),
        number = COALESCE($2, number),
        image_url = COALESCE($3, image_url),
        display_order = COALESCE($4, display_order),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [title, number, image_url, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solution not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update solution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete solution (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get solution to delete associated image
    const solution = await pool.query('SELECT image_url FROM solutions WHERE id = $1', [id]);
    
    if (solution.rows.length === 0) {
      return res.status(404).json({ error: 'Solution not found' });
    }

    // Delete associated image
    if (solution.rows[0].image_url) {
      const filePath = getFilePathFromUrl(solution.rows[0].image_url);
      if (filePath) {
        deleteFile(filePath);
      }
    }

    // Delete from database
    await pool.query('DELETE FROM solutions WHERE id = $1', [id]);

    res.json({ message: 'Solution deleted successfully' });
  } catch (error) {
    console.error('Delete solution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


