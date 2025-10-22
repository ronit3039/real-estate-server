const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload directory based on the route
    let uploadDir = 'uploads/properties'; // default
    
    if (req.baseUrl.includes('/partners')) {
      uploadDir = 'uploads/partners';
    } else if (req.baseUrl.includes('/property-types')) {
      uploadDir = 'uploads/property-types';
    } else if (req.baseUrl.includes('/team')) {
      uploadDir = 'uploads/team';
    } else if (req.baseUrl.includes('/content')) {
      uploadDir = 'uploads/content';
    } else if (req.baseUrl.includes('/stats')) {
      uploadDir = 'uploads/stats';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Helper function to delete a file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to get file path from URL
const getFilePathFromUrl = (url) => {
  if (!url) return null;
  
  // Remove leading slash and domain if present
  const cleanUrl = url.replace(/^https?:\/\/[^\/]+/, '').replace(/^\//, '');
  
  return cleanUrl;
};

module.exports = {
  upload,
  deleteFile,
  getFilePathFromUrl
};



