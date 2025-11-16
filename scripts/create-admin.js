const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    const email = process.argv[2] || 'admin@gmail.com';
    const password = process.argv[3] || '12345678';
    const fullName = process.argv[4] || 'Admin User';
    const role = process.argv[5] || 'super_admin';

    console.log(`🔄 Creating admin user: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(`
      INSERT INTO admin_users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = EXCLUDED.password,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, full_name, role
    `, [email, hashedPassword, fullName, role]);

    if (result.rows.length > 0) {
      console.log('✅ Admin user created/updated successfully!');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Name: ${result.rows[0].full_name}`);
      console.log(`   Role: ${result.rows[0].role}`);
      console.log(`   Password: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

