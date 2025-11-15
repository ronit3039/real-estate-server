# Real Estate Server - Deployment Guide

This guide explains how to deploy the Real Estate Server after cloning the repository.

## Quick Start

### 1. Clone the Repository

```bash
cd /var/www
git clone <your-repo-url> real-estate-crm
cd real-estate-crm/real-estate-server
```

### 2. Run Automated Setup

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check Node.js and PostgreSQL installation
- ✅ Install npm dependencies
- ✅ Create `.env` file (interactive)
- ✅ Create database and user (optional)
- ✅ Initialize database tables
- ✅ Create uploads directory
- ✅ Install PM2 (if not installed)

### 3. Deploy the Server

```bash
chmod +x deploy.sh
cd ..  # Go to project root (where ecosystem.config.js is)
../real-estate-server/deploy.sh start
```

Or manually:
```bash
cd /var/www/real-estate-crm
pm2 start ecosystem.config.js
pm2 save
```

### 4. Set Up Auto-Start (Optional)

```bash
cd /var/www/real-estate-crm/real-estate-server
./deploy.sh autostart
# Follow the instructions to run the sudo command
```

## Deployment Commands

All deployment commands are in the `deploy.sh` script:

```bash
# Start server
./deploy.sh start

# Stop server
./deploy.sh stop

# Restart server
./deploy.sh restart

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Set up auto-start
./deploy.sh autostart
```

## Manual Deployment

If you prefer to deploy manually:

### 1. Install Dependencies

```bash
cd /var/www/real-estate-crm/real-estate-server
npm install --production
```

### 2. Configure Environment

Create `.env` file:

```bash
nano .env
```

Add:
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/real_estate_db
JWT_SECRET=your_secure_secret_here
```

Generate JWT secret:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE real_estate_db;
CREATE USER real_estate_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE real_estate_db TO real_estate_user;
\q
```

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Create Uploads Directory

```bash
mkdir -p uploads
chmod 775 uploads
```

### 6. Start with PM2

```bash
cd /var/www/real-estate-crm
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
```

## Verification

### Check Server Status

```bash
pm2 status
pm2 logs real-estate-server
```

### Test Health Endpoint

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-15T..."}
```

### Test API Endpoint

```bash
curl http://localhost:5001/api/health
```

## Default Admin Credentials

After running `npm run init-db`, a default admin user is created:

- **Email:** `admin@realestate.com`
- **Password:** `admin123`

⚠️ **Change the password immediately after first login!**

## Troubleshooting

### Server Won't Start

```bash
# Check logs
pm2 logs real-estate-server --lines 50

# Check if port is in use
sudo netstat -tulpn | grep 5001

# Verify .env file
cat .env
```

### Database Connection Issues

```bash
# Test database connection
psql "postgresql://user:password@localhost:5432/real_estate_db"

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/real-estate-crm

# Fix permissions
chmod -R 755 /var/www/real-estate-crm
chmod -R 775 /var/www/real-estate-crm/real-estate-server/uploads
```

## File Structure

```
real-estate-server/
├── setup.sh              # Automated setup script
├── deploy.sh             # Deployment management script
├── server.js             # Main server file
├── config/               # Configuration files
├── routes/               # API routes
├── middleware/           # Express middleware
├── scripts/              # Utility scripts
│   └── init-db.js       # Database initialization
├── uploads/              # Uploaded files (created by setup)
└── .env                  # Environment variables (created by setup)
```

## Environment Variables

Required environment variables in `.env`:

- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 5001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Updating the Server

When you need to update:

```bash
# Pull latest changes
cd /var/www/real-estate-crm
git pull

# Install new dependencies (if any)
cd real-estate-server
npm install --production

# Restart server
cd ..
./real-estate-server/deploy.sh restart
```

## Support

For issues, check:
- PM2 logs: `pm2 logs real-estate-server`
- System logs: `journalctl -u pm2-ronit` (if using systemd)
- Application logs: Check `logs/` directory if configured

