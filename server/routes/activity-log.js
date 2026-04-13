const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// Transform snake_case DB fields to camelCase for frontend
const transformActivityLog = (log) => {
  if (!log) return null;
  return {
    id: log.id,
    action: log.action,
    details: log.details,
    performedBy: log.performed_by,
    timestamp: log.timestamp
  };
};

// GET activity logs (protected, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM activity_log');
    const [rows] = await pool.query(
      'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const transformedRows = rows.map(transformActivityLog);
    res.json(paginate(total, transformedRows, page, limit));
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
