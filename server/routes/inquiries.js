const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken, authenticateTokenOptional, requireRole } = require('../middleware/auth');
const { sanitizeBody, containsMaliciousContent } = require('../middleware/sanitize');
const { inquiryLimiter } = require('../middleware/rateLimiter');
const {
  inquirySchema,
  inquiryUpdateSchema,
  inquiryAssignmentSchema,
  paginationSchema,
  uuidParamSchema,
  validate,
  validateQuery,
  validateParams
} = require('../middleware/validators');
const logActivity = require('../middleware/logger');
const { createNotification } = require('../services/notificationService');
const { canAccessInquiryAsAgent } = require('../utils/accessControl');

const allowSharedVerificationPhone = String(process.env.ALLOW_SHARED_VERIFICATION_PHONE || '').toLowerCase() === 'true';

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// Transform snake_case DB fields to camelCase for frontend
const transformInquiry = (inquiry) => {
  if (!inquiry) return null;
  return {
    id: inquiry.id,
    ticketNumber: inquiry.ticket_number,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    message: inquiry.message,
    propertyId: inquiry.property_id,
    propertyTitle: inquiry.property_title,
    propertyPrice: inquiry.property_price,
    propertyLocation: inquiry.property_location,
    status: inquiry.status,
    assignedTo: inquiry.assigned_to,
    claimedBy: inquiry.claimed_by,
    assignedBy: inquiry.assigned_by,
    claimedAt: inquiry.claimed_at,
    assignedAt: inquiry.assigned_at,
    createdAt: inquiry.created_at,
    updatedAt: inquiry.updated_at
  };
};

// GET agents/workload — must be before /:id
router.get('/agents/workload', authenticateToken, async (req, res) => {
  try {
    const [agents] = await pool.execute("SELECT id, name FROM users WHERE role = 'agent'");

    const workload = await Promise.all(
      agents.map(async (agent) => {
        const terminalStatuses = ['deal-successful', 'deal-cancelled', 'no-response'];
        const [[{ active }]] = await pool.execute(
          `SELECT COUNT(*) AS active FROM inquiries WHERE assigned_to = ? AND status NOT IN (${terminalStatuses.map(() => '?').join(',')})`,
          [agent.id, ...terminalStatuses]
        );
        const [[{ total }]] = await pool.execute(
          'SELECT COUNT(*) AS total FROM inquiries WHERE assigned_to = ?',
          [agent.id]
        );
        const [[{ successful }]] = await pool.execute(
          "SELECT COUNT(*) AS successful FROM inquiries WHERE assigned_to = ? AND status = 'deal-successful'",
          [agent.id]
        );
        return {
          agentId: agent.id,
          agentName: agent.name,
          activeInquiries: active,
          totalInquiries: total,
          successfulInquiries: successful
        };
      })
    );

    res.json(workload);
  } catch (error) {
    console.error('Failed to get agent workload:', error);
    res.status(500).json({ error: 'Failed to get agent workload' });
  }
});

// GET all inquiries (protected, paginated)
router.get('/', authenticateToken, validateQuery(paginationSchema), async (req, res) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const offset = (page - 1) * limit;

    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let countSql = 'SELECT COUNT(*) AS total FROM inquiries WHERE archived_at IS NULL';
    let listSql = 'SELECT * FROM inquiries WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?';
    let countParams = [];
    let listParams = [limit, offset];

    if (req.user.role === 'agent') {
      countSql = 'SELECT COUNT(*) AS total FROM inquiries WHERE archived_at IS NULL AND (assigned_to = ? OR claimed_by = ?)';
      listSql = 'SELECT * FROM inquiries WHERE archived_at IS NULL AND (assigned_to = ? OR claimed_by = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?';
      countParams = [req.user.id, req.user.id];
      listParams = [req.user.id, req.user.id, limit, offset];
    }

    const [[{ total }]] = await pool.execute(countSql, countParams);
    const [rows] = await pool.query(listSql, listParams);

    const transformedRows = rows.map(transformInquiry);
    res.json(paginate(total, transformedRows, page, limit));
  } catch (error) {
    console.error('Failed to fetch inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET single inquiry (protected)
router.get('/:id', authenticateToken, validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];
    if (req.user.role === 'agent' && !canAccessInquiryAsAgent(req.user, inquiry)) {
      return res.status(403).json({ error: 'Access denied to this inquiry' });
    }

    res.json(transformInquiry(inquiry));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

// POST new inquiry (public, rate limited, sanitized)
router.post('/', authenticateTokenOptional, sanitizeBody, inquiryLimiter, validate(inquirySchema), async (req, res) => {
  try {
    const fieldsToCheck = [req.body.name, req.body.message];
    if (fieldsToCheck.some((f) => containsMaliciousContent(f))) {
      await logActivity('XSS_ATTEMPT', `XSS attempt in inquiry from ${req.body.email}`, 'System');
      return res.status(400).json({ error: 'Invalid content detected.' });
    }

    // Validate property status if propertyId provided
    if (req.body.propertyId) {
      const [properties] = await pool.execute(
        'SELECT status FROM properties WHERE id = ?',
        [req.body.propertyId]
      );
      
      if (properties.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const propertyStatus = properties[0].status;
      const acceptableStatuses = ['available', 'reserved'];
      
      if (!acceptableStatuses.includes(propertyStatus)) {
        await logActivity('INQUIRY_REJECTED', `Inquiry rejected for ${propertyStatus} property ${req.body.propertyId}`, 'System');
        return res.status(400).json({ 
          error: `This property is ${propertyStatus} and is no longer accepting inquiries.`,
          propertyStatus 
        });
      }
    }

    let customerPhone = null;

    // Check phone verification for authenticated customers
    if (req.user && req.user.role === 'customer') {
      const [customers] = await pool.execute(
        'SELECT phone_verified, phone FROM customers WHERE id = ?',
        [req.user.id]
      );

      if (customers.length > 0) {
        const customer = customers[0];
        
        if (!customer.phone) {
          return res.status(403).json({ 
            error: 'Phone number required. Please update your profile with a phone number before submitting inquiries.',
            requiresPhone: true
          });
        }

        customerPhone = customer.phone;

        if (!customer.phone_verified) {
          return res.status(403).json({ 
            error: 'Phone verification required. Please verify your phone number before submitting inquiries.',
            requiresPhoneVerification: true,
            phone: customer.phone
          });
        }
      }
    }

    const effectivePhone = (customerPhone || req.body.phone || '').trim();
    if (!effectivePhone) {
      return res.status(400).json({ error: 'Phone number is required for inquiries.' });
    }

    // If the inquiry matches an existing customer account, enforce account verification rules
    // even when request is sent without a customer token.
    if (!req.user || req.user.role !== 'customer') {
      const normalizedInquiryPhone = String(effectivePhone).replace(/[^0-9]/g, '');
      const normalizedInquiryEmail = String(req.body.email || '').trim().toLowerCase();

      let matchedCustomers = [];
      if (allowSharedVerificationPhone) {
        const [rows] = await pool.execute(
          `SELECT id, email, phone, phone_verified
           FROM customers
           WHERE archived_at IS NULL
             AND LOWER(email) = ?
           LIMIT 1`,
          [normalizedInquiryEmail]
        );
        matchedCustomers = rows;
      } else {
        const [rows] = await pool.execute(
          `SELECT id, email, phone, phone_verified
           FROM customers
           WHERE archived_at IS NULL
             AND (
               LOWER(email) = ?
               OR (phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), '(', ''), ')', '') = ?)
             )
           LIMIT 1`,
          [normalizedInquiryEmail, normalizedInquiryPhone]
        );
        matchedCustomers = rows;
      }

      if (matchedCustomers.length > 0) {
        const existingCustomer = matchedCustomers[0];

        if (!existingCustomer.phone_verified) {
          return res.status(403).json({
            error: 'Phone verification required. Please log in and verify your phone number before submitting inquiries.',
            requiresPhoneVerification: true,
            requiresLogin: true
          });
        }
      }
    }

    // Duplicate check: one active inquiry per property (resets when terminal state reached)
    // For authenticated customers, enforce strictly by customer identity + property.
    let dups = [];
    if (req.user && req.user.role === 'customer') {
      const [rows] = await pool.execute(
        `SELECT id, ticket_number AS ticketNumber, created_at AS createdAt, status
         FROM inquiries
         WHERE property_id = ?
           AND status NOT IN ('deal-successful','deal-cancelled','no-response')
           AND customer_id = ?`,
        [req.body.propertyId || null, req.user.id]
      );
      dups = rows;
    } else {
      const [rows] = await pool.execute(
        `SELECT id, ticket_number AS ticketNumber, created_at AS createdAt, status
         FROM inquiries
         WHERE email = ?
           AND property_id = ?
           AND status NOT IN ('deal-successful','deal-cancelled','no-response')`,
        [req.body.email, req.body.propertyId || null]
      );
      dups = rows;
    }

    if (dups.length > 0) {
      await logActivity('DUPLICATE_INQUIRY', `Duplicate inquiry: ${req.body.email}`, 'System');
      return res.status(409).json({
        error: 'You have already submitted an inquiry for this property.',
        existingTicket: dups[0].ticketNumber,
        submittedAt: dups[0].createdAt
      });
    }

    // Generate ticket number INQ-YYYY-NNN
    const year = new Date().getFullYear();
    const [[{ cnt }]] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM inquiries WHERE ticket_number LIKE ?",
      [`INQ-${year}-%`]
    );
    const ticketNumber = `INQ-${year}-${String(cnt + 1).padStart(3, '0')}`;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO inquiries
        (id, customer_id, ticket_number, name, email, phone, message, property_id, property_title, property_price, property_location, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW(), NOW())`,
      [
        id,
        req.user && req.user.role === 'customer' ? req.user.id : null,
        ticketNumber,
        req.body.name || '',
        req.body.email,
        effectivePhone,
        req.body.message || '',
        req.body.propertyId || null,
        req.body.propertyTitle || null,
        req.body.propertyPrice || null,
        req.body.propertyLocation || null
      ]
    );

    await logActivity('CREATE_INQUIRY', `New inquiry ${ticketNumber} from ${req.body.email}`, 'Public');

    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [id]);
    res.status(201).json(transformInquiry(rows[0]));
  } catch (error) {
    console.error('Failed to create inquiry:', error);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

// PUT update inquiry (protected)
router.put('/:id', authenticateToken, requireRole(['admin', 'agent']), validateParams(uuidParamSchema), sanitizeBody, validate(inquiryUpdateSchema), async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Status lifecycle changes are agent-driven only.
    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ error: 'Only assigned agents can update inquiry status' });
      }

      const isOwnedByAgent = existing[0].assigned_to === req.user.id || existing[0].claimed_by === req.user.id;
      if (!isOwnedByAgent) {
        return res.status(403).json({ error: 'You can only update status for tickets assigned to you' });
      }
    }

    const allowed = ['status', 'name', 'email', 'phone', 'message', 'property_id', 'property_title', 'property_price', 'property_location', 'notes', 'last_follow_up_at', 'next_follow_up_at'];
    const mapping = {
      propertyId: 'property_id',
      propertyTitle: 'property_title',
      propertyPrice: 'property_price',
      propertyLocation: 'property_location',
      lastFollowUpAt: 'last_follow_up_at',
      nextFollowUpAt: 'next_follow_up_at'
    };

    const fields = [];
    const values = [];

    Object.keys(req.body).forEach((key) => {
      const col = mapping[key] || key;
      if (allowed.includes(col)) {
        fields.push(`${col} = ?`);
        values.push(typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]);
      }
    });

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE inquiries SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const statusChanged = Object.prototype.hasOwnProperty.call(req.body, 'status') && req.body.status !== existing[0].status;

    await logActivity('UPDATE_INQUIRY', `Updated inquiry ${existing[0].ticket_number}`, req.user.name);

    if (statusChanged) {
      let targetCustomerId = existing[0].customer_id;

      if (!targetCustomerId && existing[0].email) {
        const [customerRows] = await pool.execute(
          'SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1',
          [existing[0].email]
        );
        targetCustomerId = customerRows[0]?.id || null;
      }

      if (targetCustomerId) {
        await createNotification(pool, {
          userId: targetCustomerId,
          userRole: 'customer',
          type: 'inquiry-status-updated',
          title: 'Inquiry Status Updated',
          message: `Your inquiry ${existing[0].ticket_number} is now ${req.body.status}.`,
          relatedId: existing[0].id,
          relatedType: 'inquiry'
        }).catch((err) => console.error('Notification create failed:', err.message));
      }
    }

    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    res.json(transformInquiry(rows[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// DELETE inquiry -> archive inquiry (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT ticket_number FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await pool.execute(
      'UPDATE inquiries SET archived_at = NOW(), archived_by = ?, archive_reason = ? WHERE id = ?',
      [req.user.id, 'Archived by admin', req.params.id]
    );
    await logActivity('ARCHIVE_INQUIRY', `Archived inquiry: ${rows[0].ticket_number}`, req.user.name);

    res.json({ message: 'Inquiry archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive inquiry' });
  }
});

// POST restore archived inquiry (admin only)
router.post('/:id/restore', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT ticket_number FROM inquiries WHERE id = ? AND archived_at IS NOT NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Archived inquiry not found' });
    }

    await pool.execute(
      'UPDATE inquiries SET archived_at = NULL, archived_by = NULL, archive_reason = NULL, updated_at = NOW() WHERE id = ?',
      [req.params.id]
    );

    await logActivity('RESTORE_INQUIRY', `Restored inquiry: ${rows[0].ticket_number}`, req.user.name);
    return res.json({ message: 'Inquiry restored successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to restore inquiry' });
  }
});

// POST claim inquiry (agent self-service)
router.post('/:id/claim', authenticateToken, requireRole(['agent']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [agentRows] = await pool.execute(
      `SELECT license_status, license_expiry_date
       FROM users
       WHERE id = ? AND role = 'agent'
       LIMIT 1`,
      [req.user.id]
    );

    if (agentRows.length === 0) {
      return res.status(404).json({ error: 'Agent account not found' });
    }

    const licenseStatus = String(agentRows[0].license_status || 'pending').toLowerCase();
    const expiryDate = agentRows[0].license_expiry_date ? new Date(agentRows[0].license_expiry_date) : null;
    const isExpiredByDate = expiryDate ? expiryDate < new Date() : false;

    if (licenseStatus !== 'active' || isExpiredByDate) {
      return res.status(403).json({
        error: 'Your license is not active. You cannot claim new inquiries until license compliance is updated.'
      });
    }

    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];
    if (inquiry.assigned_to) {
      return res.status(409).json({ error: 'Ticket already claimed by another agent' });
    }

    // Only fresh inquiries can be self-claimed.
    if (inquiry.status !== 'new') {
      return res.status(409).json({ error: `Only new inquiries can be claimed. Current status: ${inquiry.status}` });
    }

    // Check property ownership: agent must be the primary agent for this property
    if (inquiry.property_id) {
      const [propRows] = await pool.execute(
        'SELECT primary_agent_id, title FROM properties WHERE id = ? LIMIT 1',
        [inquiry.property_id]
      );
      if (propRows.length > 0) {
        const property = propRows[0];
        if (property.primary_agent_id && property.primary_agent_id !== req.user.id) {
          // Find the primary agent name for the error message
          const [agentRows] = await pool.execute(
            'SELECT name FROM users WHERE id = ? LIMIT 1',
            [property.primary_agent_id]
          );
          const primaryAgentName = agentRows.length > 0 ? agentRows[0].name : 'another agent';
          return res.status(403).json({
            error: `Property "${property.title}" is assigned to ${primaryAgentName}. You cannot claim inquiries for this property.`,
            blockedBy: primaryAgentName,
            propertyId: inquiry.property_id
          });
        }
      }
    }

    await pool.execute(
      "UPDATE inquiries SET assigned_to = ?, claimed_by = ?, claimed_at = NOW(), status = 'claimed', updated_at = NOW() WHERE id = ?",
      [req.user.id, req.user.id, req.params.id]
    );

    await logActivity('CLAIM_INQUIRY', `Agent ${req.user.name} claimed inquiry ${inquiry.ticket_number}`, req.user.name);

    const [updated] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    res.json(transformInquiry(updated[0]));
  } catch (error) {
    console.error('Failed to claim inquiry:', error);
    res.status(500).json({ error: 'Failed to claim inquiry' });
  }
});

// POST unclaim inquiry (agent releases ticket back to pool)
router.post('/:id/unclaim', authenticateToken, requireRole(['agent']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];

    if (inquiry.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only release inquiries assigned to you' });
    }

    const terminalStatuses = new Set(['deal-successful', 'deal-cancelled', 'no-response']);
    if (terminalStatuses.has(inquiry.status)) {
      return res.status(400).json({ error: 'Cannot release an inquiry that is already closed' });
    }

    await pool.execute(
      `UPDATE inquiries
       SET assigned_to = NULL,
           claimed_by = NULL,
           assigned_by = NULL,
           claimed_at = NULL,
           assigned_at = NULL,
           status = 'new',
           updated_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );

    await logActivity('UNCLAIM_INQUIRY', `Agent ${req.user.name} released inquiry ${inquiry.ticket_number}`, req.user.name);

    const [updated] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    res.json(transformInquiry(updated[0]));
  } catch (error) {
    console.error('Failed to unclaim inquiry:', error);
    res.status(500).json({ error: 'Failed to release inquiry' });
  }
});

// POST assign inquiry (admin)
router.post('/:id/assign', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), sanitizeBody, validate(inquiryAssignmentSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const { agentId } = req.body;

    const [agents] = await pool.execute(
      "SELECT id, name FROM users WHERE id = ? AND role = 'agent'",
      [agentId]
    );

    if (agents.length === 0) {
      return res.status(400).json({ error: 'Selected agent does not exist' });
    }

    await pool.execute(
      "UPDATE inquiries SET assigned_to = ?, assigned_by = ?, assigned_at = NOW(), status = 'assigned', updated_at = NOW() WHERE id = ?",
      [agentId, req.user.id, req.params.id]
    );

    await createNotification(pool, {
      userId: agentId,
      userRole: 'agent',
      type: 'inquiry-assigned',
      title: 'New Inquiry Assigned',
      message: `A new inquiry ${rows[0].ticket_number} was assigned to you for ${rows[0].property_title || 'a property'}.`,
      relatedId: rows[0].id,
      relatedType: 'inquiry'
    }).catch((err) => console.error('Notification create failed:', err.message));

    await logActivity('ASSIGN_INQUIRY', `Admin ${req.user.name} assigned inquiry ${rows[0].ticket_number} to ${agents[0].name}`, req.user.name);

    const [updated] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    res.json(transformInquiry(updated[0]));
  } catch (error) {
    console.error('Failed to assign inquiry:', error);
    res.status(500).json({ error: 'Failed to assign inquiry' });
  }
});

// POST report inquiry customer (agent only)
router.post('/:id/report-customer', authenticateToken, requireRole(['agent']), validateParams(uuidParamSchema), sanitizeBody, async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    const details = String(req.body.details || '').trim();

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];
    if (!canAccessInquiryAsAgent(req.user, inquiry)) {
      return res.status(403).json({ error: 'You can only report customers from your own inquiries' });
    }

    const [dupe] = await pool.execute(
      `SELECT id FROM customer_flags
       WHERE inquiry_id = ? AND reported_by_agent_id = ? AND status IN ('pending', 'reviewed', 'blocked')
       LIMIT 1`,
      [inquiry.id, req.user.id]
    );

    if (dupe.length > 0) {
      return res.status(409).json({ error: 'You already reported this customer for this inquiry' });
    }

    let customerId = inquiry.customer_id || null;
    if (!customerId && inquiry.email) {
      const [customerRows] = await pool.execute(
        'SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [inquiry.email]
      );
      customerId = customerRows[0]?.id || null;
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO customer_flags
       (id, inquiry_id, customer_id, customer_name, customer_email, customer_phone, reported_by_agent_id, reported_by_agent_name, reason, details, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        id,
        inquiry.id,
        customerId,
        inquiry.name || 'Unknown',
        inquiry.email || '',
        inquiry.phone || null,
        req.user.id,
        req.user.name,
        reason,
        details || null
      ]
    );

    await logActivity('REPORT_CUSTOMER', `Agent ${req.user.name} reported customer ${inquiry.email} (${reason})`, req.user.name);

    return res.status(201).json({
      message: 'Customer report submitted to admin for review',
      reportId: id
    });
  } catch (error) {
    console.error('Failed to report customer:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
