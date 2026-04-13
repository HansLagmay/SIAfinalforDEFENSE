# 🏠 TES Property Management System v2.0 - Real Estate Inquiry Management

A complete professional real estate management system with **React + Express** architecture, using **MySQL 8.0+** database with comprehensive security features and enterprise-grade functionality.

## 🎯 Project Overview

**Enterprise-grade property management platform** designed for real estate agencies, property management companies, and real estate brokers. This system provides separate portals for **Administrators**, **Agents**, and **Customers** with specialized workflows and security controls.

Your application is production-ready with:
- 🏢 Property Management - Create, list, manage listings with validation
- 📋 Inquiry System - Customer inquiries with agent assignment and tracking
- 📅 Calendar & Scheduling - Schedule property viewings with status tracking
- 👥 Multi-Role System - Admin, Agent, and Customer portals with role-based access
- 🔒 Enterprise Security - JWT auth, bcrypt hashing, input sanitization, rate limiting
- 📊 Agent Performance - Track metrics, conversion rates, and sales
- 🗄️ MySQL Database - Persistent storage with 10+ tables and automated backups

---

## ✨ Key Features

### 🎨 Customer Portal
- 🌐 **Public Property Browsing** - Browse all available properties without login
- 🔐 **Secure Authentication** - JWT-based login/signup system (30-day sessions)
- 📝 **Property Inquiries** - Submit authenticated inquiries with automatic ticket generation
- 📅 **Appointment Tracking** - View and manage scheduled property viewings
- 📊 **Inquiry Status** - Track inquiry progress in real-time
- ✅ **Duplicate Prevention** - One active inquiry per property safeguard

### 👨‍💼 Agent Portal
- 📋 **Inquiry Dashboard** - View available tickets and claimed assignments
- 🔄 **Inquiry Management** - Claim inquiries and manage status transitions
- 📅 **Calendar Integration** - Schedule viewings, reschedule, or cancel
- 🏠 **Property Listings** - Access available properties for showing
- 📊 **Performance Tracking** - View conversion rates and sales metrics
- 📱 **Notifications** - Receive updates on inquiry assignments

### 🔧 Admin Portal
- 🏠 **Property CRUD** - Create, edit, delete properties with multi-image upload
- 👥 **User Management** - Create and manage agent accounts with roles
- 📋 **Inquiry Assignment** - Assign inquiries to specific agents
- 📊 **Activity Logs** - View system-wide audit trail and user actions
- 📈 **Reports** - Generate sales and performance reports
- 🗄️ **Database Management** - Inspect and export database data

### 🗄️ Super Admin Portal
- 💾 **Database Access** - Direct access to all database tables
- 📁 **Data Export** - Export tables as JSON or CSV format
- 🔍 **Table Inspection** - View database structure and metadata
- 📊 **System Statistics** - Overall system health and usage metrics

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3+ | UI library |
| **TypeScript** | 5.9+ | Type-safe JavaScript |
| **React Router** | 6.30+ | Client-side routing |
| **Vite** | 5.4+ | Fast build tool |
| **Tailwind CSS** | 3.3+ | Utility-first CSS |
| **Axios** | 1.13+ | HTTP client |
| **Lucide React** | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.22+ | REST API framework |
| **MySQL** | 8.0+ | Relational database |
| **mysql2** | 3.6+ | MySQL driver with promises |
| **JWT** | 9.0+ | Authentication tokens |
| **bcryptjs** | 2.4+ | Password hashing (10 rounds) |
| **express-rate-limit** | 6.11+ | Rate limiting |
| **Helmet** | 7.0+ | Security headers |
| **Multer** | 2.0+ | File upload handling |
| **Vonage SDK** | 3.26+ | SMS verification |
| **dotenv** | 16.0+ | Environment variables |

### Database
| Technology | Purpose |
|------------|---------|
| **MySQL 8.0+** | Persistent relational data storage |
| **Connection Pooling** | 10-20 concurrent connections |
| **Automated Backups** | Scheduled backup system |

---

## 📦 Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** v9+
- **MySQL** 8.0+ (local or remote server)
- **Git**
- **VS Code** (recommended)

**No external JSON files needed!** This system uses MySQL database for reliable data persistence.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/HansLagmay/SIAfinalforDEFENSE.git
cd SIAfinalforDEFENSE
```

### 2. Install All Dependencies
```bash
npm install
```

This installs dependencies for root, client, and server automatically.

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Backend Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3000/api

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=TESdb

# JWT Configuration (Change this to a random string!)
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters-long
JWT_EXPIRE=30d

# Vonage SMS Service (Optional)
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM_NUMBER=+1234567890

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 4. Set Up Database

```bash
# Create database schema and tables
npm run db:schema

# Seed with demo data
npm run db:seed
```

### 5. Start the Application

```bash
npm run dev
```

This starts both:
- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:5173`

---

## 🌐 Access the Portals

| Portal | URL | Login Required | Test Account | Features |
|--------|-----|-----------------|--------------|----------|
| **Customer Portal** | `http://localhost:5173/` | ❌ No | N/A - Public | Browse properties, submit inquiries |
| **Login Page** | `http://localhost:5173/login` | - | See credentials below | Authentication |
| **Admin Portal** | `http://localhost:5173/admin` | ✅ Yes | admin@tesproperty.com / admin123 | Full system management |
| **Agent Portal** | `http://localhost:5173/agent` | ✅ Yes | maria@tesproperty.com / agent123 | Inquiry & calendar management |
| **Super Admin** | `http://localhost:5173/superadmin` | ✅ Yes | Use admin credentials | Database access |

### Admin Portal Features:
- Dashboard with real-time statistics
- Property management with CRUD operations
- Multi-image uploads per property
- Agent management and licensing
- Inquiry assignment and tracking
- Activity logs and audit trail
- Report generation and analytics

### Agent Portal Features:
- Dashboard with assigned inquiries
- Calendar for scheduling viewings
- Property listings for showing
- Inquiry management and status updates
- Commission and performance tracking

---

## 🗄️ MySQL Database Structure

Your data is stored in a MySQL database (`TESdb`) with these core tables:

```
TESdb/
├── users                       # Admin/Agent accounts
├── customers                   # Customer accounts
├── properties                  # Property listings
├── property_images            # Property photos
├── inquiries                   # Customer inquiries
├── calendar_events            # Viewing schedules
├── customer_appointments      # Appointment tracking
├── phone_verification_attempts # Rate limiting
├── phone_verification_log     # Audit trail
└── activity_log               # System activity
```

### Database Backup System
- Automatic backups created before major changes
- Manual backup: `mysqldump -u root -p TESdb > backup.sql`
- Restore: `mysql -u root -p TESdb < backup.sql`

---

## 🔑 Test Credentials

### Admin Account
- **Email**: `admin@tesproperty.com`
- **Password**: `admin123`
- **Access**: All features (properties, inquiries, agents, database, reports)
- **Role**: Full administrative access

### Agent Account
- **Email**: `maria@tesproperty.com`
- **Password**: `agent123`
- **Access**: Inquiries, calendar, available properties
- **Role**: Agent with assigned property management

### Customer Account
- Can register new account at `/login`
- Or use demo customer if available
- **Access**: Browse properties, submit inquiries, track appointments

⚠️ **Password Security**: 
- All passwords are **hashed** using bcrypt (not stored as plain text)
- Change default passwords before production deployment
- Minimum 8 characters required for new passwords

---

## 📋 Available Scripts

### Root Level Commands

```bash
# Start both frontend and backend concurrently
npm run dev

# Install all dependencies (root + client + server)
npm install

# Database commands
npm run db:schema       # Create database schema
npm run db:seed         # Seed demo data
npm run db:seed:demo    # Seed showcase data

# Build for production
npm run build
npm run preview
```

### Backend Commands (from root or server directory)

```bash
# Start backend only
npm run server

# Start backend with auto-reload
npm run server:dev

# Production mode
npm start
```

### Frontend Commands (from root or client directory)

```bash
# Start frontend only
npm run client

# Build frontend
cd client && npm run build

# Preview production build
cd client && npm run preview
```

---

## 🔌 API Endpoints

### Authentication (Public)

| Method | Endpoint | Description | Rate Limited |
|--------|----------|-------------|--------------|
| POST | `/api/auth/register` | Customer signup | ✅ 3/hour |
| POST | `/api/auth/login` | User login | ✅ 5/15min |
| POST | `/api/auth/user-login` | Admin/Agent login | ✅ 5/15min |
| GET | `/api/auth/me` | Get current user | ❌ |

### Properties

| Method | Endpoint | Description | Auth Required | Rate Limited |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/properties` | Get all properties (paginated) | ❌ Public | ❌ |
| GET | `/api/properties/:id` | Get single property | ❌ Public | ❌ |
| POST | `/api/properties` | Create property | ✅ Admin | ✅ 10/hour |
| PUT | `/api/properties/:id` | Update property | ✅ Admin/Agent | ❌ |
| DELETE | `/api/properties/:id` | Delete property | ✅ Admin | ❌ |

### Inquiries

| Method | Endpoint | Description | Auth Required | Rate Limited |
|--------|----------|-------------|---------------|--------------|
| POST | `/api/inquiries` | Submit inquiry | ✅ Customer | ✅ 3/hour |
| GET | `/api/inquiries` | Get all inquiries | ✅ Admin/Agent | ❌ |
| GET | `/api/inquiries/:id` | Get single inquiry | ✅ Admin/Agent | ❌ |
| PUT | `/api/inquiries/:id` | Update inquiry | ✅ Admin/Agent | ❌ |
| POST | `/api/inquiries/:id/claim` | Agent claims inquiry | ✅ Agent | ❌ |

### Calendar & Viewings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/calendar` | Get all events | ✅ Admin/Agent |
| POST | `/api/calendar` | Schedule viewing | ✅ Admin/Agent |
| PUT | `/api/calendar/:id` | Update event | ✅ Admin/Agent |
| DELETE | `/api/calendar/:id` | Cancel event | ✅ Admin/Agent |

### Users & Agents

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all agents | ✅ Admin |
| GET | `/api/users/agents` | Get agents list | ✅ Admin |
| POST | `/api/users` | Create agent | ✅ Admin |
| DELETE | `/api/users/:id` | Delete agent | ✅ Admin |

---

## 🔐 Security Features

### ✅ Implemented Security

- **Password Hashing** - bcrypt with 10 salt rounds
- **JWT Authentication** - 30-day session tokens
- **Input Sanitization** - XSS protection on all user inputs
- **Rate Limiting** - API protection (1000 requests/min general, 5 attempts/15min login)
- **Session Management** - Auto-logout on token expiration
- **File Upload Validation** - Type and size limits
- **CORS Protection** - Whitelist allowed origins only
- **Helmet Security Headers** - HTTP security headers
- **Duplicate Prevention** - Prevent duplicate inquiries per property
- **Audit Trail** - Track all changes with user, timestamp, action
- **SQL Injection Prevention** - Parameterized queries (mysql2)
- **Error Handling** - User-friendly messages with retry options

---

## 🧪 Testing the System

### 1. Test Customer Portal (Public Access)
```bash
# Open browser
http://localhost:5173/

# Expected: See property listings without login
# Actions: Browse properties, submit inquiry
```

### 2. Test Admin Login
```bash
# Navigate to login
http://localhost:5173/login

# Credentials:
Email: admin@tesproperty.com
Password: admin123

# Expected: Redirect to admin dashboard
# Verify: Dashboard shows statistics
```

### 3. Test Security Features

**Password Hashing:**
```bash
# Check users in database
mysql -u root -p TESdb
SELECT * FROM users LIMIT 1;

# Verify passwords start with $2b$ (bcrypt hash)
```

**Rate Limiting:**
```bash
# Try 6 failed login attempts
# Expected: "Too many attempts" after 5th attempt
```

### 4. Test API Endpoints
```bash
# Test public endpoint
curl http://localhost:3000/api/properties

# Test protected endpoint
curl http://localhost:3000/api/inquiries

# Expected: 401 Unauthorized (no token)
```

---

## 📁 Project Structure

```
SIAfinalforDEFENSE/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── admin/         # Admin portal components
│   │   │   ├── agent/         # Agent portal components
│   │   │   ├── customer/      # Customer portal components
│   │   │   ├── shared/        # Shared components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services (Axios)
│   │   ├── types/             # TypeScript definitions
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx            # Main app component
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                      # Express backend application
│   ├── routes/                # API route handlers
│   │   ├── auth.js
│   │   ├── properties.js
│   │   ├── inquiries.js
│   │   ├── calendar.js
│   │   ├── users.js
│   │   ├── customers.js
│   │   ├── activity-log.js
│   │   └── database.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── validators.js
│   │   └── logger.js
│   ├── sql/                   # Database migration scripts
│   │   ├── schema.sql         # Main schema
│   │   ├── property_agent_ownership.sql
│   │   ├── customer_auth_migration.sql
│   │   ├── add_phone_verification.sql
│   │   └── [more migrations]
│   ├── scripts/               # Database setup scripts
│   ├── services/              # Business logic
│   ├── utils/                 # Utilities
│   ├── uploads/               # Uploaded property images
│   ├── db.js                  # Database connection
│   ├── index.js               # Server entry point
│   └── package.json
│
├── scripts/                     # Root utility scripts
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Root package config
├── README.md                  # This file
└── [Additional docs]
```

---

## 🗓️ Update Log

### 2026-04-13 (v2.0) - Production Release
- **Complete System Implementation** - All features fully working
- **MySQL Database** - Migrated from JSON to MySQL for scalability
- **Customer Portal** - Public property browsing with authentication
- **Agent Portal** - Full inquiry and calendar management
- **Admin Dashboard** - Complete property and user management
- **Security Hardening** - Enterprise-grade security features
- **Documentation** - Comprehensive guides and API documentation
- **Production Ready** - System ready for deployment

### Previous Versions
- v1.0 - Initial system architecture
- v1.5 - Added phone verification
- v1.8 - Property workflow system
- v2.0 - MySQL migration and enterprise features

---

## 🚨 Common Issues & Solutions

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: "Cannot connect to MySQL database"
**Solution:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify connection in .env:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
```

### Issue: "JWT token expired"
**Solution:**
- Login again to get new token
- Tokens expire after 30 days
- Check JWT_SECRET is set in .env

### Issue: "Rate limit exceeded"
**Solution:**
- API Rate Limit: 1000 requests/minute
- Login Rate Limit: 5 attempts per 15 minutes
- Wait for the time window to reset
- Adjust limits in `server/middleware/rateLimiter.js`

### Issue: "Cannot find module 'xyz'"
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or install specific package
npm install xyz
```

---

## 📚 Additional Documentation

- **[COMPLETE_SYSTEM_GUIDE.md](./COMPLETE_SYSTEM_GUIDE.md)** - Detailed system architecture
- **[FEATURES_USER_STORIES.md](./FEATURES_USER_STORIES.md)** - Feature specifications
- **[GIT_PUSH_GUIDE.md](./GIT_PUSH_GUIDE.md)** - How to push changes
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[PHONE_VERIFICATION_IMPLEMENTATION.md](./PHONE_VERIFICATION_IMPLEMENTATION.md)** - SMS setup

---

## 🔒 Security Best Practices

### For Development
1. ✅ Never commit `.env` file
2. ✅ Use strong JWT_SECRET (minimum 32 characters)
3. ✅ Keep database credentials secure
4. ✅ Test rate limiting regularly
5. ✅ Regular database backups

### For Production
1. 🔐 Change all default passwords
2. 🔐 Generate new JWT_SECRET
3. 🔐 Set NODE_ENV=production
4. 🔐 Enable HTTPS/SSL
5. 🔐 Configure proper CORS origins
6. 🔐 Set up automated backups
7. 🔐 Use environment-specific secrets
8. 🔐 Enable security monitoring

---

## 🎯 Features Roadmap

### ✅ Completed (v2.0)
- JWT authentication with 30-day sessions
- Password hashing (bcrypt 10 rounds)
- Input sanitization with XSS protection
- Rate limiting (API: 1000 req/min, Login: 5/15min)
- MySQL database with 10+ tables
- Multi-role system (Admin/Agent/Customer)
- Image upload (multi-image per property)
- Activity logging and audit trails
- Database portal with export functionality
- Property workflow validation

### 🔄 In Progress
- Email notifications for inquiries
- SMS notifications via Vonage
- Advanced search filters

### 📋 Planned (v2.1)
- Two-factor authentication (2FA)
- Real-time notifications (WebSockets)
- Advanced analytics dashboard
- Dark mode theme

### 🚀 Future (v3.0)
- Mobile app (React Native)
- GraphQL API implementation
- AI-powered property recommendations
- Multi-language support (i18n)
- Integrated payment gateway

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

- **GitHub Issues**: [Report a bug](https://github.com/HansLagmay/SIAfinalforDEFENSE/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/HansLagmay/SIAfinalforDEFENSE/discussions)
- **Email**: support@tesproperty.local

---

**Version:** 2.0.0  
**Last Updated:** April 13, 2026  
**Status:** Production Ready ✅  
**Maintained by:** HansLagmay

---

⭐ **Star this repo if you find it helpful!**

🎓 **Perfect for:**
- Full-stack development learning
- Portfolio projects
- Real estate businesses
- Multi-role authentication systems
- MySQL database implementation
- Property management workflows
