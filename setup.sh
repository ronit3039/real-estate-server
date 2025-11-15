#!/bin/bash

# Automated Setup Script for Real Estate Server
# Run this script after cloning the repository on your server
# Usage: ./setup.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Real Estate Server - Automated Setup                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please don't run this script as root. Run as your user.${NC}"
   exit 1
fi

# Step 1: Check Node.js
echo -e "${YELLOW}[1/8] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
echo ""

# Step 2: Check PostgreSQL
echo -e "${YELLOW}[2/8] Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL found${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}[3/8] Installing npm dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install --production
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 4: Create .env file
echo -e "${YELLOW}[4/8] Setting up environment configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Keeping existing .env file${NC}"
    else
        rm .env
    fi
fi

if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    
    # Get database credentials
    echo ""
    read -p "Database name [real_estate_db]: " DB_NAME
    DB_NAME=${DB_NAME:-real_estate_db}
    
    read -p "Database user [real_estate_user]: " DB_USER
    DB_USER=${DB_USER:-real_estate_user}
    
    read -sp "Database password: " DB_PASSWORD
    echo ""
    DB_PASSWORD=${DB_PASSWORD:-}
    
    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Create .env file
    cat > .env << EOF
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
EOF
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠️  JWT_SECRET has been auto-generated. Keep it secure!${NC}"
else
    echo -e "${GREEN}✓ Using existing .env file${NC}"
fi
echo ""

# Step 5: Create database
echo -e "${YELLOW}[5/8] Setting up database...${NC}"
read -p "Do you want to create the database and user? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Extract database info from .env
    source .env
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    echo -e "${BLUE}Creating database: $DB_NAME${NC}"
    echo -e "${BLUE}Creating user: $DB_USER${NC}"
    
    # Create database and user
    sudo -u postgres psql << EOF
-- Create database
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Create user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
    
    echo -e "${GREEN}✓ Database and user created${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping database creation. Make sure database exists.${NC}"
fi
echo ""

# Step 6: Initialize database
echo -e "${YELLOW}[6/8] Initializing database tables...${NC}"
npm run init-db
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database initialized successfully${NC}"
else
    echo -e "${RED}❌ Database initialization failed. Please check your database connection.${NC}"
    exit 1
fi
echo ""

# Step 7: Create uploads directory
echo -e "${YELLOW}[7/8] Setting up uploads directory...${NC}"
mkdir -p uploads
chmod 775 uploads
echo -e "${GREEN}✓ Uploads directory created${NC}"
echo ""

# Step 8: Install PM2
echo -e "${YELLOW}[8/8] Checking PM2 installation...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}Installing PM2 globally...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Complete!                                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Backend server is ready to start!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Start the server: ${BLUE}pm2 start ../ecosystem.config.js${NC}"
echo "  2. Or start manually: ${BLUE}npm start${NC}"
echo "  3. Save PM2 config: ${BLUE}pm2 save${NC}"
echo "  4. Set up auto-start: ${BLUE}pm2 startup${NC}"
echo ""
echo -e "${YELLOW}Default admin credentials:${NC}"
echo "  Email: ${BLUE}admin@realestate.com${NC}"
echo "  Password: ${BLUE}admin123${NC}"
echo -e "${RED}⚠️  Change the password after first login!${NC}"
echo ""

