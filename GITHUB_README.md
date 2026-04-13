# 🏢 TES Property Management System - Complete Guide

**Enterprise Real Estate Management Platform**  
Production-Ready Fullstack Solution | React + TypeScript | Express.js | MySQL

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0%2B-orange.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

---

## 📋 Quick Navigation

- [👀 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🛠 Tech Stack](#-tech-stack)
- [📊 System Architecture](#-system-architecture)
- [🎯 Use Cases](#-use-cases)
- [🚀 Quick Start](#-quick-start-5-minutes)
- [📦 Installation](#-installation-detailed-setup)
- [🗄️ Database Setup](#-database-setup)
- [🏃 How to Run](#-how-to-run)
- [📚 API Documentation](#-api-documentation)
- [👥 User Roles & Workflows](#-user-roles--workflows)
- [🔐 Security Features](#-security-features)
- [📋 Scripts & Commands](#-scripts--commands)
- [⚙️ Configuration](#-environment-configuration)
- [🐛 Troubleshooting](#-troubleshooting)

---

## 👀 Overview

**TES Property Management System** is a production-ready, enterprise-grade real estate management platform designed for property management companies, real estate agencies, and property brokers. It provides **three separate portals** for Administrators, Agents, and Customers with specialized workflows and security controls for each user type.

### Core Capabilities

✅ **Multi-role Access Control** - Separate portals for Admin, Agent, and Customer  
✅ **Customer Portal** - Browse properties, submit inquiries, track appointments  
✅ **Agent Portal** - Manage inquiries, schedule viewings, track commissions  
✅ **Admin Dashboard** - Full property management, user management, reporting  
✅ **Mobile Responsive** - Works seamlessly on desktop, tablet, and mobile  
✅ **Secure Authentication** - JWT-based sessions, password hashing, rate limiting  
✅ **Activity Logging** - Complete audit trail of all system actions  
✅ **Database Migrations** - Safe schema updates with versioning  
✅ **SMS Integration** - Phone verification via Vonage API  

---

## ✨ Key Features

### 🎨 Customer Portal Features

| Feature | Description |
|---------|-------------|
| **Public Browse** | View all available properties with image galleries without login |
| **Account Creation** | Sign up with email, password, name, and phone number |
| **Secure Login** | JWT-based authentication with 30-day session persistence |
| **Property Inquiries** | Submit authenticated inquiries with automatic ticket generation |
| **Inquiry Tracking** | View all submitted inquiries and real-time status updates |
| **Duplicate Prevention** | Only one active inquiry per property until resolved |
| **Appointment Viewing** | See scheduled property viewings with date/time |
| **Profile Management** | Update personal information and preferences |

### 👨‍💼 Agent Portal Features

| Feature | Description |
|---------|-------------|
| **Inquiry Dashboard** | View available tickets and manage assignments |
| **Claim Inquiries** | Claim new inquiries for follow-up to become assigned agent |
| **Calendar Integration** | Schedule viewings, mark complete, reschedule, or cancel |
| **Property Management** | Create draft properties for admin approval |
| **Commission Tracking** | View sales commissions and performance metrics |
| **Activity History** | Track all actions and interactions |
| **Analytics** | Dashboard showing active inquiries and metrics |

### 🔧 Admin Portal Features

| Feature | Description |
|---------|-------------|
| **Property CRUD** | Create, read, update, delete properties with multi-image uploads |
| **User Management** | Create and manage agent accounts with role assignment |
| **Inquiry Assignment** | Manually assign inquiries to agents or override assignments |
| **Image Management** | Upload and manage property images with file optimization |
| **Activity Monitoring** | View system-wide audit logs and user actions |
| **Database Utilities** | Direct database inspection and management tools |
| **Report Generation** | Export data for analysis and reporting |
| **Status Tracking** | Monitor property status (available, reserved, sold) |

### 🗄️ Super Admin Features

| Feature | Description |
|---------|-------------|
| **Database Access** | Raw data access to all database tables |
| **Table Inspection** | View database structure and metadata |
| **Data Export** | Download complete database contents |

---

## 🛠 Tech Stack

### **Frontend Stack**

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework & component library |
| TypeScript | 5.9.3 | Type safety & better DX |
| Vite | 5.4.21 | Build tool & dev server (3-5x faster than Webpack) |
| React Router | 6.30.3 | Client-side routing & navigation |
| Axios | 1.13.6 | HTTP client for API calls |
| Tailwind CSS | 3.3.6 | Utility-first styling framework |
| Lucide React | Latest | Icon library (200+ icons) |

### **Backend Stack**

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.0+ (Tested: 24.14.0) | JavaScript runtime |
| Express.js | 4.22.1 | REST API framework |
| MySQL | 8.0+ | Relational database |
| mysql2 | 3.6+ | MySQL driver with promise support |
| JWT (jsonwebtoken) | 9.0+ | Token-based authentication |
| bcryptjs | 2.4.3 | Password hashing & encryption |
| Multer | 2.0.2 | File upload handling & storage |
| Helmet | 7.0.0 | Security headers middleware |
| express-rate-limit | 6.11.2 | Request rate limiting |
| CORS | 2.8.5 | Cross-origin resource sharing |
| Vonage SDK | 3.26.4 | SMS verification service |
| UUID | 9.0.1 | Unique identifier generation |
| dotenv | 16.0.3 | Environment variable management |

### **Database**

| Component | Details |
|-----------|---------|
| DBMS | MySQL 8.0+ |
| Connection Pool | mysql2 with connection pooling |
| Schema | 10+ core tables with indexes |
| Migrations | Versioned SQL migration scripts |
| Optimization | Indexed queries for performance |

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser)                      │
│  React SPA with TypeScript | Vite Dev Server                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │        Customer Portal       │  Agent Portal  │ Admin       │ │
│  │  • Browse Properties         │  • Manage      │ • CRUD      │ │
│  │  • Submit Inquiries          │    Inquiries   │   Properties│ │
│  │  • Track Appointments        │  • Schedule    │ • Manage    │ │
│  │  • View Status Updates       │    Viewings    │   Users     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Components: Authentication Guards, Form Validation,        │ │
│  │ Error Handling, Loading States, Responsive UI              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                    HTTP/HTTPS + JWT Token
                      (Axios Interceptors)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER                             │
│  Express.js with TypeScript | Node.js 18+                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Core Routes (REST API):                                    │ │
│  │ • POST   /auth/register      → Customer signup             │ │
│  │ • POST   /auth/login         → Login with email/password   │ │
│  │ • GET    /properties         → List all properties         │ │
│  │ • POST   /inquiries          → Submit inquiry              │ │
│  │ • GET    /inquiries          → Customer's inquiries        │ │
│  │ • POST   /calendar           → Schedule viewing            │ │
│  │ • GET    /users              → List agents (admin only)    │ │
│  │ • POST   /users              → Create agent (admin only)   │ │
│  │ • GET    /database/tables    → View tables (super admin)   │ │
│  │ • GET    /activity-log       → Audit trail                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Middleware Pipeline:                                       │ │
│  │ 1. CORS               → Allow cross-origin requests        │ │
│  │ 2. Helmet             → Security headers                   │ │
│  │ 3. JSON Parser        → Parse JSON bodies                  │ │
│  │ 4. Rate Limiter       → Prevent abuse                      │ │
│  │ 5. JWT Validator      → Verify tokens                      │ │
│  │ 6. Input Sanitizer    → XSS protection                     │ │
│  │ 7. Logger             → Request/response logging           │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Services Layer:                                            │ │
│  │ • smsService.js       → Vonage SMS integration             │ │
│  │ • notificationService → Email/SMS notifications            │ │
│  │ • fileService         → Image upload/management            │ │
│  │ • dbService           → Database transaction logic         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Security & Performance:                                    │ │
│  │ • JWT Token Validation            (Every request)         │ │
│  │ • Password Hashing (bcrypt)       (User creation)         │ │
│  │ • Rate Limiting (6 requests/min)  (brute force defense)   │ │
│  │ • Input Sanitization              (XSS prevention)        │ │
│  │ • CORS Protection                 (Known origins only)    │ │
│  │ • Connection Pooling              (DB optimization)       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
               MySQL2 Connection Pool
               (10-20 concurrent connections)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                                 │
│  MySQL 8.0+ | InnoDB Engine | Indexes Optimized                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Core Tables:                                               │ │
│  │ • users                       → Admin/Agent accounts       │ │
│  │ • customers                   → Customer accounts          │ │
│  │ • properties                  → Property listings          │ │
│  │ • property_images             → Property photos            │ │
│  │ • inquiries                   → Customer inquiries         │ │
│  │ • calendar_events             → Agent viewings             │ │
│  │ • customer_appointments       → Viewing schedules          │ │
│  │ • phone_verification_attempts → Rate limiting              │ │
│  │ • phone_verification_log      → Audit trail               │ │
│  │ • activity_log                → System activity            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Database Features:                                         │ │
│  │ • Automated Backups           (Recommended daily)         │ │
│  │ • Transaction Support         (Data consistency)          │ │
│  │ • Foreign Key Constraints     (Data integrity)            │ │
│  │ • Indexed Queries             (Performance)               │ │
│  │ • UTF8MB4 Encoding            (Full Unicode support)      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Vonage SMS API   → Phone verification                    │ │
│  │ • File Storage     → Property images (local/cloud)         │ │
│  │ • Email Service    → Notifications (future)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### **For Property Management Companies**
- **Multi-Agent Management**: Assign properties to multiple agents with individual tracking
- **Inquiry Workflow**: Automated ticket system ensures no inquiries are missed
- **Commission Tracking**: Track agent performance and sales commissions
- **Client Relationship**: Maintain customer history and interaction logs
- **Lead Generation**: Public portal attracts customers organically

### **For Real Estate Agents**
- **Lead Management**: Receive and manage inquiries efficiently
- **Appointment Scheduling**: Integrated calendar with automated confirmations
- **Performance Metrics**: Track conversions, viewings completed, clients served
- **Property Management**: Access to properties available for showing
- **Communication**: Follow-up with customers through system notifications

### **For Customers/Buyers**
- **Property Search**: Browse available properties with detailed information
- **24/7 Access**: Contact agents anytime through the inquiry system
- **Viewing Scheduling**: Schedule property viewings at convenient times
- **Status Tracking**: Real-time updates on inquiry status and appointments
- **Document Management**: View property documents and agreements

### **For Administrators**
- **Complete Control**: Manage all aspects of the platform
- **Data Management**: Import/export properties and maintain inventory
- **User Management**: Create and manage agent accounts
- **Reporting**: Generate sales and performance reports
- **System Health**: Monitor activity logs and system performance

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js** v18.0+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/) or [XAMPP](https://www.apachefriends.org/))
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/SIAfinalforDEFENSE.git
cd SIAfinalforDEFENSE
```

### Step 2: Install Dependencies
```bash
npm run install:all
```

### Step 3: Setup Database
```bash
npm run db:schema
npm run db:seed
```

### Step 4: Configure Environment
Create `.env` in root folder:
```env
# Backend
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=TESdb
JWT_SECRET=your-super-secret-key-here

# SMS (Optional for phone verification)
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
```

### Step 5: Start Application
```bash
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/health

**Demo Credentials:**
```
Admin:
  Email: admin@tesproperty.com
  Password: admin123

Agent (Maria):
  Email: maria@tesproperty.com
  Password: agent123

Customer:
  Email: customer@example.com
  Password: pass123
```

---

## 📦 Installation (Detailed Setup)

### System Requirements

**Hardware:**
- RAM: Minimum 2GB (4GB+ recommended)
- Storage: 1GB+ for application and uploads
- CPU: 2-core processor minimum

**Software:**
- Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- Administrator access for installation

### Step 1: Install Node.js

**Windows:**
1. Download from https://nodejs.org/ (LTS version 18+)
2. Run installer and follow prompts
3. Verify installation:
```bash
node --version
npm --version
```

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install MySQL

**Windows (XAMPP - Easiest):**
1. Download XAMPP from https://www.apachefriends.org/
2. Run installer
3. Start Apache & MySQL from XAMPP Control Panel
4. Access MySQL on `localhost:3306` with `root` (no password)

**Windows (MySQL Standalone):**
1. Download from https://dev.mysql.com/downloads/mysql/
2. Run installer
3. Configure MySQL server with port 3306
4. Create default user: `root` with password

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### Step 3: Clone Repository

```bash
# Using Git
git clone https://github.com/yourusername/SIAfinalforDEFENSE.git
cd SIAfinalforDEFENSE

# Or download as ZIP and extract
```

### Step 4: Install Node Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies (if separate)
cd server
npm install
cd ..
```

### Step 5: Configure Environment

Create `.env` file in root directory:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=TESdb

# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=3000
SERVER_URL=http://localhost:3000

# ===========================================
# FRONTEND CONFIGURATION
# ===========================================
VITE_API_URL=http://localhost:3000/api

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=30d  # 30 days

# ===========================================
# SMS SERVICE (Optional)
# ===========================================
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM_NUMBER=your_vonage_phone_number

# ===========================================
# FILE UPLOADS
# ===========================================
UPLOAD_DIR=./server/uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# ===========================================
# CORS SETTINGS
# ===========================================
CORS_ORIGIN=http://localhost:5173
```

### Step 6: Initialize Database

```bash
# Create database schema
npm run db:schema

# Seed with demo data
npm run db:seed

# Optional: Seed showcase data
npm run db:seed:demo
```

This will:
- Create database `TESdb`
- Create all tables with proper schema
- Add demo users (admin, agents, customers)
- Load sample properties for testing

---

## 🗄️ Database Setup

### Database Architecture

The system uses **MySQL 8.0+** with the following structure:

### Core Tables

#### **users** - Admin & Agent Accounts
```sql
idvarchar(36) - UUID primary key
email - varchar(255) unique
password - varchar(255) bcrypt hashed
name - varchar(255)
role - varchar(50) (admin, agent)
phone - varchar(50)
license_number - varchar(120)
license_status - varchar(32) (pending, active, expired, invalid)
created_at - datetime
updated_at - datetime
```

#### **customers** - Customer Accounts
```sql
id - varchar(36) - UUID primary key
email - varchar(255) unique
password_hash - varchar(255) bcrypt hashed
name - varchar(255)
phone - varchar(50)
email_verified - tinyint(1)
phone_verified - tinyint(1)
is_blocked - tinyint(1)
created_at - datetime
updated_at - datetime
```

#### **properties** - Property Listings
```sql
id - varchar(36) - UUID
title - varchar(255)
type - varchar(100) (House, Apartment, Commercial, Land)
price - decimal(15,2)
location - varchar(255)
bedrooms - int
bathrooms - int
area - decimal(10,2)
description - text
status - varchar(50) (available, reserved, sold)
visible_to_customers - boolean
created_at - datetime
updated_at - datetime
```

#### **inquiries** - Customer Inquiries
```sql
id - varchar(36)
customer_id - varchar(36) foreign key → customers
property_id - varchar(36) foreign key → properties
status - varchar(50) (new, claimed, assigned, contacted, viewing-scheduled, completed, closed)
ticket_number - varchar(20) unique (INQ-2026-001)
message - text
assigned_agent_id - varchar(36) foreign key → users
created_at - datetime
updated_at - datetime
```

#### **calendar_events** - Property Viewings
```sql
id - varchar(36)
agent_id - varchar(36) foreign key → users
inquiry_id - varchar(36) foreign key → inquiries
event_date - datetime
event_type - varchar(50) (viewing, follow-up, call)
status - varchar(50) (scheduled, completed, cancelled, rescheduled)
outcome - varchar(50) (interested, not-interested, pending)
notes - text
created_at - datetime
updated_at - datetime
```

#### **activity_log** - Audit Trail
```sql
id - varchar(36)
user_id - varchar(36)
action - varchar(100)
resource_type - varchar(50)
resource_id - varchar(36)
changes - json
ip_address - varchar(45)
created_at - datetime
```

### Database Migrations

SQL migration scripts are located in `server/sql/`:

- `schema.sql` - Core database structure
- `property_agent_ownership.sql` - Property-Agent relationships
- `customer_auth_migration.sql` - Customer authentication
- `feature_expansion_2026_04.sql` - New features
- `security_hardening_2026_04.sql` - Security improvements
- `add_phone_verification.sql` - SMS verification columns

**Apply Migrations:**
```bash
# Automatic on first run
npm run db:schema

# Or manually via MySQL CLI
mysql -u root -p TESdb < server/sql/schema.sql
mysql -u root -p TESdb < server/sql/property_agent_ownership.sql
```

### Database Backup & Restore

**Backup:**
```bash
mysqldump -u root -p TESdb > backup_tes_db.sql
```

**Restore:**
```bash
mysql -u root -p TESdb < backup_tes_db.sql
```

---

## 🏃 How to Run

### Option 1: Development Mode (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd server
npm install  # First time only
npm run dev
```
Output: `✓ Server running on http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd client
npm install  # First time only
npm run dev
```
Output: `✓ Local: http://localhost:5173`

### Option 2: Production Build

**Build Frontend:**
```bash
cd client
npm run build
```
Creates optimized build in `client/dist/`

**Start Backend (Production):**
```bash
NODE_ENV=production npm start
```

### Option 3: Using Concurrently (Both in One Terminal)

```bash
npm run dev
```
This will start both backend and frontend in split terminal view.

### Option 4: Docker (If Available)

```bash
docker-compose up
```

### Verify Installation

Once both servers are running:

1. **Frontend:** Open http://localhost:5173 in browser
   - Should see login page and property listings
   - Try logging in with demo credentials

2. **Backend API:** Check http://localhost:3000/api/health
   - Should return: `{"status": "ok"}`

3. **Database:** Verify connection
   ```bash
   npm run db:check
   ```

---

## 📚 API Documentation

### Authentication Endpoints

#### Register (Customer)
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1234567890"
}

Response: { token, user: { id, email, name } }
```

#### Login (Customer)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securePassword123"
}

Response: { token, user: { id, email, name } }
```

#### Login (User)
```
POST /api/auth/user-login
Content-Type: application/json

{
  "email": "admin@tesproperty.com",
  "password": "admin123"
}

Response: { token, user: { id, email, role } }
```

### Property Endpoints

#### Get All Properties (Public)
```
GET /api/properties
Query params: ?type=House&priceMin=10000&priceMax=500000
Response: [ { id, title, price, location, bedrooms, image_url, ... }, ... ]
```

#### Get Single Property
```
GET /api/properties/:id
Response: { id, title, description, images[], owner, contact, ... }
```

#### Create Property (Admin)
```
POST /api/properties
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Beautiful 3-Bedroom House",
  "type": "House",
  "price": 250000,
  "location": "123 Main St",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 1500,
  "description": "..."
}

Response: { id, ... }
```

### Inquiry Endpoints

#### Submit Inquiry (Customer - Authenticated)
```
POST /api/inquiries
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "property_id": "uuid",
  "message": "I'm interested in this property"
}

Response: { id, ticket_number: "INQ-2026-001", status: "new" }
```

#### Get My Inquiries
```
GET /api/inquiries
Headers: Authorization: Bearer {token}
Response: [ { id, property_id, status, ticket_number, ... }, ... ]
```

#### Claim Inquiry (Agent)
```
PUT /api/inquiries/:id/claim
Headers: Authorization: Bearer {token}
Response: { id, status: "claimed", assigned_agent_id: "..." }
```

### Calendar Endpoints

#### Schedule Viewing
```
POST /api/calendar
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "inquiry_id": "uuid",
  "event_date": "2026-04-20T14:00:00",
  "event_type": "viewing"
}

Response: { id, event_date, status: "scheduled" }
```

#### Mark Viewing Complete
```
PUT /api/calendar/:id/complete
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "outcome": "interested",
  "notes": "Customer very interested, will follow up"
}

Response: { id, status: "completed", outcome: "interested" }
```

---

## 👥 User Roles & Workflows

### Role Permissions Matrix

| Feature | Customer | Agent | Admin | Super Admin |
|---------|----------|-------|-------|------------|
| Browse Properties | ✅ | ✅ | ✅ | ✅ |
| Submit Inquiry | ✅ | - | - | - |
| View Own Inquiries | ✅ | ✅ | ✅ | ✅ |
| Claim Inquiry | - | ✅ | ✅ | ✅ |
| Schedule Viewing | ✅ | ✅ | ✅ | - |
| Create Property | - | (draft) | ✅ | ✅ |
| Edit Property | - | - | ✅ | ✅ |
| Manage Users | - | - | ✅ | ✅ |
| View Activity Log | - | - | ✅ | ✅ |
| Manage Database | - | - | - | ✅ |

### Customer Workflow

1. **Browse** → Visit website, explore properties (no login needed)
2. **Search** → Filter by type, price, location, features
3. **Register** → Create account with email/password
4. **Inquire** → Submit inquiry for interested properties
5. **Track** → Monitor inquiry status and agent response
6. **Schedule** → Accept viewing appointment
7. **Follow-up** → Check appointment and provide feedback

### Agent Workflow

1. **Dashboard** → View available inquiries
2. **Claim** → Accept inquiry to become assigned agent
3. **Contact** → Initialize contact with customer
4. **Schedule** → Book property viewing appointment
5. **Complete** → Mark viewing as done and record outcome
6. **Follow-up** → Manage next steps based on customer interest
7. **Report** → Track metrics and commissions

### Admin Workflow

1. **Manage Properties** → CRUD operations with image uploads
2. **Manage Agents** → Create user accounts and assign roles
3. **Monitor Inquiries** → View and assign inquiries manually
4. **Track Activity** → Review audit logs and user actions
5. **Manage Uploads** → Handle property images
6. **Generate Reports** → Export data for analysis

---

## 🔐 Security Features

### Authentication & Authorization

✅ **JWT Tokens** - Stateless authentication with 30-day expiration  
✅ **Password Hashing** - bcryptjs with 10-round salt  
✅ **Rate Limiting** - 6 requests/minute per IP address  
✅ **CORS Protection** - Whitelist allowed origins  
✅ **Input Validation** - Joi schema validation on all inputs  
✅ **XSS Protection** - Input sanitization and escaping  
✅ **CSRF Protection** - SameSite cookie policies  

### Data Protection

✅ **SQL Injection Prevention** - Parameterized queries (mysql2)  
✅ **Sensitive Data** - Passwords never logged or exposed  
✅ **File Uploads** - File type validation and safe storage  
✅ **HTTPS Ready** - Helmet security headers enabled  
✅ **Audit Logging** - Complete activity trail for compliance  

### Database Security

✅ **Connection Pooling** - Reusable connections with timeouts  
✅ **Foreign Keys** - Referential integrity enforced  
✅ **Transactions** - ACID compliance for critical operations  
✅ **Backups** - Regular automatic backups recommended  
✅ **UTF8MB4** - Full Unicode support prevents injection  

---

## 📋 Scripts & Commands

### Database Scripts

```bash
# Initialize database schema
npm run db:schema

# Seed with basic demo data
npm run db:seed

# Seed with showcase/marketing data
npm run db:seed:demo

# Check database connection
npm run db:check

# Run migrations
npm run db:migrate:features
npm run db:migrate:security

# Update legacy data
npm run agents:check-licenses
npm run calendar:backfill-inquiry-id
```

### Quality Assurance

```bash
# Run full test suite
npm test

# Run specific test file
npm run test:auth

# Run QA checks
npm run qa:demo

# Cleanup demo data
npm run demo:cleanup

# Check for demo data interference
npm run demo:scan
```

### Development

```bash
# Start full stack (backend + frontend)
npm run dev

# Backend only
npm run server

# Backend with file watching (auto-reload)
npm run server:dev

# Frontend only
npm run client

# Install all dependencies
npm run install:all

# Start production server
npm start
```

---

## ⚙️ Environment Configuration

### .env File Reference

Create `.env` file in project root with these variables:

```env
# ============ NODE ENVIRONMENT ============
NODE_ENV=development  # development|production|test

# ============ SERVER CONFIG ============
PORT=3000
SERVER_URL=http://localhost:3000

# ============ DATABASE CONFIG ============
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=TESdb

# ============ AUTHENTICATION ============
JWT_SECRET=change-this-to-a-long-random-string-in-production
JWT_EXPIRY=30d

# ============ VONAGE SMS SERVICE ============
# Get these from https://developer.vonage.com/
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM_NUMBER=+1234567890

# ============ FILE UPLOADS ============
UPLOAD_DIR=./server/uploads
MAX_FILE_SIZE=10485760  # 10MB

# ============ CORS ============
CORS_ORIGIN=http://localhost:5173

# ============ FRONTEND CONFIG ============
VITE_API_URL=http://localhost:3000/api

# ============ LOGGING ============
LOG_LEVEL=debug  # debug|info|warn|error
```

### Environment-Specific Setup

**Development:**
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

**Production:**
```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
JWT_SECRET=generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Issue: "Cannot connect to MySQL"
**Solution:**
```bash
# Check if MySQL is running
mysql -u root -p

# Verify connection string in .env
# Default: DB_HOST=localhost, DB_PORT=3306
```

#### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Windows: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

#### Issue: "API returns 401 Unauthorized"
**Solution:**
```bash
# Check JWT token in browser localStorage
# Token should be present in Authorization header
# Check token expiry: JWT tokens expire after 30 days
```

#### Issue: "Cannot upload files"
**Solution:**
```bash
# Create uploads directory
mkdir -p server/uploads/properties
mkdir -p server/uploads/documents
mkdir -p server/uploads/licenses

# Check file size limit in .env
MAX_FILE_SIZE=10485760  # 10MB
```

#### Issue: "Frontend shows blank page"
**Solution:**
```bash
# Check if API is running on localhost:3000
curl http://localhost:3000/api/health

# Check CORS origin in .env
# Should match your frontend URL (localhost:5173)

# Check browser console for errors
# Press F12 → Console tab
```

#### Issue: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: "Database migration failed"
**Solution:**
```bash
# Check if database exists
mysql -u root -p -e "SHOW DATABASES;"

# Manually create database
mysql -u root -p -e "CREATE DATABASE TESdb CHARACTER SET utf8mb4;"

# Run schema manually
mysql -u root -p TESdb < server/sql/schema.sql
```

#### Issue: "404 on API endpoints"
**Solution:**
```bash
# Verify server is running
ps aux | grep node

# Check server is on correct port
curl http://localhost:3000

# Check API routes are properly registered
# Routes should be in server/routes/*.js
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
DEBUG=* npm run server:dev

# Or check logs at
tail -f server/logs/app.log
```

### Performance Issues

**Frontend slow:**
```bash
# Clear cache and rebuild
cd client
npm run build
npm run analyze  # Check bundle size
```

**Backend slow:**
```bash
# Check database connection pool
# Monitor query performance in MySQL logs
# Increase database timeout if needed
```

---

## 📞 Support & Documentation

### Additional Resources

- **Complete System Guide**: See [COMPLETE_SYSTEM_GUIDE.md](COMPLETE_SYSTEM_GUIDE.md)
- **User Stories**: See [FEATURES_USER_STORIES.md](FEATURES_USER_STORIES.md)
- **Phone Verification**: See [PHONE_VERIFICATION_IMPLEMENTATION.md](PHONE_VERIFICATION_IMPLEMENTATION.md)

### File Structure Guide

```
SIAfinalforDEFENSE/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   ├── vite.config.ts         # Vite configuration
│   ├── postcss.config.js      # Tailwind config
│   └── package.json
│
├── server/                      # Express Backend
│   ├── routes/                # API endpoints
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic
│   ├── scripts/               # Utility scripts
│   ├── sql/                   # Database schemas
│   ├── uploads/               # Uploaded files
│   ├── db.js                  # Database connection
│   ├── index.js               # Server entry point
│   └── package.json
│
├── scripts/                     # Root level scripts
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Root package.json
├── README.md                   # Basic readme
├── COMPLETE_SYSTEM_GUIDE.md   # System documentation
├── FEATURES_USER_STORIES.md    # Feature documentation
└── PHONE_VERIFICATION.md       # SMS implementation guide
```

---

## 📝 License

Private Project - All Rights Reserved

---

## 👨‍💻 Development Team

TES Property Management System v2.0  
Built with ❤️ for Real Estate professionals

---

## 🎯 Next Steps

1. ✅ **Clone Repository** - Get the code on your machine
2. ✅ **Install Dependencies** - Run `npm run install:all`
3. ✅ **Setup Database** - Run `npm run db:schema && npm run db:seed`
4. ✅ **Configure .env** - Copy environment variables
5. ✅ **Start Application** - Run `npm run dev`
6. ✅ **Test Login** - Use demo credentials provided
7. ✅ **Explore Features** - Browse properties and test workflows
8. ✅ **Read Documentation** - Check linked docs for advanced usage

---

**Last Updated:** April 13, 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
