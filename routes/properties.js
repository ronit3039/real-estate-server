const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, deleteFile, getFilePathFromUrl } = require('../middleware/upload');

const router = express.Router();

// Get all properties (public)
router.get('/', async (req, res) => {
  try {
    const { type, category, status, featured, limit, offset } = req.query;
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (featured === 'true') {
      query += ` AND is_featured = true`;
    }

    query += ' ORDER BY created_at DESC';

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
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM properties');
    
    res.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single property (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload property images
router.post('/upload-images', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const imageUrls = req.files.map(file => `/uploads/properties/${file.filename}`);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create property (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title, type, category, location, price, price_numeric,
      installment_years, installment_text, initial_payment,
      completion_date, description, features, bedrooms, bathrooms,
      area_sqft, status, is_featured, image_urls
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const result = await pool.query(`
      INSERT INTO properties (
        title, type, category, location, price, price_numeric,
        installment_years, installment_text, initial_payment,
        completion_date, description, features, bedrooms, bathrooms,
        area_sqft, status, is_featured, image_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      title, type, category, location, price, price_numeric,
      installment_years, installment_text, initial_payment,
      completion_date, description, features, bedrooms, bathrooms,
      area_sqft, status || 'available', is_featured || false, 
      image_urls ? (Array.isArray(image_urls) ? image_urls : JSON.parse(image_urls)) : []
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update property (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, type, category, location, price, price_numeric,
      installment_years, installment_text, initial_payment,
      completion_date, description, features, bedrooms, bathrooms,
      area_sqft, status, is_featured, image_urls
    } = req.body;

    const result = await pool.query(`
      UPDATE properties SET
        title = COALESCE($1, title),
        type = COALESCE($2, type),
        category = COALESCE($3, category),
        location = COALESCE($4, location),
        price = COALESCE($5, price),
        price_numeric = COALESCE($6, price_numeric),
        installment_years = COALESCE($7, installment_years),
        installment_text = COALESCE($8, installment_text),
        initial_payment = COALESCE($9, initial_payment),
        completion_date = COALESCE($10, completion_date),
        description = COALESCE($11, description),
        features = COALESCE($12, features),
        bedrooms = COALESCE($13, bedrooms),
        bathrooms = COALESCE($14, bathrooms),
        area_sqft = COALESCE($15, area_sqft),
        status = COALESCE($16, status),
        is_featured = COALESCE($17, is_featured),
        image_urls = COALESCE($18, image_urls),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
    `, [
      title, type, category, location, price, price_numeric,
      installment_years, installment_text, initial_payment,
      completion_date, description, features, bedrooms, bathrooms,
      area_sqft, status, is_featured, 
      image_urls ? (Array.isArray(image_urls) ? image_urls : JSON.parse(image_urls)) : null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete property image
router.delete('/:id/images', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Get current property
    const property = await pool.query('SELECT image_urls FROM properties WHERE id = $1', [id]);
    
    if (property.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Remove image URL from array
    let imageUrls = property.rows[0].image_urls || [];
    imageUrls = imageUrls.filter(url => url !== imageUrl);

    // Update database
    await pool.query('UPDATE properties SET image_urls = $1 WHERE id = $2', [imageUrls, id]);

    // Delete physical file
    const filePath = getFilePathFromUrl(imageUrl);
    if (filePath) {
      deleteFile(filePath);
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete property image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete property (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get property to delete associated images
    const property = await pool.query('SELECT image_urls FROM properties WHERE id = $1', [id]);
    
    if (property.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Delete all associated images
    const imageUrls = property.rows[0].image_urls || [];
    imageUrls.forEach(url => {
      const filePath = getFilePathFromUrl(url);
      if (filePath) {
        deleteFile(filePath);
      }
    });

    // Delete from database
    await pool.query('DELETE FROM properties WHERE id = $1', [id]);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
