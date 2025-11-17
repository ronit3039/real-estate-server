# Real Estate Server - Deployment Guide

This guide explains how to deploy the Real Estate Server after cloning the repository.

## Prerequisites

Before running the setup script, ensure you have the following installed:

### 1. Node.js (v18 or higher)

Check if Node.js is installed:
```bash
node --version
```

If not installed, install Node.js:
```bash
# Using NodeSource (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

### 2. PostgreSQL

Check if PostgreSQL is installed:
```bash
psql --version
```

If not installed, install PostgreSQL:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Verify PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

## Quick Start

### 1. Clone the Repository

If `/var/www` requires sudo permissions, use one of these methods:

**Option 1: Clone with sudo and fix ownership**
```bash
cd /var/www
sudo git clone https://github.com/ronit3039/real-estate-server.git real-estate-crm
sudo chown -R $USER:$USER real-estate-crm
cd real-estate-crm
```

**Option 2: Fix /var/www permissions first (if you have sudo access)**
```bash
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/ronit3039/real-estate-server.git real-estate-crm
cd real-estate-crm
```

**Option 3: Clone to home directory, then move**
```bash
cd ~
git clone https://github.com/ronit3039/real-estate-server.git real-estate-crm
sudo mv real-estate-crm /var/www/
cd /var/www/real-estate-crm
sudo chown -R $USER:$USER .
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
./deploy.sh start
```

Or manually:
```bash
cd /var/www/real-estate-crm
pm2 start server.js --name real-estate-server
pm2 save
```

### 4. Set Up Auto-Start (Optional)

```bash
cd /var/www/real-estate-crm
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
cd /var/www/real-estate-crm
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
pm2 start server.js --name real-estate-server
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
chmod -R 775 /var/www/real-estate-crm/uploads
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
npm install --production

# Restart server
./deploy.sh restart
```

## Support

For issues, check:
- PM2 logs: `pm2 logs real-estate-server`
- System logs: `journalctl -u pm2-ronit` (if using systemd)
- Application logs: Check `logs/` directory if configured




