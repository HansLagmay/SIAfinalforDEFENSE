# 🏢 TES Property Management System - Complete Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [Installation Guide](#installation-guide)
4. [Database Schema](#database-schema)
5. [System Flow & Logic](#system-flow--logic)
6. [Features & Functionalities](#features--functionalities)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Security Features](#security-features)
10. [Phone Verification System](#phone-verification-system)
11. [How to Run](#how-to-run)
12. [Testing Guide](#testing-guide)
13. [Troubleshooting](#troubleshooting)

---

## 📊 System Overview

**TES Property Management System** is a full-stack web application for managing real estate properties, customer inquiries, agent assignments, and property viewings.

### Technology Stack

**Frontend:**
- React 18.3.1 (UI Framework)
- TypeScript 5.9.3 (Type Safety)
- Vite 5.4.21 (Build Tool & Dev Server)
- React Router 6.30.3 (Client-side Routing)
- Axios 1.13.6 (HTTP Client)
- Tailwind CSS 3.3.6 (Styling)

**Backend:**
- Node.js 24.14.0+ (Runtime)
- Express 4.22.1 (Web Framework)
- MySQL 8.0+ (Database)
- JWT (Authentication)
- Vonage 3.26.4 (SMS API)

**Key Libraries:**
- bcryptjs 2.4.3 (Password Hashing)
- multer 2.0.2 (File Uploads)
- express-rate-limit 6.11.2 (Rate Limiting)
- helmet 7.0.0 (Security Headers)
- uuid 9.0.1 (Unique IDs)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  React SPA - http://localhost:5173                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Customer Portal │ Agent Portal │ Admin Portal        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS (Axios)
                         │ JWT Token in Headers
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER                         │
│  Express.js - http://localhost:3000/api                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes:                                              │   │
│  │ • /auth          - Authentication                    │   │
│  │ • /customers     - Customer management & OTP         │   │
│  │ • /properties    - Property CRUD                     │   │
│  │ • /inquiries     - Inquiry management                │   │
│  │ • /users         - User/Agent management             │   │
│  │ • /calendar      - Calendar events                   │   │
│  │ • /database      - Super admin database access       │   │
│  │ • /activity-log  - Activity logging                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware:                                          │   │
│  │ • JWT Auth       - Token verification                │   │
│  │ • Rate Limiter   - Prevent abuse                     │   │
│  │ • Sanitizer      - XSS protection                    │   │
│  │ • Helmet         - Security headers                  │   │
│  │ • CORS           - Cross-origin requests             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Services:                                            │   │
│  │ • smsService.js  - Vonage SMS integration            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ MySQL2 Connection Pool
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      MySQL DATABASE                          │
│  TESdb - MySQL 8.0+                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables:                                              │   │
│  │ • customers                  (Customer accounts)     │   │
│  │ • users                      (Admin/Agent accounts)  │   │
│  │ • properties                 (Property listings)     │   │
│  │ • property_images            (Property photos)       │   │
│  │ • inquiries                  (Customer inquiries)    │   │
│  │ • calendar_events            (Agent calendar)        │   │
│  │ • customer_appointments       (Viewing schedules)    │   │
│  │ • phone_verification_attempts (Rate limiting)        │   │
│  │ • phone_verification_log     (Audit trail)          │   │
│  │ • activity_log               (System activity)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  • Vonage SMS API (Phone verification)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation Guide

### Prerequisites

**Required Software:**
1. **Node.js** v18.0+ (Recommended: v24.14.0)
   - Download: https://nodejs.org/
   
2. **MySQL** 8.0+
   - Download: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP: https://www.apachefriends.org/
   
3. **Git** (for cloning)
   - Download: https://git-scm.com/

4. **PowerShell** (Windows) or Terminal (Mac/Linux)

### Step-by-Step Installation

#### 1. Clone/Download Project
```powershell
cd C:\Users\[YourUsername]\Desktop
# If you already have the folder, skip this
```

#### 2. Install Backend Dependencies
```powershell
cd fullstacksia\siaFINALwithbackend-database
npm install
```

This installs:
- Express, MySQL2, JWT, bcryptjs
- Vonage SDK (for SMS)
- Multer (file uploads)
- Security packages (helmet, cors, rate-limit)

#### 3. Install Frontend Dependencies
```powershell
cd client
npm install
cd ..
```

This installs:
- React, React Router, TypeScript
- Vite (build tool)
- Axios (HTTP client)
- Tailwind CSS

#### 4. Configure Environment Variables
```powershell
# Create .env file (if not exists)
Copy-Item .env.example .env

# Edit .env and update:
# - DB_PASSWORD (your MySQL password)
# - DB_USER (your MySQL username, usually 'root')
```

**.env Configuration:**
```env
# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root          # ← CHANGE THIS TO YOUR MYSQL PASSWORD
DB_NAME=TESdb

# JWT Secret
JWT_SECRET=6200804093489
JWT_EXPIRES_IN=30d

# Frontend URL
VITE_API_URL=http://localhost:3000/api

# Vonage SMS (Optional - for production SMS)
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=TESProperty

# OTP Configuration
PHONE_OTP_EXPIRY=300000          # 5 minutes
RESEND_OTP_COOLDOWN=300000       # 5 minutes
```

#### 5. Start MySQL Server
- **If using XAMPP**: Start MySQL from control panel
- **If using standalone MySQL**: `mysql.server start` or start MySQL service

#### 6. Create Database & Tables
```powershell
# Create database schema
npm run db:schema

# Seed demo data (optional)
npm run db:seed
```

This creates:
- `TESdb` database
- All 10 tables with proper schema
- Demo users, properties, and sample data

#### 7. Setup Phone Verification
```powershell
# Run automated setup (from root folder)
cd ..
.\SETUP_PHONE_VERIFICATION.ps1
```

This:
- Installs Vonage SDK
- Adds phone verification columns to database
- Verifies setup

#### 8. Verify Installation
```powershell
.\CHECK_PHONE_VERIFICATION.ps1
```

Should show all ✅ green checks.

---

## 🗄️ Database Schema

### Core Tables

#### **1. customers** (Customer Accounts)
```sql
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email_verified TINYINT(1) DEFAULT 0,
  phone_verified TINYINT(1) DEFAULT 0,
  verification_token VARCHAR(255),
  verification_token_expires DATETIME,
  phone_verification_token VARCHAR(255),     -- OTP code
  phone_verification_expires DATETIME,       -- OTP expiry
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **2. users** (Admin & Agent Accounts)
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'agent') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **3. properties** (Property Listings)
```sql
CREATE TABLE properties (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),                          -- house, condo, apartment
  status VARCHAR(50) DEFAULT 'available',    -- available, reserved, sold
  price DECIMAL(15,2),
  location VARCHAR(255),
  bedrooms INT,
  bathrooms INT,
  size DECIMAL(10,2),
  size_unit VARCHAR(20) DEFAULT 'sqm',
  images TEXT,                               -- JSON array of image URLs
  features TEXT,                             -- Comma-separated
  year_built INT,
  parking_spaces INT,
  is_new BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### **4. inquiries** (Customer Inquiries)
```sql
CREATE TABLE inquiries (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36),
  ticket_number VARCHAR(50) UNIQUE,          -- INQ-2026-001
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,
  property_id VARCHAR(36),
  property_title VARCHAR(255),
  property_price DECIMAL(15,2),
  property_location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new',          -- new, in-progress, closed, etc.
  assigned_to VARCHAR(36),                   -- Agent assigned
  claimed_by VARCHAR(36),                    -- Agent who claimed
  assigned_by VARCHAR(36),                   -- Admin who assigned
  claimed_at DATETIME,
  assigned_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### **5. calendar_events** (Agent Calendar)
```sql
CREATE TABLE calendar_events (
  id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36),
  inquiry_id VARCHAR(36),
  property_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),                          -- viewing, meeting, call
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',    -- scheduled, completed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);
```

#### **6. phone_verification_attempts** (Rate Limiting)
```sql
CREATE TABLE phone_verification_attempts (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  attempt_count INT DEFAULT 1,
  last_attempt_at DATETIME NOT NULL,
  reset_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_phone (phone),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

#### **7. phone_verification_log** (Audit Trail)
```sql
CREATE TABLE phone_verification_log (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  otp_sent VARCHAR(10) NOT NULL,
  sent_at DATETIME NOT NULL,
  verified_at DATETIME,
  expires_at DATETIME NOT NULL,
  status ENUM('pending', 'verified', 'expired', 'failed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

#### **8. property_images** (Property Photos)
```sql
CREATE TABLE property_images (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);
```

#### **9. customer_appointments** (Customer View Schedule)
```sql
CREATE TABLE customer_appointments (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  calendar_event_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);
```

#### **10. activity_log** (System Activity)
```sql
CREATE TABLE activity_log (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  user VARCHAR(255),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 System Flow & Logic

### 1. Customer Journey Flow

```
START
  ↓
[1] Customer visits website (http://localhost:5173)
  ↓
[2] Browse public properties (No login required)
  ↓
[3] Click "Sign Up" to create account
  ↓
[4] Customer fills signup form:
    - Name, Email, Password (Required)
    - Phone Number (Optional - Recommended)
  ↓
[5] Click "Create Account"
  ↓
[6] Account created + Auto-login
  ↓
[7] Did customer provide phone number?
  ├─ YES → Phone Verification Flow
  │   ↓
  │   [8] Phone verification modal appears automatically
  │   ↓
  │   [9] 6-digit OTP sent via SMS (or console in dev mode)
  │   ↓
  │   [10] Customer enters OTP code
  │   ↓
  │   [11] OTP verified → Phone marked as verified
  │   ↓
  │   [12] Modal closes, proceed to portal
  │   ↓
  └─ NO → Skip verification, proceed to portal
  ↓
[13] Customer browses properties
  ↓
[14] Click "Send Inquiry" on a property
  ↓
[15] Backend checks: Is phone verified?
  ├─ NO PHONE → Error: "Phone number required. Update profile first."
  │   ↓
  ├─ PHONE NOT VERIFIED → Error: "Phone verification required"
  │   ↓  (This should not happen with new flow, but kept as safeguard)
  │   └─ Show verification modal, verify, retry inquiry
  │
  └─ PHONE VERIFIED → Allow inquiry submission ✅
  ↓
[16] Inquiry created with ticket number (INQ-2026-XXX)
  ↓
[17] Inquiry appears in Admin/Agent dashboards
  ↓
[18] Agent claims or Admin assigns inquiry
  ↓
[19] Agent schedules property viewing
  ↓
[20] Customer receives appointment details
  ↓
[21] Viewing happens → Status updated
  ↓
[22] Deal successful/cancelled/no-response
  ↓
END
```

### 2. Phone Verification Flow (Detailed)

```
[Customer fills signup form]
  ↓
Provides phone number? (Optional field)
  ↓
    NO ──────────────────────────────┐
     │                                │
     ↓                                │
Account created                       │
Auto-login                            │
Portal loaded ✅                      │
(Must add phone + verify before       │
 submitting inquiries)                │
     │                                │
     └────────────────────────────────┤
                                      │
    YES                               │
     ↓                                │
Account created                       │
Auto-login                            │
     ↓                                │
Phone Verification Modal              │
AUTO-OPENS immediately                │
     ↓                                │
┌────────────────────────┐           │
│ Phone Verification      │           │
│ Modal                  │           │
│                        │           │
│ We've sent a code to:  │           │
│ +639171234567          │           │
│                        │           │
│ [_] [_] [_] [_] [_] [_]│           │
│  6-digit OTP input     │           │
│                        │           │
│ Code expires in 4:52   │           │
│                        │           │
│ [Resend Code] [X Close]│           │
└────────────────────────┘           │
     ↓                                │
[BACKEND PROCESS]                     │
     ↓                                │
1. Generate random 6-digit OTP        │
   (e.g., 123456)                     │
     ↓                                │
2. Store in customers table:          │
   - phone_verification_token         │
   - phone_verification_expires       │
     = NOW() + 5 minutes              │
     ↓                                │
3. Check rate limiting:               │
   Check phone_verification_attempts  │
   If 3+ attempts in last 5 mins      │
   → Reject                           │
     ↓                                │
4. Increment attempt counter          │
     ↓                                │
5. Log to phone_verification_log:     │
   - customer_id, phone, otp_sent     │
   - sent_at, expires_at              │
   - status = 'pending'               │
     ↓                                │
6. Send SMS:                          │
   ├─ Development Mode:               │
   │  → Console log OTP code          │
   │  → Return success                │
   │                                  │
   └─ Production Mode:                │
      → Call Vonage API               │
      → Send real SMS to phone        │
      → Return Vonage response        │
     ↓                                │
7. Return success to frontend         │
     ↓                                │
[FRONTEND PROCESS]                    │
     ↓                                │
Customer enters 6-digit code          │
     ↓                                │
Auto-submit when all 6 digits entered │
     ↓                                │
Send to backend:                      │
POST /api/customers/verify-phone      │
     ↓                                │
[BACKEND VERIFICATION]                │
     ↓                                │
1. Fetch customer's                   │
   phone_verification_token           │
   and expires                        │
     ↓                                │
2. Check expiry:                      │
   NOW() > expires_at?                │
   ├─ YES → Return error:             │
   │        "Code expired"            │
   └─ NO → Continue                   │
     ↓                                │
3. Compare OTP:                       │
   input === stored?                  │
   ├─ NO → Update log:                │
   │        status = 'failed'         │
   │       → Return error:            │
   │         "Invalid code"           │
   │                                  │
   └─ YES → Continue                  │
     ↓                                │
4. Update customers table:            │
   - phone_verified = TRUE            │
   - phone_verification_token = NULL  │
   - phone_verification_expires = NULL│
     ↓                                │
5. Update log:                        │
   - status = 'verified'              │
   - verified_at = NOW()              │
     ↓                                │
6. Delete from                        │
   phone_verification_attempts        │
   (reset counter)                    │
     ↓                                │
7. Return success:                    │
   "Phone verified!"                  │
     ↓                                │
[FRONTEND]                            │
     ↓                                │
Show success message                  │
     ↓                                │
Close modal after 1.5 seconds         │
     ↓                                │
Continue to portal                    │
     ↓                                │
     └────────────────────────────────┘
     ↓
Customer can now submit inquiries ✅
```

### 3. Agent Assignment Flow

```
[Inquiry created]
  ↓
  status = 'new'
  assigned_to = NULL
  claimed_by = NULL
  ↓
┌─────────────────────────────────────┐
│ Option 1: Agent Claims (Self-assign)│
├─────────────────────────────────────┤
│ Agent views unassigned inquiries    │
│   ↓                                  │
│ Agent clicks "Claim"                 │
│   ↓                                  │
│ POST /api/inquiries/:id/claim       │
│   ↓                                  │
│ Update inquiry:                      │
│ - claimed_by = agent.id              │
│ - assigned_to = agent.id             │
│ - claimed_at = NOW()                 │
│ - status = 'claimed'                 │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Option 2: Admin Assigns              │
├─────────────────────────────────────┤
│ Admin views all inquiries            │
│   ↓                                  │
│ Admin selects agent from dropdown    │
│   ↓                                  │
│ POST /api/inquiries/:id/assign      │
│   ↓                                  │
│ Update inquiry:                      │
│ - assigned_to = selected_agent.id    │
│ - assigned_by = admin.id             │
│ - assigned_at = NOW()                │
│ - status = 'assigned'                │
└─────────────────────────────────────┘
  ↓
Agent handles inquiry
```

---

## 🎯 Features & Functionalities

### Customer Features

#### 1. Account Management
- **Sign Up**: Create account with name, email, phone, password
- **Login**: Secure JWT authentication (30-day sessions)
- **Profile**: View and update profile information
- **Phone Verification**: One-time SMS OTP verification

#### 2. Property Browsing
- **Browse All**: View all available properties
- **Property Details**: View detailed property information
- **Image Gallery**: Swipeable image carousel
- **Filters**: Search by type, price, location
- **Status Badges**: Available, Reserved, Sold indicators

#### 3. Inquiry Management
- **Submit Inquiries**: Send inquiries about properties
- **Ticket Tracking**: Unique ticket numbers (INQ-2026-XXX)
- **Duplicate Prevention**: One active inquiry per property
- **Contact Preferences**: Specify preferred contact methods
- **Status Updates**: Track inquiry progress

#### 4. Appointments
- **View Schedule**: See scheduled property viewings
- **Appointment Details**: Date, time, property, agent info
- **Calendar Integration**: Upcoming appointments dashboard

### Agent Features

#### 1. Dashboard
- **Statistics**: Active inquiries, total handled, success rate
- **Quick Actions**: Access key features quickly
- **Performance Metrics**: Conversion rates, response times

#### 2. Inquiry Management
- **View Inquiries**: All assigned and claimable inquiries
- **Claim Inquiries**: Self-assign from available pool
- **Status Updates**: Update inquiry status throughout lifecycle
- **Filters**: By status, date, property
- **Ticket Search**: Find inquiries by ticket number

#### 3. Calendar Management
- **Create Events**: Schedule viewings, meetings, calls
- **View Calendar**: See all scheduled events
- **Event Types**: Viewing, Meeting, Call, Other
- **Time Management**: Duration-based scheduling
- **Status Tracking**: Scheduled, Completed, Cancelled

#### 4. Property Management
- **Create Drafts**: Submit property drafts (pending admin approval)
- **View Properties**: Access to property listings
- **Property Details**: Full property information

#### 5. Commission Tracking
- **View Commissions**: Track earnings by property
- **Status**: Pending, Approved commissions
- **Total Earnings**: Cumulative commission total

### Admin Features

#### 1. Dashboard
- **Overview Stats**: Total properties, inquiries, agents
- **System Metrics**: Active listings, pending inquiries
- **Quick Actions**: Access all admin functions

#### 2. Property Management (Full CRUD)
- **Create Properties**: Add new property listings
- **Edit Properties**: Update property details
- **Delete Properties**: Remove listings
- **Image Upload**: Multiple property images (up to 10)
- **Status Management**: Available, Reserved, Sold
- **Draft Approval**: Review and approve agent drafts

#### 3. Inquiry Management
- **View All**: See all customer inquiries
- **Assign Agents**: Assign inquiries to specific agents
- **Status Control**: Update inquiry status
- **Bulk Actions**: Manage multiple inquiries
- **Analytics**: Inquiry statistics and trends

#### 4. User Management
- **Create Agents**: Add new agent accounts
- **View Users**: List all admin/agent accounts
- **Delete Users**: Remove user accounts
- **Role Management**: Admin or Agent roles

#### 5. Agent Assignment
- **View Workload**: See agent inquiry distribution
- **Manual Assignment**: Assign inquiries to agents
- **Balance Load**: Distribute inquiries evenly

#### 6. Reports & Analytics
- **Activity Log**: View all system activities
- **Inquiry Reports**: Status, trends, agent performance
- **Property Reports**: Listings, sales, reservations

### Super Admin Features

#### 1. Database Portal
- **Direct Database Access**: View all tables
- **Table Overview**: Row counts, last updated
- **View Records**: Browse table data
- **Export Data**: CSV and JSON exports
- **File Metadata**: Table statistics

#### 2. System Administration
- **Clear New Flags**: Reset "new" indicators
- **Bulk Operations**: Database-wide actions
- **System Logs**: Comprehensive activity logs

---

## 📡 API Endpoints Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Admin/Agent Login
```http
POST /auth
Content-Type: application/json

{
  "email": "admin@tes.com",
  "password": "password123"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "admin@tes.com",
    "name": "Admin User",
    "role": "admin"
  },
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

### Customer Endpoints

#### 1. Customer Signup
```http
POST /customers/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "09171234567",
  "password": "password123"
}

Response 201:
{
  "message": "Account created successfully!",
  "customerId": "uuid"
}
```

#### 2. Customer Login
```http
POST /customers/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response 200:
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "09171234567",
    "role": "customer",
    "phoneVerified": false
  }
}
```

#### 3. Send Phone OTP
```http
POST /customers/send-phone-otp
Authorization: Bearer <customer_token>

Response 200:
{
  "message": "Verification code sent to your phone",
  "expiresIn": 300,
  "mode": "development"
}
```

#### 4. Verify Phone
```http
POST /customers/verify-phone
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "otp": "123456"
}

Response 200:
{
  "message": "Phone number verified successfully!",
  "phoneVerified": true
}
```

#### 5. Resend Phone OTP
```http
POST /customers/resend-phone-otp
Authorization: Bearer <customer_token>

Response 200:
{
  "message": "Verification code sent to your phone",
  "expiresIn": 300
}
```

#### 6. Get Customer Profile
```http
GET /customers/me
Authorization: Bearer <customer_token>

Response 200:
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "09171234567",
  "email_verified": true,
  "phone_verified": true,
  "created_at": "2026-03-12T10:00:00.000Z"
}
```

### Property Endpoints

#### 1. Get All Properties (Public)
```http
GET /properties?page=1&limit=20

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "title": "Modern 3BR House",
      "description": "Beautiful house...",
      "type": "house",
      "status": "available",
      "price": 5500000,
      "location": "Quezon City",
      "bedrooms": 3,
      "bathrooms": 2,
      "size": 120,
      "images": ["url1", "url2"],
      "created_at": "2026-03-12T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 2. Get Property by ID
```http
GET /properties/:id

Response 200:
{
  "id": "uuid",
  "title": "Modern 3BR House",
  ...full property details
}
```

#### 3. Create Property (Admin)
```http
POST /properties
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "New Property",
  "description": "Description here",
  "type": "house",
  "price": 5500000,
  "location": "Quezon City",
  "bedrooms": 3,
  "bathrooms": 2,
  "size": 120,
  "images": ["url1", "url2"],
  "features": "parking, garden, security"
}

Response 201:
{
  "id": "uuid",
  "title": "New Property",
  ...
}
```

#### 4. Upload Property Images (Admin)
```http
POST /properties/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- images: file1
- images: file2
- images: file3

Response 200:
{
  "imageUrls": [
    "/uploads/properties/uuid-1.jpg",
    "/uploads/properties/uuid-2.jpg",
    "/uploads/properties/uuid-3.jpg"
  ]
}
```

#### 5. Update Property (Admin)
```http
PUT /properties/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "reserved",
  "price": 5800000
}

Response 200:
{
  "id": "uuid",
  ...updated property
}
```

#### 6. Delete Property (Admin)
```http
DELETE /properties/:id
Authorization: Bearer <admin_token>

Response 200:
{
  "message": "Property deleted successfully"
}
```

### Inquiry Endpoints

#### 1. Create Inquiry
```http
POST /inquiries
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "09171234567",
  "message": "I'm interested in this property",
  "propertyId": "property_uuid",
  "propertyTitle": "Modern 3BR House",
  "propertyPrice": 5500000,
  "propertyLocation": "Quezon City"
}

Response 201:
{
  "id": "uuid",
  "ticketNumber": "INQ-2026-001",
  "status": "new",
  ...inquiry details
}

Error 403 (Requires Phone Verification):
{
  "error": "Phone verification required",
  "requiresPhoneVerification": true,
  "phone": "09171234567"
}
```

#### 2. Get All Inquiries (Admin/Agent)
```http
GET /inquiries?page=1&limit=20
Authorization: Bearer <token>

Response 200:
{
  "data": [...inquiries],
  "pagination": {...}
}
```

#### 3. Get Inquiry by ID (Admin/Agent)
```http
GET /inquiries/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "ticketNumber": "INQ-2026-001",
  ...inquiry details
}
```

#### 4. Update Inquiry Status (Admin/Agent)
```http
PUT /inquiries/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress"
}

Response 200:
{
  "id": "uuid",
  "status": "in-progress",
  ...
}
```

#### 5. Claim Inquiry (Agent)
```http
POST /inquiries/:id/claim
Authorization: Bearer <agent_token>

Response 200:
{
  "message": "Inquiry claimed successfully",
  "inquiry": {
    "id": "uuid",
    "claimedBy": "agent_uuid",
    "assignedTo": "agent_uuid",
    "status": "claimed"
  }
}
```

#### 6. Assign Inquiry (Admin)
```http
POST /inquiries/:id/assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "agentId": "agent_uuid"
}

Response 200:
{
  "message": "Inquiry assigned successfully",
  "inquiry": {
    "id": "uuid",
    "assignedTo": "agent_uuid",
    "assignedBy": "admin_uuid",
    "status": "assigned"
  }
}
```

#### 7. Get Agent Workload (Admin/Agent)
```http
GET /inquiries/agents/workload
Authorization: Bearer <token>

Response 200:
[
  {
    "agentId": "uuid",
    "agentName": "Agent Name",
    "activeInquiries": 5,
    "totalInquiries": 20,
    "successfulInquiries": 10
  }
]
```

### Calendar Endpoints

#### 1. Get Calendar Events (Agent)
```http
GET /calendar?start=2026-03-01&end=2026-03-31
Authorization: Bearer <agent_token>

Response 200:
[
  {
    "id": "uuid",
    "title": "Property Viewing",
    "description": "View 3BR house",
    "type": "viewing",
    "start": "2026-03-15T10:00:00.000Z",
    "end": "2026-03-15T11:00:00.000Z",
    "status": "scheduled",
    "agentId": "uuid",
    "propertyId": "uuid"
  }
]
```

#### 2. Create Calendar Event (Agent)
```http
POST /calendar
Authorization: Bearer <agent_token>
Content-Type: application/json

{
  "title": "Property Viewing",
  "description": "Show property to customer",
  "type": "viewing",
  "startTime": "2026-03-15T10:00:00.000Z",
  "endTime": "2026-03-15T11:00:00.000Z",
  "propertyId": "property_uuid",
  "customerId": "customer_uuid",
  "inquiryId": "inquiry_uuid"
}

Response 201:
{
  "id": "uuid",
  "title": "Property Viewing",
  ...event details
}
```

#### 3. Update Calendar Event (Agent)
```http
PUT /calendar/:id
Authorization: Bearer <agent_token>
Content-Type: application/json

{
  "status": "completed"
}

Response 200:
{
  "id": "uuid",
  "status": "completed",
  ...
}
```

#### 4. Delete Calendar Event (Agent)
```http
DELETE /calendar/:id
Authorization: Bearer <agent_token>

Response 200:
{
  "message": "Event deleted successfully"
}
```

### User Management Endpoints (Admin)

#### 1. Get All Users
```http
GET /users
Authorization: Bearer <admin_token>

Response 200:
[
  {
    "id": "uuid",
    "email": "agent@tes.com",
    "name": "Agent Name",
    "role": "agent",
    "created_at": "2026-03-12T10:00:00.000Z"
  }
]
```

#### 2. Get All Agents
```http
GET /users/agents
Authorization: Bearer <admin_token>

Response 200:
[
  {
    "id": "uuid",
    "name": "Agent Name",
    "email": "agent@tes.com"
  }
]
```

#### 3. Create Agent
```http
POST /users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newagent@tes.com",
  "password": "password123",
  "name": "New Agent",
  "role": "agent"
}

Response 201:
{
  "id": "uuid",
  "email": "newagent@tes.com",
  "name": "New Agent",
  "role": "agent"
}
```

#### 4. Delete User
```http
DELETE /users/:id
Authorization: Bearer <admin_token>

Response 200:
{
  "message": "User deleted successfully"
}
```

### Database Endpoints (Super Admin)

#### 1. Get Database Overview
```http
GET /database/overview
Authorization: Bearer <admin_token>

Response 200:
{
  "tables": [
    {
      "name": "properties",
      "rows": 50,
      "lastUpdated": "2026-03-12T10:00:00.000Z"
    }
  ]
}
```

#### 2. Export Table to CSV
```http
GET /database/export/properties/csv
Authorization: Bearer <admin_token>

Response 200:
(CSV file download)
```

#### 3. Export Table to JSON
```http
GET /database/export/properties/json
Authorization: Bearer <admin_token>

Response 200:
(JSON file download)
```

---

## 👥 User Roles & Permissions

### Customer
**Access**: Public website + Customer portal

**Can**:
- Browse properties (no login required)
- Sign up and login
- Verify phone with OTP
- Submit inquiries (after phone verification)
- View own appointments
- Update own profile

**Cannot**:
- Access admin/agent portals
- Create/edit properties
- Assign inquiries
- View other customers' data

### Agent
**Access**: Agent portal

**Can**:
- View assigned/claimed inquiries
- Claim unassigned inquiries
- Update inquiry status
- Schedule property viewings
- Manage own calendar
- Create property drafts (pending admin approval)
- View all properties
- View commission reports

**Cannot**:
- Approve property listings
- Delete properties
- Create other agents
- Assign inquiries to other agents
- Access database portal

### Admin
**Access**: Admin portal

**Can**:
- All Agent permissions +
- Create/edit/delete properties
- Approve agent property drafts
- Assign inquiries to agents
- Create/delete agent accounts
- View all system reports
- Access activity logs
- Manage all inquiries
- Override agent actions

**Cannot**:
- (Admins have nearly full access)

### Super Admin
**Access**: All portals + Database portal

**Can**:
- All Admin permissions +
- Direct database access
- Export all table data
- View system-level statistics
- Clear new flags
- Perform bulk operations

---

## 🔒 Security Features

### 1. Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Token Expiry**: 30-day sessions with auto-refresh
- **Role-Based Access**: Middleware checks user roles
- **Password Hashing**: bcryptjs with salt rounds
- **Session Storage**: Local storage with encryption

### 2. Input Validation & Sanitization
- **XSS Protection**: HTML escape on all inputs
- **SQL Injection Prevention**: Parameterized queries only
- **Email Validation**: Regex pattern matching
- **Phone Validation**: Philippine format enforcement
- **Content Validation**: malicious content detection

### 3. Rate Limiting
- **Login Attempts**: 5 per 15 minutes per IP
- **Inquiry Submission**: 3 per 15 minutes per user
- **Property Creation**: 10 per hour (admin)
- **OTP Requests**: 3 per 5 minutes per phone
- **API Rate Limit**: 100 requests per 15 minutes

### 4. Phone Verification Security
- **OTP Expiry**: 5-minute validity
- **Rate Limiting**: 3 attempts per 5 minutes
- **Resend Cooldown**: 2 minutes before expiry
- **Audit Logging**: All OTP events logged
- **Token Cleanup**: Auto-delete after verification
- **Failed Attempts**: Tracked and limited

### 5. HTTP Security
- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configured origin whitelist
- **HTTPS Ready**: SSL/TLS support
- **Cookie Security**: HttpOnly, Secure flags

### 6. Database Security
- **Prepared Statements**: No raw SQL queries
- **Foreign Keys**: Referential integrity
- **Cascading Deletes**: Proper cleanup
- **Connection Pooling**: Prevent connection exhaustion

### 7. File Upload Security
- **File Type Validation**: Images only (.jpg, .png, .webp)
- **File Size Limit**: 5MB per image
- **File Count Limit**: 10 images per upload
- **Unique Filenames**: UUID-based naming
- **Directory Restrictions**: Uploads to specific folder only

---

## 📱 Phone Verification System

### Overview
The phone verification system ensures that customers verify their phone numbers before submitting property inquiries. This prevents spam and ensures contactability.

### Flow Diagram

```
Customer Signup
     ↓
Account Created
(phone_verified = FALSE)
     ↓
Customer Logs In
     ↓
Browses Properties
     ↓
Clicks "Send Inquiry"
     ↓
Fills Inquiry Form
     ↓
Submits Form
     ↓
Backend Checks:
phone_verified?
     ↓
    NO ──────────────────────────┐
     │                           │
     ↓                           │
Return 403 Error:                │
"Phone verification required"    │
     ↓                           │
Frontend Shows Modal              │
     ↓                           │
┌────────────────────────┐      │
│ Phone Verification      │      │
│ Modal Opens            │      │
└────────────────────────┘      │
     ↓                           │
AUTO: Send OTP Request           │
     ↓                           │
Backend:                         │
1. Generate 6-digit OTP          │
2. Store in database             │
3. Check rate limiting           │
4. Send SMS (or log to console)  │
     ↓                           │
Frontend:                        │
Display 6-digit input            │
Start 5-minute countdown         │
     ↓                           │
Customer Enters OTP              │
     ↓                           │
Submit to Backend                │
     ↓                           │
Backend Verifies:                │
- OTP matches?                   │
- Not expired?                   │
     ↓                           │
    YES                          │
     ↓                           │
Set phone_verified = TRUE        │
     ↓                           │
Return Success                   │
     ↓                           │
Frontend:                        │
- Show success message           │
- Close modal                    │
- AUTO-RETRY inquiry submission  │
     ↓                           │
     └───────────────────────────┘
     ↓
Inquiry Submitted Successfully
```

### Development vs Production Mode

#### Development Mode (Default)
```env
NODE_ENV=development
VONAGE_API_KEY=          # Leave empty
VONAGE_API_SECRET=       # Leave empty
```

**Behavior**:
- OTP codes logged to backend console
- No real SMS sent
- Unlimited OTP generation for testing
- Same verification logic as production

**Console Output**:
```
📱 SMS SERVICE - DEVELOPMENT MODE
==================================
To: +639171234567
From: TESProperty
Message: Your TES Property verification code is: 123456. Valid for 5 minutes...
OTP: 123456
==================================
```

#### Production Mode
```env
NODE_ENV=production
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM_NUMBER=TESProperty
```

**Behavior**:
- Real SMS sent via Vonage API
- Costs apply (~$0.01 per SMS)
- Free trial: $2 credit = ~200 SMS
- Production-grade logging

### OTP Configuration

**Expiry Time**: 5 minutes (configurable)
```env
PHONE_OTP_EXPIRY=300000  # milliseconds
```

**Resend Cooldown**: 5 minutes (configurable)
```env
RESEND_OTP_COOLDOWN=300000  # milliseconds
```

**Rate Limiting**: 3 attempts per 5 minutes per phone number

### Database Tables

**phone_verification_attempts**:
- Tracks OTP request attempts
- Enforces rate limiting (3 per 5 mins)
- Auto-resets after cooldown

**phone_verification_log**:
- Audit trail for all OTP events
- Status tracking: pending, verified, expired, failed
- Customer ID, phone, OTP sent, timestamps

### Security Measures

1. **Rate Limiting**: Prevents OTP spam (3 attempts per 5 min)
2. **Time-Based Expiry**: OTPs expire after 5 minutes
3. **One-Time Use**: OTP deleted after successful verification
4. **Audit Trail**: All attempts logged with timestamps
5. **Phone Number Validation**: Philippine format required
6. **Token Storage**: Secure in database, never in frontend

---

## 🚀 How to Run

### First Time Setup

1. **Ensure MySQL is Running**
   ```powershell
   # If using XAMPP: Start MySQL from control panel
   # If standalone: Check MySQL service is running
   ```

2. **Navigate to Project**
   ```powershell
   cd C:\Users\[YourUsername]\Desktop\fullstacksia\siaFINALwithbackend-database
   ```

3. **Create Database (First Time Only)**
   ```powershell
   npm run db:schema
   ```
   
   This creates `TESdb` database with all tables.

4. **Seed Demo Data (Optional)**
   ```powershell
   npm run db:seed
   ```
   
   This adds:
   - Demo admin: admin@tes.com / password123
   - Demo agent: agent@tes.com / password123
   - 10 sample properties
   - Sample inquiries

5. **Setup Phone Verification (First Time Only)**
   ```powershell
   cd ..
   .\SETUP_PHONE_VERIFICATION.ps1
   ```

### Daily Run (After Setup)

**Option 1: Run Both (Recommended)**
```powershell
cd siaFINALwithbackend-database
npm run dev
```

This starts:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173

**Option 2: Run Separately**

Terminal 1 (Backend):
```powershell
cd siaFINALwithbackend-database
npm run server
```

Terminal 2 (Frontend):
```powershell
cd siaFINALwithbackend-database/client
npm run dev
```

### Access URLs

**Frontend (Public)**:
- http://localhost:5173 (or 5174 if 5173 busy)

**Backend API**:
- http://localhost:3000/api

**Login Credentials (After Seeding)**:
- Admin: admin@tes.com / password123
- Agent: agent@tes.com / password123

### Stopping the Server

Press `Ctrl+C` in the terminal running `npm run dev`

---

## 🧪 Testing Guide

### 1. Test Customer Flow

#### A. Create Customer Account (WITH Phone - Recommended)
1. Open http://localhost:5173
2. Click "Sign Up" or "Login" button (top right)
3. Click "Sign Up" tab
4. Fill form:
   - Name: John Doe
   - Email: john@test.com
   - Phone: 09171234567 (Recommended!)
   - Password: password123
   - Confirm Password: password123
5. Click "Create Account"
6. Account created + Auto-login ✅
7. **📱 Phone Verification Modal appears immediately**

#### B. Verify Phone Number
1. Modal shows: "We've sent a code to: +639171234567"
2. Check **backend terminal** for OTP:
   ```
   📱 SMS SERVICE - DEVELOPMENT MODE
   ==================================
   To: +639171234567
   OTP: 123456
   ==================================
   ```
3. Enter the 6-digit code in modal
4. Should show "Phone verified successfully!" with green checkmark
5. Modal auto-closes after 1.5 seconds
6. You're now in the customer portal ✅

#### C. Browse Properties
1. Should see list of properties
2. Use search bar to filter by title/location
3. Use dropdown to filter by property type
4. Click any property card
5. Should show property details modal with image gallery

#### D. Submit Inquiry (No Verification Needed - Already Verified!)
1. Click "Send Inquiry" on a property
2. Fill inquiry form:
   - Message: "I'm interested in this property"
   - Select contact preferences (Email/Phone/SMS)
3. Click "Submit"
4. **No phone verification modal** (already verified during signup)
5. Should show "Inquiry sent successfully!" with ticket number (INQ-2026-XXX)

#### E. Test Inquiry Again
1. Try submitting another inquiry on a different property
2. Should submit immediately WITHOUT phone verification
3. Phone verification only happens once per account ✅

#### F. Create Account WITHOUT Phone (Alternative Flow)
1. Logout (click profile dropdown → Logout)
2. Click "Sign Up"
3. Fill form WITHOUT phone number:
   - Name: Jane Smith
   - Email: jane@test.com
   - Password: password123
4. Click "Create Account"
5. Account created + Auto-login ✅
6. **No phone verification modal** (no phone provided)
7. You're in the portal, can browse properties

#### G. Test Inquiry Without Verified Phone
1. Try to submit an inquiry
2. Should get error: "Phone number required. Please update your profile first."
3. User must add phone number and verify before submitting inquiries

### 2. Test Agent Flow

#### A. Login as Agent
1. Go to http://localhost:5173/login
2. Enter:
   - Email: agent@tes.com
   - Password: password123
3. Should redirect to agent dashboard

#### B. View Inquiries
1. Click "Inquiries" in sidebar
2. Should see list of customer inquiries
3. View inquiry details

#### C. Claim Inquiry
1. Find unclaimed inquiry (status: "new")
2. Click "Claim" button
3. Should change status to "claimed"
4. Inquiry now appears in "My Inquiries"

#### D. Schedule Viewing
1. Go to "Calendar" in sidebar
2. Click "Schedule Viewing" or "New Event"
3. Fill form:
   - Title: Property Viewing
   - Type: Viewing
   - Date & Time
   - Select customer and property
4. Click "Create"
5. Event should appear in calendar

#### E. Update Inquiry Status
1. Go to inquiry details
2. Change status (e.g., "in-progress" → "viewing-scheduled")
3. Should update successfully

### 3. Test Admin Flow

#### A. Login as Admin
1. Go to http://localhost:5173/login
2. Enter:
   - Email: admin@tes.com
   - Password: password123
3. Should redirect to admin dashboard

#### B. Create Property
1. Click "Properties" in sidebar
2. Click "Add Property" button
3. Fill form:
   - Title: Test Property
   - Description: Modern house
   - Type: House
   - Price: 5500000
   - Location: Quezon City
   - Bedrooms: 3
   - Bathrooms: 2
   - Size: 120 sqm
4. Upload images (optional)
5. Click "Create Property"
6. Should appear in property list

#### C. Assign Inquiry to Agent
1. Go to "Inquiries"
2. Find unassigned inquiry
3. Click "Assign" button
4. Select agent from dropdown
5. Click "Assign"
6. Should update inquiry with assigned agent

#### D. Create Agent Account
1. Go to "Agents" or "Users"
2. Click "Add Agent"
3. Fill form:
   - Name: New Agent
   - Email: testagent@tes.com
   - Password: password123
4. Click "Create"
5. New agent should appear in list

#### E. View Reports
1. Go to "Reports" or "Activity Log"
2. Should see system activities
3. Filter by date, user, action

### 4. Test Phone Verification Edge Cases

#### A. Test OTP Expiry
1. Request OTP
2. Wait 6 minutes (OTP expires after 5 min)
3. Try to verify with old OTP
4. Should show "Verification code expired"
5. Click "Resend Code"
6. Enter new OTP
7. Should verify successfully

#### B. Test Rate Limiting
1. Request OTP
2. Request OTP again immediately
3. Request OTP again immediately
4. 4th request within 5 minutes should be blocked
5. Should show "Too many attempts" error with countdown

#### C. Test Invalid OTP
1. Request OTP
2. Enter wrong code (e.g., 999999)
3. Should show "Invalid verification code"
4. Try again with correct code
5. Should verify successfully

#### D. Test Resend Cooldown
1. Request OTP
2. Try to click "Resend Code" immediately
3. Should be disabled with countdown timer
4. Wait for timer to reach ~2 minutes remaining
5. "Resend Code" should become enabled
6. Click "Resend Code"
7. New OTP should be sent

### 5. Test Database Portal (Super Admin)

1. Login as admin
2. Navigate to `/database` or click "Database" in menu
3. Should see list of all tables
4. Click a table name
5. Should show table records
6. Test export:
   - Click "Export CSV"
   - Should download CSV file
   - Click "Export JSON"
   - Should download JSON file

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 3000 is in use`

**Solution**:
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Restart server
npm run dev
```

#### 2. MySQL Connection Error

**Error**: `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solution**:
1. Check MySQL is running (XAMPP or MySQL service)
2. Verify `.env` credentials:
   ```env
   DB_USER=root
   DB_PASSWORD=root    # Your actual MySQL password
   DB_HOST=localhost
   DB_PORT=3306
   ```
3. Test MySQL connection:
   ```powershell
   mysql -u root -p
   # Enter password
   # Should connect successfully
   ```

#### 3. Database Doesn't Exist

**Error**: `ER_BAD_DB_ERROR: Unknown database 'TESdb'`

**Solution**:
```powershell
npm run db:schema
```

#### 4. Phone Verification OTP Not Appearing

**Problem**: OTP codes not showing in backend console

**Solution**:
1. Check `.env` has `NODE_ENV=development`
2. Restart backend server
3. Look for this output in backend terminal (not PowerShell):
   ```
   📱 SMS SERVICE - DEVELOPMENT MODE
   ==================================
   OTP: 123456
   ==================================
   ```
4. Make sure you're checking the correct terminal (where `npm run dev` is running)

#### 5. Frontend Not Loading

**Error**: Blank page or "Cannot connect"

**Solution**:
1. Check frontend is running on http://localhost:5173
2. Check browser console for errors (F12)
3. Verify `.env` has:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Restart frontend:
   ```powershell
   cd client
   npm run dev
   ```

#### 6. JWT Token Expired

**Error**: 401 Unauthorized errors

**Solution**:
1. Logout and login again
2. Clear browser local storage:
   - F12 → Application → Local Storage → Clear
3. Close browser and reopen

#### 7. Images Not Uploading

**Error**: File upload fails or images don't display

**Solution**:
1. Check `server/uploads/properties/` folder exists
2. Create if missing:
   ```powershell
   mkdir server\uploads\properties
   ```
3. Verify file size < 5MB
4. Only .jpg, .png, .webp allowed

#### 8. Rate Limit Errors

**Error**: "Too many requests" or "Too many attempts"

**Solution**:
1. Wait for the cooldown period
2. Or manually reset in database:
   ```sql
   -- Remove rate limit records
   DELETE FROM phone_verification_attempts WHERE customer_id = 'your_id';
   ```

#### 9. Phone Verification Tables Missing

**Error**: `Table 'phone_verification_attempts' doesn't exist`

**Solution**:
```powershell
# Run the setup script
cd C:\Users\hans\Desktop\fullstacksia
.\SETUP_PHONE_VERIFICATION.ps1

# Or manually add columns
cd siaFINALwithbackend-database
node server/scripts/add-verification-columns.js
```

#### 10. Inquiry Submission Blocked

**Error**: "Phone verification required" persists after verification

**Solution**:
1. Check database:
   ```sql
   SELECT phone_verified FROM customers WHERE email = 'your@email.com';
   ```
2. Should be `1` (true)
3. If `0`, manually update:
   ```sql
   UPDATE customers SET phone_verified = 1 WHERE email = 'your@email.com';
   ```
4. Logout and login again

---

## 📚 Additional Resources

### File Structure
```
siaFINALwithbackend-database/
├── server/
│   ├── index.js                 # Express app entry point
│   ├── db.js                    # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── logger.js            # Activity logging
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── sanitize.js          # Input sanitization
│   │   ├── upload.js            # File upload (Multer)
│   │   └── validators.js        # Input validation
│   ├── routes/
│   │   ├── auth.js              # Admin/Agent login
│   │   ├── customers.js         # Customer auth & phone verification
│   │   ├── properties.js        # Property CRUD
│   │   ├── inquiries.js         # Inquiry management
│   │   ├── users.js             # User management
│   │   ├── calendar.js          # Calendar events
│   │   ├── database.js          # Database portal
│   │   └── activity-log.js      # Activity logging
│   ├── services/
│   │   └── smsService.js        # Vonage SMS integration
│   ├── sql/
│   │   └── add_phone_verification.sql  # Phone verification schema
│   ├── scripts/
│   │   ├── createSchema.js      # Create database
│   │   ├── seedDatabase.js      # Seed demo data
│   │   ├── add-verification-columns.js  # Add phone columns
│   │   ├── check-schema.js      # Verify schema
│   │   └── check-tables.js      # Verify tables
│   └── uploads/
│       └── properties/          # Property images
├── client/
│   ├── src/
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Main app component
│   │   ├── components/
│   │   │   ├── customer/
│   │   │   │   ├── CustomerPortal.tsx
│   │   │   │   ├── PropertyList.tsx
│   │   │   │   ├── InquiryModal.tsx
│   │   │   │   ├── PhoneVerificationModal.tsx  # OTP modal
│   │   │   │   └── ...
│   │   │   ├── agent/
│   │   │   │   ├── AgentDashboard.tsx
│   │   │   │   ├── AgentInquiries.tsx
│   │   │   │   ├── AgentCalendar.tsx
│   │   │   │   └── ...
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminProperties.tsx
│   │   │   │   ├── AdminInquiries.tsx
│   │   │   │   └── ...
│   │   │   └── shared/
│   │   │       ├── CountdownTimer.tsx  # OTP timer
│   │   │       └── ...
│   │   ├── services/
│   │   │   └── api.ts           # API service (Axios)
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   └── utils/
│   │       ├── session.ts       # JWT storage
│   │       ├── validation.ts    # Form validation
│   │       └── formatters.ts    # Data formatting
│   ├── package.json
│   └── vite.config.ts
├── .env                         # Environment variables
├── package.json
└── README.md
```

### Environment Variables Reference
```env
# Server Configuration
PORT=3000                        # Backend port
CORS_ORIGIN=http://localhost:5173  # Frontend URL
NODE_ENV=development             # development | production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root                 # Your MySQL password
DB_NAME=TESdb

# JWT
JWT_SECRET=6200804093489         # Change in production
JWT_EXPIRES_IN=30d

# Frontend
VITE_API_URL=http://localhost:3000/api

# Vonage SMS (Production)
VONAGE_API_KEY=                  # From dashboard.nexmo.com
VONAGE_API_SECRET=
VONAGE_FROM_NUMBER=TESProperty

# OTP Configuration
PHONE_OTP_EXPIRY=300000          # 5 minutes in ms
RESEND_OTP_COOLDOWN=300000       # 5 minutes in ms
```

### Scripts Reference

**Backend (Root package.json)**:
```json
{
  "dev": "Start both backend + frontend",
  "server": "Start backend only",
  "server:dev": "Start backend with nodemon",
  "client": "Start frontend only",
  "start": "Production server start",
  "install:all": "Install all dependencies",
  "db:schema": "Create database schema",
  "db:seed": "Seed demo data"
}
```

**Frontend (client/package.json)**:
```json
{
  "dev": "Start Vite dev server",
  "build": "Build for production",
  "preview": "Preview production build"
}
```

### Demo Accounts (After db:seed)

**Admin**:
- Email: admin@tes.com
- Password: password123
- Role: admin

**Agent**:
- Email: agent@tes.com
- Password: password123
- Role: agent

---

## 🎉 Summary

**TES Property Management System** is now:
- ✅ Fully installed
- ✅ Database configured (10 tables)
- ✅ Phone verification enabled
- ✅ All dependencies installed
- ✅ Ready for development & testing

**Quick Start**:
```powershell
cd siaFINALwithbackend-database
npm run dev
```

**Access**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api

**Test Phone Verification**:
1. Create customer account with phone
2. Try to submit inquiry
3. Phone verification modal appears
4. Check backend console for OTP code
5. Enter code, verify, inquiry submits

**For Production**: Add Vonage API credentials to `.env` for real SMS.

---

**Documentation Last Updated**: March 12, 2026  
**Version**: 1.0.0  
**Status**: Production Ready 🚀
