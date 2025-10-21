# Real Estate CRM - Backend Server

RESTful API server for Real Estate CRM and Website built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication**: JWT-based authentication for admin users
- **Properties Management**: CRUD operations for property listings
- **Property Types**: Manage different categories of properties
- **Team Management**: Team member profiles
- **Partners**: Partner/developer companies
- **FAQs**: Frequently asked questions
- **Lead Management**: Customer inquiry and lead tracking
- **Stats**: Site statistics management
- **Content Management**: Dynamic content sections

## Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/real_estate_crm
PORT=5000
JWT_SECRET=your_secure_secret_key
NODE_ENV=development
```

4. Initialize the database:
```bash
npm run init-db
```

This will create all tables and insert sample data.

### Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## Default Admin Credentials

- Email: `admin@realestate.com`
- Password: `admin123`

**⚠️ Change these credentials after first login!**

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Properties
- `GET /api/properties` - Get all properties (public)
- `GET /api/properties/:id` - Get single property (public)
- `POST /api/properties` - Create property (protected)
- `PUT /api/properties/:id` - Update property (protected)
- `DELETE /api/properties/:id` - Delete property (protected)

### Property Types
- `GET /api/property-types` - Get all types (public)
- `POST /api/property-types` - Create type (protected)
- `PUT /api/property-types/:id` - Update type (protected)
- `DELETE /api/property-types/:id` - Delete type (protected)

### Team
- `GET /api/team` - Get all team members (public)
- `POST /api/team` - Create team member (protected)
- `PUT /api/team/:id` - Update team member (protected)
- `DELETE /api/team/:id` - Delete team member (protected)

### Partners
- `GET /api/partners` - Get all partners (public)
- `POST /api/partners` - Create partner (protected)
- `PUT /api/partners/:id` - Update partner (protected)
- `DELETE /api/partners/:id` - Delete partner (protected)

### FAQs
- `GET /api/faqs` - Get all FAQs (public)
- `POST /api/faqs` - Create FAQ (protected)
- `PUT /api/faqs/:id` - Update FAQ (protected)
- `DELETE /api/faqs/:id` - Delete FAQ (protected)

### Leads
- `GET /api/leads` - Get all leads (protected)
- `GET /api/leads/:id` - Get single lead (protected)
- `POST /api/leads` - Create lead (public - from website)
- `PUT /api/leads/:id` - Update lead (protected)
- `DELETE /api/leads/:id` - Delete lead (protected)
- `GET /api/leads/stats/overview` - Get lead statistics (protected)

### Stats
- `GET /api/stats` - Get all stats (public)
- `PUT /api/stats/:id` - Update stat (protected)

### Content
- `GET /api/content` - Get all content sections (public)
- `GET /api/content/:key` - Get content by key (public)
- `PUT /api/content/:id` - Update content (protected)

## Database Schema

The database includes the following tables:
- `admin_users` - Admin user accounts
- `properties` - Property listings
- `property_types` - Property categories
- `team_members` - Team member profiles
- `partners` - Partner companies
- `faqs` - FAQ entries
- `leads` - Customer inquiries
- `site_stats` - Site statistics
- `content_sections` - Dynamic content

## Security

- JWT authentication for protected routes
- Bcrypt password hashing
- Helmet.js for security headers
- CORS enabled for cross-origin requests

## License

MIT

