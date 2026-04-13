const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedRegex = /^http:\/\/localhost:517\d$/;
    const explicitAllowed = [CORS_ORIGIN].filter(Boolean);
    if (!origin || allowedRegex.test(origin) || explicitAllowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded property images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// General rate limiting for all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/login', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/activity-log', require('./routes/activity-log'));
app.use('/api/database', require('./routes/database'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api', require('./routes/documents'));
app.use('/api', require('./routes/customer-moderation'));

// Root welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TES Property System API</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 900px;
          width: 90%;
          padding: 40px;
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        h1 {
          color: #667eea;
          text-align: center;
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          font-size: 1.1em;
        }
        .status {
          background: #d4edda;
          border: 2px solid #28a745;
          border-radius: 10px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .status-icon {
          font-size: 2em;
          color: #28a745;
          margin-bottom: 10px;
        }
        .endpoints {
          margin: 30px 0;
        }
        .endpoints h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.5em;
        }
        .endpoint {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          transition: transform 0.2s;
        }
        .endpoint:hover {
          transform: translateX(5px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .method {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.85em;
          margin-right: 10px;
        }
        .get { background: #007bff; color: white; }
        .post { background: #28a745; color: white; }
        .put { background: #ffc107; color: #333; }
        .delete { background: #dc3545; color: white; }
        .path { font-family: 'Courier New', monospace; color: #333; }
        .description { color: #666; font-size: 0.9em; margin-top: 5px; }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          color: #666;
        }
        .links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.3s;
          font-weight: 600;
        }
        .btn:hover {
          background: #764ba2;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏢 TES Property System</h1>
        <p class="subtitle">MySQL Backend API Server</p>
        
        <div class="status">
          <div class="status-icon">✅</div>
          <strong>Server is running successfully!</strong>
          <div style="margin-top: 10px;">Port: ${PORT} | CORS: ${CORS_ORIGIN}</div>
        </div>

        <div class="endpoints">
          <h2>📡 Available API Endpoints</h2>
          
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/health</span>
            <div class="description">Health check endpoint</div>
          </div>

          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/api/login</span>
            <div class="description">User authentication</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/properties</span>
            <div class="description">Get all properties (public, paginated)</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/properties/:id</span>
            <div class="description">Get specific property details</div>
          </div>

          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/api/inquiries</span>
            <div class="description">Submit property inquiry</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/users</span>
            <div class="description">Get users (protected)</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/calendar</span>
            <div class="description">Get calendar events (protected)</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/database</span>
            <div class="description">Database management (protected)</div>
          </div>

          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/activity-log</span>
            <div class="description">Activity logs (protected)</div>
          </div>
        </div>

        <div class="links">
          <a href="/api/health" class="btn">🔍 Test Health Check</a>
          <a href="/api/properties" class="btn">🏠 View Properties</a>
        </div>

        <div class="footer">
          <p><strong>TES Property Management System</strong></p>
          <p>Built with Express.js, MySQL & React</p>
          <p style="margin-top: 10px; font-size: 0.9em;">
            Frontend: <a href="${CORS_ORIGIN}" target="_blank" style="color: #667eea;">${CORS_ORIGIN}</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TES Property API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds 5MB limit' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   TES Property System - MySQL Backend     ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
});