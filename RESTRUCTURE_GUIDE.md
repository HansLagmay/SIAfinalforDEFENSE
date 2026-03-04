# 🏗️ Project Restructuring: Separate Root Folders

## Overview

This guide shows how to restructure the current monorepo into **two separate, independent projects** - one for backend and one for frontend.

---

## 📁 Current Structure (Monorepo)

```
siaFINALwithbackend-database/
├── package.json           (Backend dependencies)
├── .env                   (Backend environment)
├── server/                (Backend code)
│   ├── index.js
│   ├── db.js
│   ├── routes/
│   └── middleware/
├── client/                (Frontend code)
│   ├── package.json       (Frontend dependencies)
│   ├── src/
│   ├── public/
│   └── vite.config.ts
└── scripts/
    └── seedDatabase.js
```

**Pros:** Easy to manage in development  
**Cons:** Complex deployment, shared dependencies, unclear boundaries

---

## 📁 New Structure (Separate Root Folders)

```
tes-property-backend/      ← Backend project
├── package.json
├── .env
├── .gitignore
├── README.md
├── server.js              (renamed from index.js)
├── db.js
├── routes/
├── middleware/
├── sql/
│   └── schema.sql
├── scripts/
│   └── seedDatabase.js
└── uploads/
    └── properties/

tes-property-frontend/     ← Frontend project
├── package.json
├── .env
├── .gitignore
├── README.md
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
└── public/
```

**Pros:** Clear separation, independent deployment, better scalability  
**Cons:** Requires two repo clones in development

---

## 🚀 Step-by-Step Restructuring

### Step 1: Create Backend Project (5 minutes)

```powershell
# Navigate to parent directory
cd C:\Users\hans\Desktop\fullstacksia

# Create new backend folder
New-Item -ItemType Directory -Path "tes-property-backend"
cd tes-property-backend

# Initialize git (optional)
git init

# Create .gitignore
@"
node_modules/
.env
uploads/
*.log
.DS_Store
"@ | Out-File -FilePath .gitignore -Encoding UTF8
```

### Step 2: Copy Backend Files

```powershell
# From tes-property-backend directory
$source = "..\siaFINALwithbackend-database"

# Copy server files
Copy-Item "$source\server\*" -Destination "." -Recurse

# Copy root backend files
Copy-Item "$source\package.json" -Destination "."
Copy-Item "$source\.env" -Destination "."

# Copy scripts
Copy-Item "$source\scripts" -Destination "." -Recurse

# Rename server/index.js to root server.js
Move-Item "index.js" -Destination "server.js"
```

### Step 3: Update Backend Package.json

**Edit:** `tes-property-backend/package.json`

```json
{
  "name": "tes-property-backend",
  "version": "1.0.0",
  "description": "TES Property Management - Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:schema": "node scripts/createSchema.js",
    "db:seed": "node scripts/seedDatabase.js"
  },
  "keywords": ["property", "real-estate", "api"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.7.0",
    "helmet": "^7.0.0",
    "multer": "^2.0.0-rc.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Step 4: Update Backend File Paths

**Edit:** `tes-property-backend/server.js`

```javascript
// Update require paths (remove 'server/' prefix)
const db = require('./db');  // was: require('../db')
const authRouter = require('./routes/auth');  // was: require('./server/routes/auth')
const usersRouter = require('./routes/users');
// ... update all other routes
```

**Edit:** `tes-property-backend/db.js`

```javascript
require('dotenv').config();  // No path needed, .env is in root now
```

**Edit:** All route files in `tes-property-backend/routes/`

```javascript
// Update middleware paths
const { authenticateToken, requireRole } = require('../middleware/auth');  // was: require('../../middleware/auth')
const db = require('../db');  // was: require('../../db')
```

### Step 5: Update Backend .env

**Edit:** `tes-property-backend/.env`

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=TESdb

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Step 6: Create Frontend Project

```powershell
# Navigate to parent directory
cd C:\Users\hans\Desktop\fullstacksia

# Create new frontend folder
New-Item -ItemType Directory -Path "tes-property-frontend"
cd tes-property-frontend

# Initialize git (optional)
git init
```

### Step 7: Copy Frontend Files

```powershell
# From tes-property-frontend directory
$source = "..\siaFINALwithbackend-database\client"

# Copy all client files
Copy-Item "$source\*" -Destination "." -Recurse

# Move files from client root to project root
Move-Item "index.html" -Destination "."
Move-Item "package.json" -Destination "."
Move-Item "vite.config.ts" -Destination "."
Move-Item "tailwind.config.js" -Destination "."
Move-Item "tsconfig.json" -Destination "."
Move-Item "tsconfig.node.json" -Destination "."
Move-Item "postcss.config.js" -Destination "."

# Create .gitignore
@"
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
"@ | Out-File -FilePath .gitignore -Encoding UTF8
```

### Step 8: Update Frontend Package.json

**Edit:** `tes-property-frontend/package.json`

```json
{
  "name": "tes-property-frontend",
  "version": "2.0.0",
  "description": "TES Property Management - Frontend Application",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.23",
    "@types/react-dom": "^18.2.8",
    "@vitejs/plugin-react": "^4.1.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.2.2",
    "vite": "^5.4.0"
  }
}
```

### Step 9: Create Frontend .env

**Create:** `tes-property-frontend/.env`

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_API_BASE_URL=http://localhost:3000

# Environment
VITE_NODE_ENV=development
```

### Step 10: Update Frontend API Configuration

**Edit:** `tes-property-frontend/src/services/api.ts`

```typescript
import axios from 'axios';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ... rest of API code
```

### Step 11: Create README files

**Backend README:** `tes-property-backend/README.md`

```markdown
# TES Property - Backend API

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Create database:
   ```bash
   npm run db:schema
   ```

4. Seed data:
   ```bash
   npm run db:seed
   ```

5. Start server:
   ```bash
   npm run dev
   ```

## API Documentation

- Base URL: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

## Endpoints

- POST /api/login - User authentication
- GET /api/properties - List properties
- POST /api/properties - Create property (admin only)
- GET /api/inquiries - List inquiries
- POST /api/inquiries - Create inquiry
```

**Frontend README:** `tes-property-frontend/README.md`

```markdown
# TES Property - Frontend Application

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Update VITE_API_URL if backend is on different host
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Access

- Development: http://localhost:5173
- Customer Portal: http://localhost:5173/
- Admin Portal: http://localhost:5173/admin
- Agent Portal: http://localhost:5173/agent

## Default Accounts

- Admin: admin@tesproperty.com / admin123
- Agent (Maria): maria@tesproperty.com / agent123
- Agent (Juan): juan@tesproperty.com / agent123
```

---

## 🧪 Testing the New Structure

### Terminal 1: Start Backend

```powershell
cd C:\Users\hans\Desktop\fullstacksia\tes-property-backend
npm install
npm run dev
```

**Expected output:**
```
Server running on port 3000
Database connected successfully
```

### Terminal 2: Start Frontend

```powershell
cd C:\Users\hans\Desktop\fullstacksia\tes-property-frontend
npm install
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Verification Checklist

- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] Can login with test accounts
- [ ] Properties display correctly
- [ ] API calls work (check Network tab)
- [ ] No CORS errors

---

## 📦 Deployment Benefits

### Backend Deployment

```bash
# Deploy to any Node.js hosting (Heroku, Railway, Render)
cd tes-property-backend
git remote add origin <backend-repo-url>
git push origin main

# Or use Docker
docker build -t tes-property-backend .
docker run -p 3000:3000 tes-property-backend
```

### Frontend Deployment

```bash
# Deploy to Vercel, Netlify, or any static host
cd tes-property-frontend
npm run build
# Upload dist/ folder

# Or use Vercel CLI
vercel --prod
```

### Environment Variables (Production)

**Backend (.env):**
```env
PORT=3000
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=strong-production-password
JWT_SECRET=your-production-secret-min-32-chars
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_NODE_ENV=production
```

---

## 🔄 Git Workflow

### Option 1: Separate Repositories (Recommended)

```bash
# Backend repo
cd tes-property-backend
git init
git add .
git commit -m "Initial backend setup"
git remote add origin https://github.com/yourname/tes-property-backend.git
git push -u origin main

# Frontend repo
cd tes-property-frontend
git init
git add .
git commit -m "Initial frontend setup"
git remote add origin https://github.com/yourname/tes-property-frontend.git
git push -u origin main
```

### Option 2: Monorepo with Workspaces

Keep both in same repo but maintain independence:

```
tes-property/
├── backend/
├── frontend/
└── package.json (workspace root)
```

---

## 🎯 Advantages of Separate Projects

### Development
- ✅ Clear boundaries between frontend/backend
- ✅ Independent dependency management
- ✅ Easier to onboard new developers
- ✅ Can use different Node versions if needed

### Deployment
- ✅ Deploy backend and frontend independently
- ✅ Scale services separately
- ✅ Different hosting providers (backend on Railway, frontend on Vercel)
- ✅ Easier CI/CD setup

### Team Management
- ✅ Separate permissions (frontend team vs backend team)
- ✅ Independent release cycles
- ✅ Cleaner git history

### Production
- ✅ Backend can serve multiple frontends (mobile app, admin panel)
- ✅ Easier to add microservices
- ✅ Better security (backend can be internal-only)

---

## 📝 Migration Checklist

- [ ] Create backend project folder
- [ ] Copy and restructure backend files
- [ ] Update backend package.json
- [ ] Fix backend import paths
- [ ] Create frontend project folder
- [ ] Copy and restructure frontend files
- [ ] Update frontend package.json
- [ ] Configure environment variables
- [ ] Update API base URL in frontend
- [ ] Test backend independently
- [ ] Test frontend independently
- [ ] Test full integration
- [ ] Update documentation
- [ ] Set up separate git repositories
- [ ] Configure CI/CD pipelines

---

## 🆘 Troubleshooting

### "Module not found" errors
- Check all require/import paths were updated
- Ensure node_modules installed in both projects
- Verify package.json has all dependencies

### CORS errors
- Check backend CORS_ORIGIN matches frontend URL
- Verify backend is running
- Check .env files loaded correctly

### Environment variables not working
- Frontend: Must prefix with `VITE_`
- Backend: Ensure .env in root of backend project
- Restart dev servers after changing .env

---

## ✅ Success Criteria

Your restructuring is complete when:

1. ✅ Backend runs independently on port 3000
2. ✅ Frontend runs independently on port 5173
3. ✅ No shared dependencies between projects
4. ✅ Each project has its own package.json
5. ✅ Each project has its own .gitignore
6. ✅ API calls work correctly between projects
7. ✅ Environment variables properly configured
8. ✅ Both projects can be deployed independently

---

**Estimated Time:** 1-2 hours  
**Difficulty:** Medium  
**Rollback:** Keep original `siaFINALwithbackend-database` folder until verified working

Good luck with the restructuring! 🚀
