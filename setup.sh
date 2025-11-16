# Step 4: Create .env file
echo -e "${YELLOW}[4/8] Setting up environment configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm .env
    else
        echo -e "${GREEN}✓ Using existing .env file${NC}"
    fi
fi

if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    
    # Database info
    read -p "Database name [real_estate_db]: " DB_NAME
    DB_NAME=${DB_NAME:-real_estate_db}

    read -p "Database user [real_estate_user]: " DB_USER
    DB_USER=${DB_USER:-real_estate_user}

    read -sp "Database password (leave blank to auto-generate): " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 16)
        echo -e "${YELLOW}⚠️  Generated DB password: $DB_PASSWORD${NC}"
    fi

    # URL-encode password for PostgreSQL connection
    url_encode() {
        local length="${#1}"
        for (( i = 0; i < length; i++ )); do
            local c="${1:i:1}"
            case $c in
                [a-zA-Z0-9.~_-]) printf "$c" ;;
                *) printf '%%%02X' "'$c"
            esac
        done
    }
    DB_PASSWORD_ENCODED=$(url_encode "$DB_PASSWORD")

    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    # JWT secret
    JWT_SECRET=$(openssl rand -base64 32)

    # Write .env with encoded password
    cat > .env << EOF
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:${DB_PORT}/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
EOF

    echo -e "${GREEN}✓ .env file created with URL-encoded password${NC}"
    echo -e "${YELLOW}⚠️  JWT_SECRET has been auto-generated. Keep it secure!${NC}"
fi

