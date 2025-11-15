#!/bin/bash

# Automated Deployment Script for Real Estate Server
# This script starts/stops/restarts the server using PM2
# Usage: ./deploy.sh [start|stop|restart|status|logs]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed. Please install it first:${NC}"
    echo "   sudo npm install -g pm2"
    exit 1
fi

# Function to start server
start_server() {
    echo -e "${BLUE}Starting Real Estate Server...${NC}"
    cd "$PROJECT_ROOT"
    
    # Check if ecosystem.config.js exists
    if [ ! -f "ecosystem.config.js" ]; then
        echo -e "${RED}❌ ecosystem.config.js not found in project root${NC}"
        exit 1
    fi
    
    # Check if server is already running
    if pm2 list | grep -q "real-estate-server"; then
        echo -e "${YELLOW}⚠️  Server is already running. Use 'restart' to restart it.${NC}"
        pm2 status
        exit 0
    fi
    
    # Start server
    pm2 start ecosystem.config.js
    pm2 save
    
    echo -e "${GREEN}✅ Server started successfully!${NC}"
    echo ""
    pm2 status
    echo ""
    echo -e "${YELLOW}View logs:${NC} pm2 logs real-estate-server"
    echo -e "${YELLOW}Stop server:${NC} ./deploy.sh stop"
}

# Function to stop server
stop_server() {
    echo -e "${BLUE}Stopping Real Estate Server...${NC}"
    
    if pm2 list | grep -q "real-estate-server"; then
        pm2 stop real-estate-server
        pm2 save
        echo -e "${GREEN}✅ Server stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Server is not running${NC}"
    fi
}

# Function to restart server
restart_server() {
    echo -e "${BLUE}Restarting Real Estate Server...${NC}"
    
    if pm2 list | grep -q "real-estate-server"; then
        pm2 restart real-estate-server
        echo -e "${GREEN}✅ Server restarted${NC}"
    else
        echo -e "${YELLOW}⚠️  Server is not running. Starting it...${NC}"
        start_server
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}Real Estate Server Status:${NC}"
    echo ""
    pm2 status
    echo ""
    
    if pm2 list | grep -q "real-estate-server"; then
        echo -e "${GREEN}Testing health endpoint...${NC}"
        curl -s http://localhost:5001/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:5001/health
        echo ""
    fi
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}Real Estate Server Logs (Press Ctrl+C to exit):${NC}"
    pm2 logs real-estate-server
}

# Function to setup auto-start
setup_autostart() {
    echo -e "${BLUE}Setting up PM2 auto-start...${NC}"
    pm2 startup
    echo ""
    echo -e "${YELLOW}⚠️  Please run the command shown above with sudo${NC}"
}

# Main script logic
case "${1:-}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    autostart)
        setup_autostart
        ;;
    *)
        echo -e "${BLUE}Real Estate Server Deployment Script${NC}"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start      - Start the server with PM2"
        echo "  stop       - Stop the server"
        echo "  restart    - Restart the server"
        echo "  status     - Show server status and health"
        echo "  logs       - Show server logs (live)"
        echo "  autostart  - Set up PM2 auto-start on boot"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh start"
        echo "  ./deploy.sh status"
        echo "  ./deploy.sh logs"
        exit 1
        ;;
esac

