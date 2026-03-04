# 🎯 TES Property - Priority Fixes Quick Reference

**Last Updated:** March 4, 2026

This document contains the **most critical, actionable fixes** from the comprehensive analysis.

---

## 🔴 CRITICAL (Fix Immediately)

### None Found ✅
Your application has no critical security vulnerabilities or breaking issues.

---

## 🟠 HIGH PRIORITY (Fix This Week)

### 1. Add Database Indexes
**Impact:** Performance will degrade as data grows  
**Time Estimate:** 15 minutes  
**File:** Create `server/sql/add_indexes.sql`

```sql
-- Add these indexes to improve query performance
USE TESdb;

-- Properties indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_location ON properties(location);

-- Inquiries indexes
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to);
CREATE INDEX idx_inquiries_email ON inquiries(email);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);

-- Calendar indexes
CREATE INDEX idx_calendar_agent_id ON calendar_events(agent_id);
CREATE INDEX idx_calendar_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_end_time ON calendar_events(end_time);

-- Activity log index
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp);
CREATE INDEX idx_activity_log_action ON activity_log(action);

-- Users index
CREATE INDEX idx_users_role ON users(role);
```

**Run:** `mysql -u root -p TESdb < server/sql/add_indexes.sql`

---

### 2. Document Environment Variables
**Impact:** Deployment issues, security risks  
**Time Estimate:** 30 minutes  
**Action:** Create comprehensive `.env.production.example`

```bash
# Create file: .env.production.example
PORT=3000
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production

# MySQL - REQUIRED
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DB_NAME=TESdb

# JWT - REQUIRED
JWT_SECRET=CHANGE_THIS_TO_STRONG_RANDOM_STRING_MIN_32_CHARS
JWT_EXPIRES_IN=30d

# Frontend (if separate deployment)
VITE_API_URL=https://api.yourdomain.com/api
```

**Create deployment checklist:**

- [ ] Copy `.env.production.example` to `.env`
- [ ] Fill in all REQUIRED fields
- [ ] Generate strong JWT_SECRET (use openssl: `openssl rand -base64 32`)
- [ ] Set NODE_ENV=production
- [ ] Verify database connection
- [ ] Test API health check

---

### 3. Set Up Basic Testing
**Impact:** No safety net for code changes  
**Time Estimate:** 4 hours  
**Priority:** Start this week, complete over 2 weeks

#### Step 1: Install Dependencies (10 minutes)

```bash
# Backend testing
npm install --save-dev jest supertest

# Frontend testing  
cd client
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

#### Step 2: Create Test Config (20 minutes)

**Root `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"]
  }
}
```

**`client/vite.config.ts`:** (add test config)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  }
})
```

#### Step 3: Write First Tests (3 hours)

**Create: `server/routes/__tests__/auth.test.js`**
```javascript
const request = require('supertest');
const express = require('express');
const authRouter = require('../auth');

const app = express();
app.use(express.json());
app.use('/api/login', authRouter);

describe('POST /api/login', () => {
  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'test123' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });

  // Add more tests...
});
```

**Goal:** 40% code coverage by end of month

---

## 🟡 MEDIUM PRIORITY (Fix This Month)

### 4. Remove Console Statements
**Impact:** Performance, security (data leakage)  
**Time Estimate:** 2 hours  
**Locations:** 40+ files across frontend and backend

#### Quick Fix: Create Logger Utility

**Create: `server/utils/logger.js`**
```javascript
const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  info: (...args) => isDev && console.log('[INFO]', ...args),
  warn: (...args) => isDev && console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => isDev && console.log('[DEBUG]', ...args)
};

module.exports = logger;
```

**Replace in all files:**
```javascript
// OLD
console.log('User logged in:', user.name);

// NEW
const logger = require('../utils/logger');
logger.info('User logged in:', user.name);
```

**Files to update (backend - 20 locations):**
- `server/routes/users.js`
- `server/routes/properties.js`
- `server/routes/inquiries.js`
- `server/routes/auth.js`
- `server/routes/calendar.js`
- `server/routes/database.js`
- `server/middleware/*.js`

**Frontend:** Remove all `console.log` and most `console.error` (keep critical ones)

---

### 5. Improve Form Validation
**Impact:** Better UX, data quality  
**Time Estimate:** 3 hours

#### Add Backend Validation Library

```bash
npm install joi
```

**Create: `server/middleware/validators.js`**
```javascript
const Joi = require('joi');

const propertySchema = Joi.object({
  title: Joi.string().min(10).max(255).required(),
  type: Joi.string().valid('House', 'Condo', 'Lot', 'Commercial').required(),
  price: Joi.number().min(100000).max(1000000000).required(),
  location: Joi.string().min(5).max(255).required(),
  bedrooms: Joi.number().integer().min(0).max(10).required(),
  bathrooms: Joi.number().integer().min(1).max(10).required(),
  area: Joi.number().min(10).max(10000).required(),
  description: Joi.string().max(5000),
  status: Joi.string().valid('available', 'sold', 'reserved'),
  imageUrl: Joi.string().uri().allow(''),
  features: Joi.array().items(Joi.string())
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  next();
};

module.exports = { propertySchema, validate };
```

**Use in routes:**
```javascript
const { propertySchema, validate } = require('../middleware/validators');

router.post('/', 
  authenticateToken, 
  requireRole(['admin']), 
  validate(propertySchema),  // Add this
  sanitizeBody, 
  async (req, res) => {
    // ... route logic
  }
);
```

---

### 6. Add Accessibility Features
**Impact:** Legal compliance, better UX  
**Time Estimate:** 4 hours

#### Quick Wins:

**Add to all images:**
```tsx
// Bad
<img src={url} alt="" />

// Good
<img 
  src={url} 
  alt={`${property.title} - ${property.type} in ${property.location}`} 
/>
```

**Add to icon buttons:**
```tsx
// Bad
<button onClick={handleClose}>
  <XIcon />
</button>

// Good
<button 
  onClick={handleClose}
  aria-label="Close dialog"
>
  <XIcon className="sr-only" />
</button>
```

**Add keyboard support:**
```tsx
// Add to modals
<div
  onKeyDown={(e) => {
    if (e.key === 'Escape') handleClose();
  }}
  role="dialog"
  aria-modal="true"
>
```

**Files to update:**
- `client/src/components/customer/PropertyList.tsx`
- `client/src/components/customer/PropertyDetailModal.tsx`
- `client/src/components/admin/AdminProperties.tsx`
- `client/src/components/shared/ConfirmDialog.tsx`
- All other modal components

---

## 🟢 LOW PRIORITY (Technical Debt)

### 7. Add API Versioning
**Time:** 1 hour

```javascript
// server/index.js
app.use('/api/v1/login', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
// ... etc
```

### 8. Refactor Large Components
**Time:** 2-3 hours per component

- `AdminProperties.tsx` (720 lines) → Split into smaller components
- Extract form logic to custom hooks
- Create separate components for modals

### 9. Add Password Requirements
**Time:** 1 hour

```javascript
// server/middleware/validators.js
const passwordSchema = Joi.string()
  .min(8)
  .regex(/[a-z]/, 'lowercase')
  .regex(/[A-Z]/, 'uppercase')  
  .regex(/[0-9]/, 'digit')
  .regex(/[!@#$%^&*]/, 'special character')
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.name': 'Password must contain at least one {#name}'
  });
```

---

## 📋 QUICK CHECKLIST

### This Week
- [ ] Add database indexes (15 min)
- [ ] Document environment variables (30 min)
- [ ] Set up test infrastructure (30 min)
- [ ] Write 3 basic tests (2 hours)

### This Month  
- [ ] Create logger utility (1 hour)
- [ ] Remove console statements (2 hours)
- [ ] Add backend validation (3 hours)
- [ ] Improve accessibility (4 hours)
- [ ] Write 20+ tests (8 hours)
- [ ] Goal: 40% test coverage

### This Quarter
- [ ] Achieve 80% test coverage
- [ ] Add API versioning
- [ ] Refactor large components
- [ ] Set up CI/CD
- [ ] Production deployment

---

## 🚀 DEPLOYMENT CHECKLIST

Before going to production:

### Security
- [ ] Set strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS
- [ ] Configure production CORS
- [ ] Remove dev fallback secrets
- [ ] Set NODE_ENV=production

### Database
- [ ] Run index migration
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Enable slow query log

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Add APM tool
- [ ] Configure logging
- [ ] Set up alerts

### Code Quality
- [ ] Remove all console.log
- [ ] Run test suite (passing)
- [ ] Check for hardcoded credentials
- [ ] Update dependencies

### Documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] Run book for operations
- [ ] Backup/restore procedures

---

## 📞 NEED HELP?

**Common Issues:**

1. **Tests won't run**
   - Check Node version (16+ required)
   - Delete `node_modules`, run `npm install`
   - Check jest/vitest config

2. **Database indexes fail**
   - Check if indexes already exist
   - Ensure sufficient disk space
   - Verify MySQL permissions

3. **JWT errors in production**
   - Verify JWT_SECRET is set
   - Check secret length (32+ chars)
   - Verify environment variables loaded

**Resources:**
- Jest docs: https://jestjs.io/
- Express best practices: https://expressjs.com/en/advanced/best-practice-security.html
- OWASP Top 10: https://owasp.org/www-project-top-ten/

---

**Last Updated:** March 4, 2026  
**Next Review:** After implementing week 1 tasks
