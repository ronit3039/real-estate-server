const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');
const propertyTypesRoutes = require('./routes/propertyTypes');
const teamRoutes = require('./routes/team');
const partnersRoutes = require('./routes/partners');
const faqsRoutes = require('./routes/faqs');
const leadsRoutes = require('./routes/leads');
const statsRoutes = require('./routes/stats');
const contentRoutes = require('./routes/content');
const bannersRoutes = require('./routes/banners');
const catalogRoutes = require('./routes/catalog');
const solutionsRoutes = require('./routes/solutions');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP to allow images from same origin
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (both with and without /api prefix)
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/property-types', propertyTypesRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/solutions', solutionsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;

