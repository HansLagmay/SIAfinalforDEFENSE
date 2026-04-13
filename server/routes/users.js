const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const {
  agentSchema,
  paginationSchema,
  uuidParamSchema,
  validate,
  validateQuery,
  validateParams
} = require('../middleware/validators');
const logActivity = require('../middleware/logger');
const { ensureFeedbackTable } = require('../utils/feedback');

const SALT_ROUNDS = 10;

const paginate = (total, data, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});

// GET all users (admin only, paginated)
router.get('/', authenticateToken, requireRole(['admin']), validateQuery(paginationSchema), async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM users WHERE archived_at IS NULL');
    const [rows] = await pool.query(
      'SELECT id, email, name, role, phone, created_at AS createdAt FROM users WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET agents only (admin only, paginated)
router.get('/agents', authenticateToken, requireRole(['admin']), validateQuery(paginationSchema), async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'agent' AND archived_at IS NULL"
    );
    const [rows] = await pool.query(
      "SELECT id, email, name, role, phone, specialization, license_number, license_status, license_expiry_date, created_at AS createdAt FROM users WHERE role = 'agent' AND archived_at IS NULL ORDER BY name ASC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET agent performance (admin: all agents, agent: self)
router.get('/agents/performance', authenticateToken, async (req, res) => {
  try {
    await ensureFeedbackTable(pool);

    const params = [];
    let whereClause = "WHERE u.role = 'agent'";

    if (req.user.role === 'agent') {
      whereClause += ' AND u.id = ?';
      params.push(req.user.id);
    }

    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [agents] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.specialization
       FROM users u
       ${whereClause}
       ORDER BY u.name ASC`,
      params
    );

    const performance = await Promise.all(agents.map(async (agent) => {
      const [[ratingRow]] = await pool.execute(
        `SELECT
           ROUND(AVG(rating), 2) AS averageRating,
           COUNT(*) AS feedbackCount
         FROM appointment_feedback
         WHERE agent_id = ?`,
        [agent.id]
      );

      const [[inquiryRow]] = await pool.execute(
        `SELECT
           COUNT(*) AS totalInquiries,
           SUM(CASE WHEN status IN ('deal-successful', 'deal-cancelled', 'no-response') THEN 1 ELSE 0 END) AS closedInquiries,
           SUM(CASE WHEN status = 'deal-successful' THEN 1 ELSE 0 END) AS successfulInquiries
         FROM inquiries
         WHERE assigned_to = ? OR claimed_by = ?`,
        [agent.id, agent.id]
      );

      const [soldProperties] = await pool.execute(
        `SELECT id, title, location, sale_price, sold_at
         FROM properties
         WHERE sold_by_agent_id = ?
         ORDER BY sold_at DESC`,
        [agent.id]
      );

      const [recentFeedback] = await pool.execute(
        `SELECT
           f.appointment_id,
           f.rating,
           f.comment,
           f.created_at,
           c.name AS customer_name,
           i.property_title
         FROM appointment_feedback f
         LEFT JOIN customers c ON c.id = f.customer_id
         LEFT JOIN inquiries i ON i.id = f.inquiry_id
         WHERE f.agent_id = ?
         ORDER BY f.created_at DESC
         LIMIT 5`,
        [agent.id]
      );

      const closedInquiries = Number(inquiryRow.closedInquiries || 0);
      const successfulInquiries = Number(inquiryRow.successfulInquiries || 0);
      const conversionRate = closedInquiries > 0
        ? Number(((successfulInquiries / closedInquiries) * 100).toFixed(2))
        : 0;

      return {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        averageRating: Number(ratingRow.averageRating || 0),
        feedbackCount: Number(ratingRow.feedbackCount || 0),
        totalInquiries: Number(inquiryRow.totalInquiries || 0),
        closedInquiries,
        successfulInquiries,
        conversionRate,
        soldProperties,
        recentFeedback
      };
    }));

    return res.json({ data: performance });
  } catch (error) {
    console.error('Failed to fetch agent performance:', error);
    return res.status(500).json({ error: 'Failed to fetch agent performance' });
  }
});

// POST create agent (admin only)
router.post('/', authenticateToken, requireRole(['admin']), sanitizeBody, validate(agentSchema), async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [req.body.email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    const id = uuidv4();

    const licenseStatus = req.body.licenseVerified ? 'active' : 'pending';
    const specialization = String(req.body.specialization || '').trim() || 'General';

    await pool.execute(
      `INSERT INTO users
        (id, email, password, name, role, phone, specialization, license_number, license_type, license_issued_date, license_expiry_date, license_verified, broker_id, license_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        req.body.email,
        hashedPassword,
        req.body.name || '',
        'agent',
        req.body.phone || '',
        specialization,
        req.body.licenseNumber || null,
        req.body.licenseType || null,
        req.body.licenseIssuedDate || null,
        req.body.licenseExpiryDate || null,
        req.body.licenseVerified ? 1 : 0,
        req.body.brokerId || null,
        licenseStatus
      ]
    );

    if (req.body.licenseNumber) {
      await pool.execute(
        `INSERT INTO agent_licenses_history
          (id, agent_id, license_number, license_type, issued_date, expiry_date, status, verified_by, verified_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          uuidv4(),
          id,
          req.body.licenseNumber,
          req.body.licenseType || null,
          req.body.licenseIssuedDate || null,
          req.body.licenseExpiryDate || null,
          licenseStatus,
          req.body.licenseVerified ? req.user.id : null,
          req.body.licenseVerified ? new Date() : null,
          'Initial license record'
        ]
      );
    }

    await logActivity('CREATE_AGENT', `Created new agent: ${req.body.name}`, req.user.name);

    const [rows] = await pool.execute(
      'SELECT id, email, name, role, phone, specialization, license_number, license_type, license_issued_date, license_expiry_date, license_verified, broker_id, license_status, created_at AS createdAt FROM users WHERE id = ? AND archived_at IS NULL',
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Failed to create agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// DELETE user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot archive your own account' });
    }

    const [rows] = await pool.execute('SELECT id, name, role FROM users WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const target = rows[0];
    if (target.role === 'admin') {
      const [[{ totalAdmins }]] = await pool.execute(
        "SELECT COUNT(*) AS totalAdmins FROM users WHERE role = 'admin' AND archived_at IS NULL"
      );
      if (Number(totalAdmins || 0) <= 1) {
        return res.status(400).json({ error: 'Cannot archive the last active admin account' });
      }
    }

    await pool.execute(
      'UPDATE users SET archived_at = NOW(), archived_by = ?, archive_reason = ? WHERE id = ?',
      [req.user.id, 'Archived by admin', req.params.id]
    );
    await logActivity('ARCHIVE_USER', `Archived user: ${rows[0].name}`, req.user.name);

    res.json({ message: 'User archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive user' });
  }
});

// POST restore user (admin only)
router.post('/:id/restore', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT name FROM users WHERE id = ? AND archived_at IS NOT NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Archived user not found' });
    }

    await pool.execute(
      'UPDATE users SET archived_at = NULL, archived_by = NULL, archive_reason = NULL WHERE id = ?',
      [req.params.id]
    );
    await logActivity('RESTORE_USER', `Restored user: ${rows[0].name}`, req.user.name);

    return res.json({ message: 'User restored successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to restore user' });
  }
});

// PUT update agent profile (admin)
router.put('/agents/:id/profile', authenticateToken, requireRole(['admin']), sanitizeBody, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    const [rows] = await pool.execute(
      "SELECT id, email FROM users WHERE id = ? AND role = 'agent' AND archived_at IS NULL LIMIT 1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await pool.execute(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone || null, req.params.id]
    );

    await logActivity('UPDATE_AGENT_PROFILE', `Updated agent profile: ${rows[0].email}`, req.user.name);
    return res.json({ message: 'Agent profile updated successfully' });
  } catch (error) {
    console.error('Failed to update agent profile:', error);
    return res.status(500).json({ error: 'Failed to update agent profile' });
  }
});

// GET agent license details (admin or self agent)
router.get('/agents/:id/license', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'agent' && req.user.id === req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, license_number, license_type, license_issued_date, license_expiry_date, license_verified, broker_id, license_status, license_file_path
       FROM users
      WHERE id = ? AND role = 'agent' AND archived_at IS NULL
       LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch agent license:', error);
    return res.status(500).json({ error: 'Failed to fetch agent license' });
  }
});

// PUT update agent license (admin)
router.put('/agents/:id/license', authenticateToken, requireRole(['admin']), sanitizeBody, async (req, res) => {
  try {
    const {
      licenseNumber,
      licenseType,
      licenseIssuedDate,
      licenseExpiryDate,
      brokerId,
      notes
    } = req.body;

    const [agents] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'agent' AND archived_at IS NULL LIMIT 1",
      [req.params.id]
    );

    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await pool.execute(
      `UPDATE users
       SET license_number = ?,
           license_type = ?,
           license_issued_date = ?,
           license_expiry_date = ?,
           broker_id = ?,
           license_status = CASE WHEN license_verified = 1 THEN 'active' ELSE 'pending' END
       WHERE id = ?`,
      [licenseNumber || null, licenseType || null, licenseIssuedDate || null, licenseExpiryDate || null, brokerId || null, req.params.id]
    );

    if (licenseNumber) {
      await pool.execute(
        `INSERT INTO agent_licenses_history
          (id, agent_id, license_number, license_type, issued_date, expiry_date, status, verified_by, verified_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          uuidv4(),
          req.params.id,
          licenseNumber,
          licenseType || null,
          licenseIssuedDate || null,
          licenseExpiryDate || null,
          'pending',
          null,
          null,
          notes || 'License details updated'
        ]
      );
    }

    return res.json({ message: 'License details updated' });
  } catch (error) {
    console.error('Failed to update agent license:', error);
    return res.status(500).json({ error: 'Failed to update agent license' });
  }
});

// POST verify agent license (admin)
router.post('/agents/:id/license/verify', authenticateToken, requireRole(['admin']), sanitizeBody, async (req, res) => {
  try {
    const status = req.body.status === 'expired' ? 'expired' : 'active';
    const verified = status === 'active' ? 1 : 0;

    const [agents] = await pool.execute(
      `SELECT id, license_number, license_type, license_issued_date, license_expiry_date
       FROM users
      WHERE id = ? AND role = 'agent' AND archived_at IS NULL
       LIMIT 1`,
      [req.params.id]
    );

    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agents[0];

    await pool.execute(
      'UPDATE users SET license_verified = ?, license_status = ? WHERE id = ?',
      [verified, status, req.params.id]
    );

    if (agent.license_number) {
      await pool.execute(
        `INSERT INTO agent_licenses_history
          (id, agent_id, license_number, license_type, issued_date, expiry_date, status, verified_by, verified_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
        [
          uuidv4(),
          req.params.id,
          agent.license_number,
          agent.license_type || null,
          agent.license_issued_date || null,
          agent.license_expiry_date || null,
          status,
          req.user.id,
          req.body.notes || `License marked as ${status}`
        ]
      );
    }

    return res.json({ message: `License marked as ${status}` });
  } catch (error) {
    console.error('Failed to verify agent license:', error);
    return res.status(500).json({ error: 'Failed to verify agent license' });
  }
});

// GET license compliance report (admin)
router.get('/reports/licenses', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        id,
        name,
        email,
        license_number,
        license_type,
        license_expiry_date,
        license_verified,
        license_status,
        DATEDIFF(license_expiry_date, CURDATE()) AS days_to_expiry
       FROM users
      WHERE role = 'agent' AND archived_at IS NULL
       ORDER BY
         CASE
           WHEN license_expiry_date IS NULL THEN 3
           WHEN license_expiry_date < CURDATE() THEN 0
           WHEN DATEDIFF(license_expiry_date, CURDATE()) <= 30 THEN 1
           ELSE 2
         END,
         license_expiry_date ASC`
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Failed to fetch license report:', error);
    return res.status(500).json({ error: 'Failed to fetch license report' });
  }
});

// GET download agent license file (admin or self agent)
router.get('/agents/:id/license/download', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'agent' && req.user.id === req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.execute(
      "SELECT license_file_path, name FROM users WHERE id = ? AND role = 'agent' AND archived_at IS NULL LIMIT 1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const filePath = rows[0].license_file_path;
    if (!filePath) {
      return res.status(404).json({ error: 'License file not found' });
    }

    const absPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'License file missing on server' });
    }

    return res.download(absPath, `${rows[0].name || 'agent'}-license.pdf`);
  } catch (error) {
    console.error('Failed to download license file:', error);
    return res.status(500).json({ error: 'Failed to download license file' });
  }
});

// PUT /api/users/change-password - Change own password (admin/agent)
router.put('/change-password', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (!['admin', 'agent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, name, password FROM users WHERE id = ? AND archived_at IS NULL LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);

    await logActivity('USER_PASSWORD_CHANGE', `User changed password: ${user.name}`, user.name);

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Failed to change user password:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
