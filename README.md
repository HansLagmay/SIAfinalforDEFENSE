# � TES Property Management System v2.0 - Real Estate Inquiry Management

A complete professional real estate management system with **React + Express** architecture, using **MySQL 8.0+** database with comprehensive security features.

## 🎯 Project Overview

**Enterprise-grade property management platform** designed for real estate agencies and property management companies. This system provides separate portals for **Administrators**, **Agents**, and **Customers** with specialized workflows and security controls.

Key Highlights:
- ✅ **Customer Portal** - Browse properties, submit inquiries, track appointments
- ✅ **Agent Portal** - Manage inquiries, schedule viewings, track metrics
- ✅ **Admin Dashboard** - Full property & user management with reporting
- ✅ **Enterprise Security** - JWT auth, bcrypt hashing, rate limiting, XSS protection
- ✅ **MySQL Database** - Persistent data storage with 10+ tables and indexes
- ✅ **Activity Logging** - Complete audit trail for compliance

---

## ✨ Key Features

### 🎨 Customer Portal
- **Public Property Browsing** - View available properties with image galleries
- **Secure Authentication** - JWT-based login/signup system (30-day sessions)
- **Property Inquiries** - Submit authenticated inquiries with automatic ticket generation
- **Appointment Tracking** - View scheduled property viewings
- **Inquiry Management** - Check status of submitted inquiries
- **Duplicate Prevention** - One active inquiry per property until resolved

### 👨‍💼 Agent Portal
- **Inquiry Management** - View available tickets, claim and manage assignments
- **Calendar Integration** - Schedule viewings, mark as done, reschedule, cancel
- **Property Listings** - Create draft properties for admin approval
- **Commission Tracking** - View sales and commission details
- **Dashboard Analytics** - Track active inquiries and performance metrics

### 🔧 Admin Portal
- **Full Property Management** - CRUD operations, status tracking, multi-image uploads
- **User Management** - Create/manage agent accounts
- **Inquiry Assignment** - Assign inquiries to agents manually
- **Activity Monitoring** - View system-wide audit logs
- **Database Utilities** - Direct database inspection and management
- **Report Generation** - Export data for analysis

### 🗄️ Database Portal (Super Admin)
- **Raw Data Access** - View all database tables
- **File Metadata** - Inspect database structure
- **Data Export** - Download database contents

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.18+ | REST API framework |
| **MySQL** | 8.0+ | Relational database |
| **mysql2** | 3.6+ | MySQL driver with promise support |
| **jsonwebtoken** | 9.0+ | JWT authentication |
| **bcryptjs** | 2.4+ | Password hashing |
| **multer** | 2.0+ | File upload handling |
| **helmet** | 7.0+ | Security headers |
| **express-rate-limit** | 6.7+ | Rate limiting |
| **cors** | 2.8+ | Cross-origin requests |
| **uuid** | 9.0+ | Unique ID generation |
| **dotenv** | 16.0+ | Environment variables |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework |
| **TypeScript** | 5.3+ | Type safety |
| **Vite** | 5.0+ | Build tool & dev server |
| **React Router** | 6.20+ | Client-side routing |
| **Axios** | 1.6+ | HTTP client |
| **Tailwind CSS** | 3.3+ | Utility-first styling |

### Development Tools
| Technology | Purpose |
|------------|---------|
| **nodemon** | Auto-reload backend on changes |
| **concurrently** | Run multiple processes |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9+
- **MySQL** 8.0+ (running locally or remote)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd siaFINALwithbackend-database
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   This installs dependencies for both backend and frontend.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   PORT=3000
   CORS_ORIGIN=http://localhost:5173
   
   # MySQL connection
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=TESdb
   
   # JWT Secret (use strong random string)
   JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
   JWT_EXPIRES_IN=30d
   ```

4. **Set up the database**
   ```bash
   npm run db:schema    # Creates all tables
   npm run db:seed      # Inserts demo data
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```
   
   This starts both backend and frontend concurrently:
   - 🌐 **Frontend**: http://localhost:5173
   - 🔌 **Backend API**: http://localhost:3000/api
   - ❤️ **Health Check**: http://localhost:3000/api/health

---

## 📦 Project Structure

```
siaFINALwithbackend-database/
│
├── client/                          # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/              # Admin portal components
│   │   │   ├── agent/              # Agent portal components
│   │   │   ├── customer/           # Customer portal components
│   │   │   ├── database/           # Database portal components
│   │   │   └── shared/             # Shared UI components
│   │   ├── pages/
│   │   │   ├── AdminPortal.tsx
│   │   │   ├── AgentPortal.tsx
│   │   │   ├── CustomerPortal.tsx
│   │   │   ├── DatabasePortal.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── services/
│   │   │   └── api.ts              # Axios API client
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── utils/                  # Helper functions
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                          # Express.js Backend
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication & RBAC
│   │   ├── logger.js               # Activity logging
│   │   ├── rateLimiter.js          # Rate limiting configs
│   │   ├── sanitize.js             # Input sanitization
│   │   ├── upload.js               # Multer configuration
│   │   └── validators.js           # Input validation
│   ├── routes/
│   │   ├── activity-log.js         # Activity log endpoints
│   │   ├── auth.js                 # Login endpoints
│   │   ├── calendar.js             # Calendar/viewing management
│   │   ├── database.js             # Database utilities
│   │   ├── inquiries.js            # Inquiry management
│   │   ├── properties.js           # Property CRUD
│   │   └── users.js                # User management
│   ├── scripts/
│   │   └── migrate.js              # Database migrations
│   ├── sql/
│   │   ├── schema.sql              # Complete database schema
│   │   ├── customer_auth_migration.sql
│   │   └── migration_add_missing_columns.sql
│   ├── uploads/
│   │   └── properties/             # Uploaded property images
│   ├── db.js                       # MySQL connection pool
│   └── index.js                    # Express app entry point
│
├── scripts/
│   ├── clearDemoData.js            # Reset database to clean state
│   ├── createSchema.js             # Initialize database schema
│   └── seedDatabase.js             # Populate with demo data
│
├── .env.example                     # Environment template
├── .gitignore
├── package.json                     # Root package.json
└── README_COMPLETE.md              # This file
```

---

## 🗄 Database Setup

### Database Schema

The system uses **TESdb** MySQL database with the following tables:

#### Core Tables

**`users`** - Agent and admin accounts
```sql
- id (VARCHAR 36, PRIMARY KEY)
- email (VARCHAR 255, UNIQUE)
- password (VARCHAR 255, hashed)
- name (VARCHAR 255)
- role (VARCHAR 50: 'admin', 'agent', 'superadmin')
- phone (VARCHAR 50)
- created_at (DATETIME)
```

**`customers`** - Customer accounts (new in v2.0)
```sql
- id (VARCHAR 36, PRIMARY KEY)
- email (VARCHAR 255, UNIQUE)
- password_hash (VARCHAR 255)
- name (VARCHAR 255)
- phone (VARCHAR 50)
- email_verified (BOOLEAN)
- phone_verified (BOOLEAN)
- verification_token (VARCHAR 255)
- verification_token_expires (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```

**`properties`** - Property listings
```sql
- id (VARCHAR 36, PRIMARY KEY)
- title (VARCHAR 255)
- type (VARCHAR 100)
- price (DECIMAL 15,2)
- location (VARCHAR 255)
- bedrooms (INT)
- bathrooms (INT)
- area (DECIMAL 10,2)
- description (TEXT)
- status (VARCHAR 50)
- image_url (VARCHAR 512)
- features (JSON)
- created_by (VARCHAR 255)
- status_history (JSON)
- view_count (INT)
- view_history (JSON)
- last_viewed_at (DATETIME)
- sold_by (VARCHAR 255)
- sold_by_agent_id (VARCHAR 36)
- sold_at (DATETIME)
- sale_price (DECIMAL 15,2)
- commission (JSON)
- reserved_by (VARCHAR 255)
- reserved_at (DATETIME)
- reserved_until (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```

**`inquiries`** - Customer inquiries with ticket system
```sql
- id (VARCHAR 36, PRIMARY KEY)
- customer_id (VARCHAR 36, FK to customers)
- ticket_number (VARCHAR 50, UNIQUE)
- name (VARCHAR 255)
- email (VARCHAR 255)
- phone (VARCHAR 50)
- message (TEXT)
- property_id (VARCHAR 36)
- property_title (VARCHAR 255)
- property_price (DECIMAL 15,2)
- property_location (VARCHAR 255)
- status (VARCHAR 50)
- assigned_to (VARCHAR 36, FK to users)
- claimed_by (VARCHAR 36, FK to users)
- assigned_by (VARCHAR 36, FK to users)
- claimed_at (DATETIME)
- assigned_at (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```

**`calendar_events`** - Viewing schedules
```sql
- id (VARCHAR 36, PRIMARY KEY)
- title (VARCHAR 255)
- description (TEXT)
- type (VARCHAR 100: 'viewing', 'meeting')
- start_time (DATETIME)
- end_time (DATETIME)
- agent_id (VARCHAR 36, FK to users)
- inquiry_id (VARCHAR 36, FK to inquiries)
- property_id (VARCHAR 36, FK to properties)
- created_by (VARCHAR 255)
- created_at (DATETIME)
- updated_at (DATETIME)
```

**`activity_log`** - Audit trail
```sql
- id (VARCHAR 36, PRIMARY KEY)
- action (VARCHAR 255)
- description (TEXT)
- performed_by (VARCHAR 255)
- timestamp (DATETIME)
```

**`property_images`** - Multiple images per property
```sql
- id (VARCHAR 36, PRIMARY KEY)
- property_id (VARCHAR 36, FK to properties)
- image_url (VARCHAR 512)
- is_primary (BOOLEAN)
- created_at (DATETIME)
```

#### Views

**`customer_appointments`** - Unified view of customer viewing appointments
```sql
VIEW: Joins calendar_events, inquiries, and users
for easy customer appointment access
```

### Setup Commands

```bash
# Create all tables
npm run db:schema

# Populate with demo data
npm run db:seed

# Run migrations (safe to run multiple times)
node server/scripts/migrate.js

# Clear all demo data (keeps schema)
node scripts/clearDemoData.js
```

---

## 🔌 API Documentation

All API endpoints are prefixed with `/api`.

### Authentication

**POST `/api/login`**  
Login for admin, agent, or customer accounts.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "admin" | "agent" | "customer"
}
```

**Response:**
```json
{
  "token": "jwt.token.here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

**POST `/api/auth/customer/signup`**  
Register new customer account.

**POST `/api/auth/customer/login`**  
Customer-specific login endpoint.

### Properties

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | ❌ | List all properties (paginated) |
| GET | `/api/properties/:id` | ❌ | Get single property |
| POST | `/api/properties` | ✅ Admin | Create new property |
| POST | `/api/properties/draft` | ✅ Agent | Create draft property |
| POST | `/api/properties/upload` | ✅ Admin | Upload property images |
| PUT | `/api/properties/:id` | ✅ Admin | Update property |
| DELETE | `/api/properties/:id` | ✅ Admin | Delete property |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ✅ Admin | List all users |
| GET | `/api/users/agents` | ✅ Admin/Agent | List all agents |
| POST | `/api/users` | ✅ Admin | Create new user |
| DELETE | `/api/users/:id` | ✅ Admin | Delete user |

### Inquiries

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/inquiries` | ✅ Admin/Agent | List all inquiries |
| GET | `/api/inquiries/:id` | ✅ Admin/Agent | Get single inquiry |
| GET | `/api/inquiries/agents/workload` | ✅ Admin/Agent | Get agent workload stats |
| POST | `/api/inquiries` | ✅ Customer | Submit new inquiry |
| POST | `/api/inquiries/:id/claim` | ✅ Agent | Claim unassigned inquiry |
| POST | `/api/inquiries/:id/assign` | ✅ Admin | Assign inquiry to agent |
| PUT | `/api/inquiries/:id` | ✅ Admin/Agent | Update inquiry status |
| DELETE | `/api/inquiries/:id` | ✅ Admin | Delete inquiry |

### Calendar

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/calendar` | ✅ Admin/Agent | List calendar events |
| GET | `/api/calendar/agent/:agentId` | ✅ Agent | Get agent's events |
| POST | `/api/calendar` | ✅ Admin/Agent | Create new event |
| POST | `/api/calendar/:id/mark-done` | ✅ Agent | Mark viewing as completed |
| PUT | `/api/calendar/:id` | ✅ Admin/Agent | Update event |
| DELETE | `/api/calendar/:id` | ✅ Admin/Agent | Cancel event |

### Activity Log

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/activity-log` | ✅ Admin | View system activity log |

### Database Utilities

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/database/overview` | ✅ Admin | Get database overview |
| GET | `/api/database/file-metadata/:filename` | ✅ Admin | Get file metadata |
| GET | `/api/database/file/:filename` | ✅ Admin | Get raw table data |

---

## 👥 User Roles & Workflows

### 🔵 Customer

**Access:** Public + Customer Portal (after signup/login)

**Capabilities:**
- Browse all available properties
- View property details and image galleries
- Sign up for an account or login
- Submit property inquiries (requires authentication)
- View their submitted inquiries and status
- View scheduled viewing appointments
- Receive ticket numbers for inquiry tracking

**Inquiry Workflow:**
1. Browse properties as a guest
2. Sign up or log in to submit inquiry
3. Submit inquiry → Receives unique ticket number (e.g., INQ-2026-001)
4. **Duplicate Prevention**: Can only have ONE active inquiry per property
5. View inquiry status updates in Customer Portal
6. See scheduled viewings in appointments section

**Status Visibility:**
- See inquiry status changes (new → claimed → contacted → viewing-scheduled)
- View appointment details (date, time, agent name)
- Cannot change inquiry status (read-only)

### 🟢 Agent

**Access:** Agent Portal (requires agent login)

**Capabilities:**
- View available inquiries (unassigned tickets)
- Claim inquiries (first-come, first-served)
- Manage assigned inquiries
- Schedule property viewings
- Manage calendar events
- Mark viewings as done (interested/not interested)
- Reschedule or cancel viewings
- Create draft properties
- View commission information
- Access dashboard analytics

**Inquiry Workflow:**
1. View "Available Tickets" list (unassigned inquiries)
2. Click "Claim This Ticket" → Status automatically changes to **claimed**
3. Contact customer → Update status to **contacted**
4. Schedule viewing → Status becomes **viewing-scheduled**
5. Mark viewing as done → Status becomes **viewed-interested** or **viewed-not-interested**
6. Continue negotiation or mark as terminal state

**Calendar Management:**
- Schedule viewings for claimed inquiries
- See all scheduled events
- **Mark as Done** → Prompts for outcome (interested/not interested)
- **Reschedule** → Change date/time
- **Cancel** → Remove from calendar with reason

**Status Transitions (Agent-Controlled):**
- **contacted** - Agent has reached out to customer
- **in-progress** - Actively working on the inquiry
- **viewing-scheduled** - Viewing appointment set
- **negotiating** - In negotiation phase
- **viewed-interested** - Customer interested after viewing
- **viewed-not-interested** - Customer not interested
- **deal-successful** - Sale completed ✓
- **deal-cancelled** - Deal fell through ✗
- **no-response** - Customer stopped responding

### 🔴 Admin

**Access:** Admin Portal (requires admin login)

**Capabilities:**
- **Full Property Management**: Create, edit, delete, upload images
- **User Management**: Create/delete agent accounts
- **Inquiry Assignment**: Manually assign inquiries to specific agents
- **Status Override**: Can change any inquiry status EXCEPT:
  - ❌ Cannot manually set to "claimed" (agent-only action)
  - ❌ Status "claimed" removed from dropdown
- **Activity Monitoring**: View complete audit log
- **Database Access**: Inspect raw database tables
- **Report Generation**: Export data for analysis

**Admin Restrictions:**
- **Cannot claim inquiries** - Only agents can claim
- **Cannot interfere with claim workflow** - Respects agent autonomy
- Can reassign already-assigned inquiries
- Can change status but "claimed" is reserved for agent claims

### 🟣 Super Admin

**Access:** Database Portal

**Capabilities:**
- Direct database table access
- View all raw data
- Database metadata inspection
- File system access

---

## 🔒 Security Features

### Authentication & Authorization

- **JWT Tokens** - 30-day signed tokens with role-based claims
- **Secure Password Storage** - bcryptjs hashing with 10 salt rounds
- **Role-Based Access Control (RBAC)** - Middleware enforces route access
- **Token Validation** - All protected routes verify `Authorization: Bearer <token>`

### Security Middleware

- **Helmet** - Sets security HTTP headers (XSS, CSP, X-Frame-Options)
- **CORS** - Restricted to configured origins only
- **Rate Limiting** - Prevents brute-force attacks
  - Login: 5 attempts per 15 minutes
  - Inquiries: 3 submissions per 15 minutes
  - General API: 100 requests per 15 minutes
- **Input Sanitization** - Strips/escapes dangerous characters
- **SQL Injection Prevention** - Parameterized queries via mysql2

### Data Protection

- **Environment Variables** - Secrets never committed to repository
- **Password Complexity** - Enforced on signup/creation
- **Session Management** - JWT expiration and refresh
- **HTTPS Ready** - Secure in production with reverse proxy

### Production Security Checklist

- ✅ Change all default passwords
- ✅ Use strong JWT_SECRET (64+ characters)
- ✅ Enable HTTPS (nginx/Apache reverse proxy)
- ✅ Set NODE_ENV=production
- ✅ Use dedicated MySQL user with minimal privileges
- ✅ Regular database backups
- ✅ Monitor activity logs for suspicious behavior
- ✅ Keep dependencies updated
- ✅ Disable database portal in production

---

## 📜 Scripts & Commands

### Root Package.json Scripts

```bash
# Development
npm run dev              # Start both backend & frontend concurrently
npm run server           # Start backend only (production mode)
npm run server:dev       # Start backend with nodemon (auto-reload)
npm run client           # Start frontend only

# Installation
npm run install:all      # Install root + client dependencies

# Database
npm run db:schema        # Create database schema
npm run db:seed          # Populate with demo data

# Production
npm start                # Start backend in production mode
```

### Database Scripts

```bash
# Create all tables (safe to run multiple times)
npm run db:schema

# Seed demo users and properties
npm run db:seed

# Run database migrations
node server/scripts/migrate.js

# Clear all demo data (keeps schema intact)
node scripts/clearDemoData.js
```

### Frontend (client/) Scripts

```bash
cd client

npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Build for production (outputs to dist/)
npm run preview          # Preview production build
```

---

## ⚙ Environment Configuration

### Backend (.env)

```env
# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_mysql_password
DB_NAME=TESdb

# JWT Authentication
JWT_SECRET=your_very_secure_jwt_secret_at_least_64_characters_long
JWT_EXPIRES_IN=30d

# Optional: Node Environment
NODE_ENV=development

# SMS Authentication (Vonage)
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
VONAGE_FROM_NUMBER=TESProperty
MOCK_SMS=true
```

### Frontend (client/.env)

```env
# API Base URL
VITE_API_URL=http://localhost:3000/api
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Backend server port |
| `CORS_ORIGIN` | Yes | - | Frontend URL for CORS |
| `DB_HOST` | Yes | - | MySQL host address |
| `DB_PORT` | No | 3306 | MySQL port |
| `DB_USER` | Yes | - | MySQL username |
| `DB_PASSWORD` | Yes | - | MySQL password |
| `DB_NAME` | Yes | - | Database name (TESdb) |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | 30d | Token expiration time |
| `VONAGE_API_KEY` | Required for live SMS | - | Vonage API key for OTP delivery |
| `VONAGE_API_SECRET` | Required for live SMS | - | Vonage API secret for OTP delivery |
| `VONAGE_FROM_NUMBER` | No | TESProperty | Sender ID shown on outbound OTP SMS |
| `MOCK_SMS` | No | true | When true, OTP is logged in server console (no SMS sent) |
| `VITE_API_URL` | Yes | - | Backend API URL (frontend) |

---

## SMS Authentication Setup (Phone OTP)

Use this section to enable real-time phone verification for customer accounts and inquiry protection.

### What this feature does

- Sends a one-time password (OTP) to a customer phone number
- Verifies the OTP before allowing inquiry submission
- Applies rate limiting to OTP requests
- Stores send and verify audit logs

### 1. Install and migrate

From project root:

1. Run PowerShell setup script:
   .\SETUP_PHONE_VERIFICATION.ps1
2. This installs dependencies and applies DB changes for:
   - customers.phone_verification_token
   - customers.phone_verification_expires
   - phone_verification_attempts
   - phone_verification_log

### 2. Configure environment

In backend .env:

- NODE_ENV=development
- VONAGE_API_KEY=your_vonage_api_key
- VONAGE_API_SECRET=your_vonage_api_secret
- VONAGE_FROM_NUMBER=TESProperty
- MOCK_SMS=false

Mode behavior:

- Live SMS mode: VONAGE credentials set and MOCK_SMS=false
  - OTP is sent to the customer phone in real time
- Mock mode: MOCK_SMS=true or missing VONAGE credentials
  - OTP is printed in backend terminal only

### 3. Start services

1. Start backend and frontend:
   npm run dev
2. Create or login a customer account with phone number
3. Trigger phone verification from signup, profile, or inquiry flow

### 4. Phone verification API flow

Base URL: /api/customers

1. POST /send-phone-otp
   - Requires authenticated customer token
   - Sends OTP (or logs OTP in mock mode)
   - Returns message, expiresIn, and mode

2. POST /verify-phone
   - Body: { otp }
   - Marks phone_verified=true when OTP matches and is not expired

3. POST /resend-phone-otp
   - Resends OTP with cooldown and rate limits

4. PUT /me
   - If phone changes, phone verification is reset and must be re-verified

### 5. Troubleshooting live OTP

- OTP not arriving:
  - Ensure MOCK_SMS=false
  - Ensure VONAGE_API_KEY and VONAGE_API_SECRET are set correctly
  - Check backend logs for Vonage error text
  - Verify target phone format is valid Philippine mobile number

- OTP only appears in terminal:
  - You are in mock mode (MOCK_SMS=true) or Vonage credentials are missing

- API returns SMS service not configured:
  - Set VONAGE_API_KEY and VONAGE_API_SECRET in backend .env, then restart server

---

## 🔑 Default Credentials

> ⚠️ **Security Warning**: Change all default passwords immediately after first deployment!

### Admin Account
```
Email: admin@tesproperty.com
Password: admin123
Role: admin
```

### Agent Accounts
```
Agent 1 (Maria):
Email: maria@tesproperty.com
Password: agent123
Role: agent

Agent 2 (Juan):
Email: juan@tesproperty.com
Password: agent123
Role: agent
```

### Customer Accounts
```
No default customer accounts.
Customers must sign up through the Customer Portal.
```

---

## 🧩 Common Inquiry Status Flow

```
📝 NEW (Submitted)
   ↓
   → Agent Claim
   ↓
🏷️ CLAIMED (Agent claimed ticket - automatic)
   ↓
   → Agent contacts customer
   ↓
📞 CONTACTED
   ↓
   → Agent schedules viewing
   ↓
📅 VIEWING-SCHEDULED
   ↓
   → Viewing happens → Agent marks as done
   ↓
   ├─→ 👍 VIEWED-INTERESTED
   │    ↓
   │    💼 NEGOTIATING
   │    ↓
   │    ├─→ ✅ DEAL-SUCCESSFUL (Terminal - allows resubmission)
   │    └─→ ❌ DEAL-CANCELLED (Terminal - allows resubmission)
   │
   └─→ 👎 VIEWED-NOT-INTERESTED
        ↓
        (Can move to NO-RESPONSE if customer stops responding)

🚫 NO-RESPONSE (Terminal - allows resubmission)
```

**Terminal States** (customer can submit new inquiry for same property):
- ✅ DEAL-SUCCESSFUL
- ❌ DEAL-CANCELLED  
- 🚫 NO-RESPONSE

---

## 🐛 Troubleshooting

### Cannot connect to MySQL

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Ensure MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```
2. Verify credentials in `.env`
3. Check MySQL port (default 3306)
4. Test connection:
   ```bash
   mysql -u root -p -h localhost
   ```

### Unknown database 'TESdb'

**Error:**
```
Error: Unknown database 'TESdb'
```

**Solution:**
Run schema creation:
```bash
npm run db:schema
```

### CORS errors

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
1. Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
2. Ensure frontend uses correct API URL in `client/.env`
3. Default setup:
   - Backend: `CORS_ORIGIN=http://localhost:5173`
   - Frontend: `VITE_API_URL=http://localhost:3000/api`

### Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### JWT token expired

**Error:**
```
401 Unauthorized - Token expired
```

**Solution:**
1. Log out and log in again
2. Check `JWT_EXPIRES_IN` in `.env` (default 30d)
3. Clear browser localStorage if issues persist

### Cannot claim inquiry

**Error:**
```
Ticket already claimed by another agent
```

**Reason:**
Another agent claimed the ticket first (race condition).

**Solution:**
Inquiries work on a first-come, first-served basis. Try claiming other available tickets.

### Migration errors

**Error:**
```
ER_DUP_FIELDNAME: Duplicate column name
```

**Reason:**
Column already exists from previous migration.

**Solution:**
This is normal and safe - the migration script continues. The warning can be ignored.

---

## 📊 Database Maintenance

### Backup Database

```bash
# Full backup
mysqldump -u root -p TESdb > backup_$(date +%Y%m%d).sql

# Tables only (no data)
mysqldump -u root -p --no-data TESdb > schema.sql
```

### Restore Database

```bash
mysql -u root -p TESdb < backup_20260311.sql
```

### Reset to Clean State

```bash
# Remove all data but keep schema
node scripts/clearDemoData.js

# Completely recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS TESdb;"
npm run db:schema
npm run db:seed
```

### View Database Statistics

```bash
node -e "const pool = require('./server/db'); \
(async () => { \
  const [tables] = await pool.query('SHOW TABLES'); \
  console.log('Tables:', tables.length); \
  const [users] = await pool.query('SELECT COUNT(*) as c FROM users'); \
  console.log('Users:', users[0].c); \
  const [props] = await pool.query('SELECT COUNT(*) as c FROM properties'); \
  console.log('Properties:', props[0].c); \
  const [inqs] = await pool.query('SELECT COUNT(*) as c FROM inquiries'); \
  console.log('Inquiries:', inqs[0].c); \
  await pool.end(); \
})();"
```

---

## 🚀 Deployment

### Production Build

1. **Build frontend:**
   ```bash
   cd client
   npm run build
   ```
   Output: `client/dist/`

2. **Serve static files:**
   Configure nginx/Apache to serve `client/dist/` and proxy `/api` to backend.

3. **Backend environment:**
   ```env
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://yourdomain.com
   DB_HOST=production-db-host
   JWT_SECRET=very-long-random-production-secret
   ```

4. **Start backend:**
   ```bash
   npm start
   ```

### Process Management

Use PM2 for production:
```bash
npm install -g pm2

# Start backend
pm2 start server/index.js --name tes-property-api

# Monitor
pm2 status
pm2 logs tes-property-api

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend static files
    location / {
        root /path/to/siaFINALwithbackend-database/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded images
    location /uploads {
        alias /path/to/siaFINALwithbackend-database/server/uploads;
    }
}
```

---

## 📝 License

This project is proprietary software developed for TES Property Management.

---

## 🤝 Support

For issues, questions, or feature requests:
- Check this README first
- Review [Troubleshooting](#-troubleshooting) section
- Check database migration status
- Verify environment configuration
- Review activity logs for errors

---

## 📌 Summary

TES Property Management System v2.0 is a complete, production-ready real estate management platform with:

✅ **Customer Portal** with authentication  
✅ **Agent Portal** with smart workflows  
✅ **Admin Portal** with full control  
✅ **Database Portal** for super admins  
✅ **Automated inquiry workflow** (new → claimed → assigned)  
✅ **Calendar management** with viewing outcomes  
✅ **One inquiry per property** rule  
✅ **Complete security** (JWT, RBAC, rate limiting)  
✅ **Activity logging** for full audit trail  
✅ **Database migrations** for schema versioning  

**Ready to use** - just install, configure, and run! 🚀
