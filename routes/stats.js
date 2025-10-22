const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, deleteFile, getFilePathFromUrl } = require('../middleware/upload');

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

// Get stats section configuration (public)
router.get('/config', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM stats_section_config LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      // Return default configuration if none exists
      return res.json({
        section_description: 'At Golden Gate Properties, we offer more than just real estate services; we provide an unparalleled experience tailored to meet your needs and exceed your expectations.',
        team_label: 'Meet Our\nProfessional Team',
        main_image_url: null,
        building_dreams_text: 'Building Your Dreams',
        contact_button_text: 'Contact Us Now',
        special_offer_label: 'Special Offer',
        consultation_text: 'Get The Consultation\nWith Our Expert'
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get stats config error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stats section configuration (protected)
router.put('/config/update', authMiddleware, upload.single('main_image'), async (req, res) => {
  try {
    const {
      section_description,
      team_label,
      building_dreams_text,
      contact_button_text,
      special_offer_label,
      consultation_text
    } = req.body;

    // Get current config to check for existing image
    const currentConfig = await pool.query(`
      SELECT * FROM stats_section_config LIMIT 1
    `);

    let main_image_url = null;

    // Handle image upload
    if (req.file) {
      main_image_url = `/uploads/stats/${req.file.filename}`;
      
      // Delete old image if it exists
      if (currentConfig.rows.length > 0 && currentConfig.rows[0].main_image_url) {
        const oldImagePath = getFilePathFromUrl(currentConfig.rows[0].main_image_url);
        if (oldImagePath) {
          deleteFile(oldImagePath);
        }
      }
    }

    let result;
    if (currentConfig.rows.length === 0) {
      // Insert new config
      result = await pool.query(`
        INSERT INTO stats_section_config (
          section_description,
          team_label,
          main_image_url,
          building_dreams_text,
          contact_button_text,
          special_offer_label,
          consultation_text,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        section_description,
        team_label,
        main_image_url,
        building_dreams_text,
        contact_button_text,
        special_offer_label,
        consultation_text
      ]);
    } else {
      // Update existing config
      result = await pool.query(`
        UPDATE stats_section_config SET
          section_description = COALESCE($1, section_description),
          team_label = COALESCE($2, team_label),
          main_image_url = COALESCE($3, main_image_url),
          building_dreams_text = COALESCE($4, building_dreams_text),
          contact_button_text = COALESCE($5, contact_button_text),
          special_offer_label = COALESCE($6, special_offer_label),
          consultation_text = COALESCE($7, consultation_text),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `, [
        section_description,
        team_label,
        main_image_url,
        building_dreams_text,
        contact_button_text,
        special_offer_label,
        consultation_text,
        currentConfig.rows[0].id
      ]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update stats config error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

