const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const CATALOG_DIR = path.join(process.cwd(), 'uploads', 'content');
const CATALOG_PATH = path.join(CATALOG_DIR, 'catalog.pdf');

// Storage for PDF only
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(CATALOG_DIR)) {
      fs.mkdirSync(CATALOG_DIR, { recursive: true });
    }
    cb(null, CATALOG_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, 'catalog.pdf');
  },
});

const pdfOnly = (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdf) return cb(null, true);
  cb(new Error('Only PDF files are allowed'));
};

const uploadPdf = multer({
  storage,
  fileFilter: pdfOnly,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Public: get current catalog URL if exists
router.get('/', (req, res) => {
  try {
    if (fs.existsSync(CATALOG_PATH)) {
      return res.json({ url: `/uploads/content/catalog.pdf` });
    }
    return res.json({ url: null });
  } catch (err) {
    console.error('Get catalog error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected: upload/replace catalog
router.post('/upload', authMiddleware, uploadPdf.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // File saved at CATALOG_PATH as catalog.pdf
    return res.json({ url: `/uploads/content/catalog.pdf` });
  } catch (err) {
    console.error('Upload catalog error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;








