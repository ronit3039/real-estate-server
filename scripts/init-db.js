const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');

    // Create tables
    await pool.query(`
      -- Admin Users Table
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Properties Table
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        location VARCHAR(255),
        price VARCHAR(100),
        price_numeric DECIMAL(15, 2),
        installment_years INTEGER,
        installment_text VARCHAR(100),
        initial_payment VARCHAR(100),
        completion_date VARCHAR(100),
        description TEXT,
        features TEXT[],
        bedrooms INTEGER,
        bathrooms INTEGER,
        area_sqft INTEGER,
        status VARCHAR(50) DEFAULT 'available',
        is_featured BOOLEAN DEFAULT false,
        image_urls TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Property Types Table
      CREATE TABLE IF NOT EXISTS property_types (
        id SERIAL PRIMARY KEY,
        type_id VARCHAR(10) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        gradient VARCHAR(255),
        size VARCHAR(50),
        icon_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Team Members Table
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        bio TEXT,
        image_url TEXT,
        linkedin_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Partners Table
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        logo_url TEXT,
        website_url TEXT,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- FAQs Table
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Leads/Inquiries Table
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT,
        property_id INTEGER REFERENCES properties(id),
        source VARCHAR(100) DEFAULT 'website',
        status VARCHAR(50) DEFAULT 'new',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to INTEGER REFERENCES admin_users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Stats Table
      CREATE TABLE IF NOT EXISTS site_stats (
        id SERIAL PRIMARY KEY,
        stat_key VARCHAR(100) UNIQUE NOT NULL,
        stat_value VARCHAR(100) NOT NULL,
        stat_label VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Stats Section Configuration Table
      CREATE TABLE IF NOT EXISTS stats_section_config (
        id SERIAL PRIMARY KEY,
        section_description TEXT,
        team_label TEXT,
        main_image_url TEXT,
        building_dreams_text VARCHAR(255),
        contact_button_text VARCHAR(255),
        special_offer_label VARCHAR(255),
        consultation_text TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Content Sections Table
      CREATE TABLE IF NOT EXISTS content_sections (
        id SERIAL PRIMARY KEY,
        section_key VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255),
        subtitle TEXT,
        description TEXT,
        image_url TEXT,
        button_text VARCHAR(100),
        button_url TEXT,
        metadata JSONB,
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
      CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
      CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
    `);

    console.log('✓ Tables created successfully');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO admin_users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@realestate.com', hashedPassword, 'Admin User', 'super_admin']);

    console.log('✓ Default admin user created (email: admin@realestate.com, password: admin123)');

    // Insert default stats
    await pool.query(`
      INSERT INTO site_stats (stat_key, stat_value, stat_label, display_order)
      VALUES 
        ('transactions_monthly', '95', 'Successful Transactions Monthly', 1),
        ('satisfaction_rate', '93', 'Customer Satisfaction Rate', 2),
        ('total_properties', '500', 'Exquisite Properties Ready for Your Selection', 3)
      ON CONFLICT (stat_key) DO NOTHING
    `);

    console.log('✓ Default stats inserted');

    // Insert default stats section configuration
    await pool.query(`
      INSERT INTO stats_section_config (
        section_description, 
        team_label, 
        building_dreams_text, 
        contact_button_text,
        special_offer_label,
        consultation_text
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [
      'At Golden Gate Properties, we offer more than just real estate services; we provide an unparalleled experience tailored to meet your needs and exceed your expectations.',
      'Meet Our\nProfessional Team',
      'Building Your Dreams',
      'Contact Us Now',
      'Special Offer',
      'Get The Consultation\nWith Our Expert'
    ]);

    console.log('✓ Default stats section config inserted');

    // Insert sample property types
    const propertyTypes = [
      { type_id: '01', title: 'Luxury Villas', gradient: 'linear-gradient(135deg, #6b9e65 0%, #8bb585 100%)', size: 'medium' },
      { type_id: '02', title: 'Penthouse Suites', gradient: 'linear-gradient(135deg, #a8915b 0%, #c9b37a 100%)', size: 'small' },
      { type_id: '03', title: 'Apartments', gradient: 'linear-gradient(135deg, #89b4d1 0%, #a3c2d6 100%)', size: 'small' },
      { type_id: '04', title: 'Beachfront Properties', gradient: 'linear-gradient(135deg, #5fa8d3 0%, #8fc9e8 100%)', size: 'medium' },
      { type_id: '05', title: 'Golf Course Residences', gradient: 'linear-gradient(135deg, #7ba876 0%, #9dc09f 100%)', size: 'large' },
      { type_id: '06', title: 'Commercial Spaces', gradient: 'linear-gradient(135deg, #d5d5d5 0%, #e8e8e8 100%)', size: 'medium' },
      { type_id: '07', title: 'Townhouses', gradient: 'linear-gradient(135deg, #95a5a6 0%, #b2babb 100%)', size: 'medium' },
      { type_id: '08', title: 'Waterfront Homes', gradient: 'linear-gradient(135deg, #4a9dbf 0%, #6db8d6 100%)', size: 'large' },
      { type_id: '09', title: 'Holiday Homes', gradient: 'linear-gradient(135deg, #a1a87d 0%, #b8bf91 100%)', size: 'small' },
      { type_id: '10', title: 'Investment Properties', gradient: 'linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%)', size: 'medium' },
      { type_id: '11', title: 'Eco-friendly Properties', gradient: 'linear-gradient(135deg, #b8c9b0 0%, #d0ddc8 100%)', size: 'large' },
      { type_id: '12', title: 'Desert Retreats', gradient: 'linear-gradient(135deg, #c19a6b 0%, #d4af7a 100%)', size: 'medium' }
    ];

    for (const pt of propertyTypes) {
      await pool.query(`
        INSERT INTO property_types (type_id, title, gradient, size, display_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (type_id) DO NOTHING
      `, [pt.type_id, pt.title, pt.gradient, pt.size, parseInt(pt.type_id)]);
    }

    console.log('✓ Property types inserted');

    // Insert sample partners
    const partners = [
      { name: 'DAMAC', subtitle: 'LIVE THE LUXURY', display_order: 1 },
      { name: 'EMAAR', subtitle: '', display_order: 2 },
      { name: 'NAKHEEL', subtitle: '', display_order: 3 },
      { name: 'SOBHA', subtitle: '', display_order: 4 },
      { name: 'MERAAS', subtitle: '', display_order: 5 }
    ];

    for (const partner of partners) {
      await pool.query(`
        INSERT INTO partners (name, subtitle, display_order)
        VALUES ($1, $2, $3)
      `, [partner.name, partner.subtitle, partner.display_order]);
    }

    console.log('✓ Partners inserted');

    // Insert sample FAQs
    const faqs = [
      {
        question: 'What types of properties do we offer in Dubai?',
        answer: 'We offer a diverse range of properties including luxury villas, penthouse suites, apartments, beachfront properties, golf course residences, commercial spaces, townhouses, waterfront homes, and more.',
        display_order: 1
      },
      {
        question: 'What are the payment options available for purchasing a property?',
        answer: 'We offer flexible payment plans including initial payments starting from $25,000, installment plans up to 10 years with 0% interest, and various financing options tailored to your needs.',
        display_order: 2
      },
      {
        question: 'Can foreign nationals buy property in Dubai?',
        answer: 'Yes, foreign nationals can buy property in designated freehold areas in Dubai. We assist you with all the legal requirements and ensure a smooth transaction process.',
        display_order: 3
      },
      {
        question: 'What is the process for obtaining a residency visa through property investment?',
        answer: 'Investing in real estate starting from AED 750,000 (approximately $204,000) offers the possibility of obtaining a resident visa. We guide you through the entire residency visa application process.',
        display_order: 4
      }
    ];

    for (const faq of faqs) {
      await pool.query(`
        INSERT INTO faqs (question, answer, display_order)
        VALUES ($1, $2, $3)
      `, [faq.question, faq.answer, faq.display_order]);
    }

    console.log('✓ FAQs inserted');

    console.log('\n✅ Database initialization completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();

