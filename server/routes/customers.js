const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { sanitizeBody, validateEmail } = require('../middleware/sanitize');
const { loginLimiter } = require('../middleware/rateLimiter');
const logActivity = require('../middleware/logger');
const crypto = require('crypto');
const { sendVerificationCode } = require('../services/smsService');
const { ensureFeedbackTable } = require('../utils/feedback');

const formatDateTimeForApi = (value) => {
  if (!value) return value;

  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes('T')) {
      return trimmed.replace(/Z$/, '');
    }
    if (trimmed.includes(' ')) {
      return trimmed.replace(' ', 'T');
    }
    return trimmed;
  }

  return value;
};

const normalizePhone = (value) => {
  if (!value) return '';
  return String(value).replace(/[^0-9]/g, '');
};

const allowSharedVerificationPhone = String(process.env.ALLOW_SHARED_VERIFICATION_PHONE || '').toLowerCase() === 'true';

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

// Helper to generate verification code
const generateVerificationCode = () => {
  return crypto.randomBytes(32).toString('hex');
};

// POST /api/customers/signup - Customer registration
router.post('/signup', sanitizeBody, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    const name = String(req.body.name || '').trim();
    const phoneInput = String(req.body.phone || '').trim();

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    let normalizedPhone = null;

    // Phone validation (if provided)
    if (phoneInput) {
      const cleanPhone = phoneInput.replace(/[\s-]/g, '');
      const phoneRegex = /^(\+63|63|0)?9\d{9}$/;

      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          error: 'Invalid Philippine phone number. Use format: 09XXXXXXXXX or +639XXXXXXXXX'
        });
      }

      normalizedPhone = normalizePhone(cleanPhone);
    }

    // Check if customer already exists by email
    const [existingEmail] = await pool.execute(
      'SELECT id FROM customers WHERE LOWER(email) = ? AND archived_at IS NULL',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Enforce one active account per phone number unless shared demo verification mode is enabled.
    if (normalizedPhone && !allowSharedVerificationPhone) {
      const [existingPhone] = await pool.execute(
        'SELECT id FROM customers WHERE phone IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE(phone, "+", ""), "-", ""), "(", ""), ")", "") = ? AND archived_at IS NULL LIMIT 1',
        [normalizedPhone]
      );

      if (existingPhone.length > 0) {
        return res.status(409).json({
          error: 'Phone number already registered. Please log in to the existing account or use a different number.'
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO customers
       (id, email, password_hash, name, phone, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
      [id, email, passwordHash, name, normalizedPhone || null]
    );

    await logActivity('CUSTOMER_SIGNUP', `New customer registered: ${email}`, email);

    res.status(201).json({
      message: 'Account created successfully!',
      customerId: id
    });
  } catch (error) {
    console.error('Customer signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/customers/login - Customer login
router.post('/login', loginLimiter, sanitizeBody, async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find customer
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE email = ? AND archived_at IS NULL',
      [email]
    );

    if (customers.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const customer = customers[0];

    if (customer.is_blocked) {
      return res.status(403).json({
        error: customer.blocked_reason || 'Your account has been blocked. Please contact support.'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, customer.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken({
      id: customer.id,
      email: customer.email,
      role: 'customer',
      name: customer.name
    });

    await logActivity('CUSTOMER_LOGIN', `Customer logged in: ${email}`, email);

    res.json({
      token,
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        role: 'customer',
        emailVerified: Boolean(customer.email_verified),
        phoneVerified: Boolean(customer.phone_verified)
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/customers/verify-email/:token - Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );

    if (customers.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const customer = customers[0];

    // Update customer as verified
    await pool.execute(
      'UPDATE customers SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [customer.id]
    );

    await logActivity('EMAIL_VERIFIED', `Customer verified email: ${customer.email}`, customer.email);

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/customers/resend-verification - Resend verification email
router.post('/resend-verification', sanitizeBody, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];

    if (customer.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationCode();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      'UPDATE customers SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, tokenExpires, customer.id]
    );

    // TODO: Send verification email

    res.json({
      message: 'Verification email sent!',
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
      verificationUrl: `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

// GET /api/customers/me - Get current customer profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [customers] = await pool.execute(
      'SELECT id, email, name, phone, email_verified, phone_verified, created_at FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];
    res.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      role: 'customer',
      emailVerified: Boolean(customer.email_verified),
      phoneVerified: Boolean(customer.phone_verified),
      createdAt: customer.created_at
    });
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/customers/favorites - Get customer favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.execute(
      `SELECT
        f.id,
        f.property_id,
        f.created_at,
        p.title,
        p.type,
        p.price,
        p.location,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.status,
        p.image_url,
        p.created_at AS property_created_at,
        p.updated_at AS property_updated_at
       FROM customer_favorites f
       INNER JOIN properties p ON p.id = f.property_id
       WHERE f.customer_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      data: rows.map((row) => ({
        id: row.property_id,
        title: row.title,
        type: row.type,
        price: Number(row.price || 0),
        location: row.location,
        bedrooms: Number(row.bedrooms || 0),
        bathrooms: Number(row.bathrooms || 0),
        area: Number(row.area || 0),
        status: row.status,
        imageUrl: row.image_url || '',
        createdAt: row.property_created_at,
        updatedAt: row.property_updated_at,
        favoriteCreatedAt: row.created_at
      })),
      count: rows.length
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/customers/favorites/:propertyId - Add favorite
router.post('/favorites/:propertyId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const propertyId = req.params.propertyId;
    if (!isUuid(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID format' });
    }

    const [propertyRows] = await pool.execute(
      'SELECT id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (propertyRows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await pool.execute(
      `INSERT INTO customer_favorites (id, customer_id, property_id, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [uuidv4(), req.user.id, propertyId]
    );

    return res.status(201).json({ message: 'Added to favorites', propertyId });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/customers/favorites/:propertyId - Remove favorite
router.delete('/favorites/:propertyId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const propertyId = req.params.propertyId;
    if (!isUuid(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID format' });
    }

    await pool.execute(
      'DELETE FROM customer_favorites WHERE customer_id = ? AND property_id = ?',
      [req.user.id, propertyId]
    );

    return res.json({ message: 'Removed from favorites', propertyId });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// GET /api/customers/preferences - Fetch customer preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.execute(
      `SELECT
        customer_id,
        preferred_locations,
        property_types,
        min_price,
        max_price,
        min_area,
        max_area,
        preferred_bedrooms,
        preferred_bathrooms,
        amenities,
        updated_at
       FROM customer_preferences
       WHERE customer_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({
        customerId: req.user.id,
        preferredLocations: [],
        propertyTypes: [],
        minPrice: null,
        maxPrice: null,
        minArea: null,
        maxArea: null,
        preferredBedrooms: null,
        preferredBathrooms: null,
        amenities: []
      });
    }

    const row = rows[0];

    return res.json({
      customerId: row.customer_id,
      preferredLocations: parseJsonArray(row.preferred_locations),
      propertyTypes: parseJsonArray(row.property_types),
      minPrice: row.min_price,
      maxPrice: row.max_price,
      minArea: row.min_area,
      maxArea: row.max_area,
      preferredBedrooms: row.preferred_bedrooms,
      preferredBathrooms: row.preferred_bathrooms,
      amenities: parseJsonArray(row.amenities),
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Get customer preferences error:', error);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// PUT /api/customers/preferences - Save customer preferences
router.put('/preferences', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      preferredLocations,
      propertyTypes,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      preferredBedrooms,
      preferredBathrooms,
      amenities
    } = req.body;

    await pool.execute(
      `INSERT INTO customer_preferences
        (id, customer_id, preferred_locations, property_types, min_price, max_price, min_area, max_area, preferred_bedrooms, preferred_bathrooms, amenities, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         preferred_locations = VALUES(preferred_locations),
         property_types = VALUES(property_types),
         min_price = VALUES(min_price),
         max_price = VALUES(max_price),
         min_area = VALUES(min_area),
         max_area = VALUES(max_area),
         preferred_bedrooms = VALUES(preferred_bedrooms),
         preferred_bathrooms = VALUES(preferred_bathrooms),
         amenities = VALUES(amenities),
         updated_at = NOW()`,
      [
        uuidv4(),
        req.user.id,
        JSON.stringify(Array.isArray(preferredLocations) ? preferredLocations : []),
        JSON.stringify(Array.isArray(propertyTypes) ? propertyTypes : []),
        minPrice ?? null,
        maxPrice ?? null,
        minArea ?? null,
        maxArea ?? null,
        preferredBedrooms ?? null,
        preferredBathrooms ?? null,
        JSON.stringify(Array.isArray(amenities) ? amenities : [])
      ]
    );

    return res.json({ message: 'Preferences saved successfully' });
  } catch (error) {
    console.error('Save customer preferences error:', error);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// GET /api/customers/inquiries - Get customer's own submitted inquiries
router.get('/inquiries', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [customerRows] = await pool.execute(
      `SELECT id, email, phone
       FROM customers
       WHERE id = ? OR LOWER(email) = LOWER(?)
       ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END
       LIMIT 1`,
      [req.user.id, req.user.email || '', req.user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerRows[0];
    const effectiveEmail = (customer.email || req.user.email || '').toLowerCase();
    const normalizedPhone = normalizePhone(customer.phone);

    const [inquiries] = await pool.execute(
      `SELECT
        i.id,
        i.property_title,
        i.property_location,
        i.property_price,
        i.status,
        i.notes,
        i.created_at,
        i.updated_at,
        u.name as agent_name,
        u.email as agent_email,
        u.phone as agent_phone
      FROM inquiries i
      LEFT JOIN users u ON i.assigned_to = u.id
      WHERE i.customer_id = ?
        OR LOWER(i.email) = LOWER(?)
        OR (? <> '' AND REPLACE(REPLACE(REPLACE(REPLACE(i.phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?)
      ORDER BY i.created_at DESC`,
      [req.user.id, effectiveEmail, normalizedPhone, normalizedPhone]
    );

    res.json({ data: inquiries });
  } catch (error) {
    console.error('Get customer inquiries error:', error);
    res.status(500).json({ error: 'Failed to get inquiries' });
  }
});

// GET /api/customers/appointments - Get customer's appointments
router.get('/appointments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [customerRows] = await pool.execute(
      `SELECT id, email, phone
       FROM customers
       WHERE id = ? OR LOWER(email) = LOWER(?)
       ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END
       LIMIT 1`,
      [req.user.id, req.user.email || '', req.user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerRows[0];
    const effectiveEmail = (customer.email || req.user.email || '').toLowerCase();
    const normalizedPhone = normalizePhone(customer.phone);

    await ensureFeedbackTable(pool);

    const [appointments] = await pool.execute(
      `SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.type,
        ce.type as appointment_type,
        ce.start_time as start,
        ce.end_time as end,
        COALESCE(ce.inquiry_id, i.id) as inquiry_id,
        ce.agent_id,
        ce.property_id,
        i.property_title,
        i.property_location,
        i.property_price,
        i.status as inquiry_status,
        u.name as agent_name,
        u.email as agent_email,
        u.phone as agent_phone,
        af.rating as feedback_rating,
        af.comment as feedback_comment,
        af.created_at as feedback_created_at
      FROM inquiries i
      INNER JOIN calendar_events ce ON ce.inquiry_id = i.id
      LEFT JOIN users u ON ce.agent_id = u.id
      LEFT JOIN appointment_feedback af ON af.appointment_id = ce.id AND af.customer_id = ?
      WHERE i.customer_id = ?
        OR LOWER(i.email) = LOWER(?)
        OR (? <> '' AND REPLACE(REPLACE(REPLACE(REPLACE(i.phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?)
      ORDER BY ce.start_time DESC`,
      [req.user.id, req.user.id, effectiveEmail, normalizedPhone, normalizedPhone]
    );

    const normalized = appointments.map((apt) => ({
      ...apt,
      start: formatDateTimeForApi(apt.start),
      end: formatDateTimeForApi(apt.end)
    }));

    res.json({ data: normalized });
  } catch (error) {
    console.error('Get customer appointments error:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

// POST /api/customers/inquiries/:id/cancel - Customer cancels own inquiry
router.post('/inquiries/:id/cancel', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const inquiryId = req.params.id;
    const reason = (req.body.reason || '').trim();

    const [customerRows] = await pool.execute(
      'SELECT id, email, phone FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerRows[0];
    const normalizedPhone = normalizePhone(customer.phone);

    const [inquiryRows] = await pool.execute(
      `SELECT id, ticket_number, status
       FROM inquiries
       WHERE id = ?
         AND (
           customer_id = ?
           OR LOWER(email) = LOWER(?)
           OR (? <> '' AND REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?)
         )
       LIMIT 1`,
      [inquiryId, req.user.id, customer.email || req.user.email || '', normalizedPhone, normalizedPhone]
    );

    if (inquiryRows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = inquiryRows[0];
    const terminalStatuses = new Set(['deal-successful', 'deal-cancelled', 'no-response']);
    if (terminalStatuses.has(inquiry.status)) {
      return res.status(400).json({ error: 'Inquiry is already closed' });
    }

    await pool.execute(
      `UPDATE inquiries
       SET status = 'deal-cancelled',
           updated_at = NOW()
       WHERE id = ?`,
      [inquiry.id]
    );

    await pool.execute(
      `UPDATE calendar_events
       SET type = 'viewing-cancelled', updated_at = NOW()
       WHERE inquiry_id = ? AND type NOT IN ('viewing-cancelled', 'viewing-completed')`,
      [inquiry.id]
    );

    const reasonSuffix = reason ? ` Reason: ${reason}` : '';
    await logActivity(
      'CUSTOMER_CANCEL_INQUIRY',
      `Customer ${req.user.email} cancelled inquiry ${inquiry.ticket_number}.${reasonSuffix}`,
      req.user.email
    );

    return res.json({
      message: 'Inquiry cancelled successfully',
      inquiryId: inquiry.id,
      status: 'deal-cancelled'
    });
  } catch (error) {
    console.error('Cancel inquiry error:', error);
    return res.status(500).json({ error: 'Failed to cancel inquiry' });
  }
});

// POST /api/customers/appointments/:id/feedback - Leave feedback after viewing is done
router.post('/appointments/:id/feedback', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer from 1 to 5' });
    }

    await ensureFeedbackTable(pool);

    const [customerRows] = await pool.execute(
      'SELECT id, email, phone FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerRows[0];
    const normalizedPhone = normalizePhone(customer.phone);

    const [rows] = await pool.execute(
      `SELECT
         ce.id AS appointment_id,
         ce.type AS appointment_type,
         ce.agent_id,
         i.id AS inquiry_id,
         i.status AS inquiry_status
       FROM inquiries i
      INNER JOIN calendar_events ce ON ce.inquiry_id = i.id
       WHERE ce.id = ?
         AND (
           i.customer_id = ?
           OR LOWER(i.email) = LOWER(?)
           OR (? <> '' AND REPLACE(REPLACE(REPLACE(REPLACE(i.phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?)
         )
       LIMIT 1`,
      [req.params.id, req.user.id, customer.email || req.user.email || '', normalizedPhone, normalizedPhone]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = rows[0];
    const doneStatuses = new Set(['viewed-interested', 'viewed-not-interested', 'deal-successful']);
    const doneTypes = new Set(['viewing-completed']);
    if (!doneStatuses.has(appointment.inquiry_status) && !doneTypes.has(appointment.appointment_type)) {
      return res.status(400).json({ error: 'Feedback can only be submitted after a completed viewing' });
    }

    await pool.execute(
      `INSERT INTO appointment_feedback (id, appointment_id, inquiry_id, customer_id, agent_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         comment = VALUES(comment),
         updated_at = NOW()`,
      [uuidv4(), appointment.appointment_id, appointment.inquiry_id, req.user.id, appointment.agent_id || null, rating, comment || null]
    );

    await logActivity('CUSTOMER_APPOINTMENT_FEEDBACK', `Customer ${req.user.email} rated appointment ${appointment.appointment_id} with ${rating} stars`, req.user.email);

    return res.json({
      message: 'Feedback submitted successfully',
      appointmentId: appointment.appointment_id,
      rating,
      comment: comment || null
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// PUT /api/customers/me - Update customer profile
router.put('/me', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, phone } = req.body;
    
    // Validation
    if (name !== undefined && (!name || name.trim().length < 2)) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    // Phone validation (if provided)
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      // Remove spaces and dashes
      const cleanPhone = phone.replace(/[\s-]/g, '');
      
      // Philippine phone number validation
      // Accepts: 09XXXXXXXXX or +639XXXXXXXXX or 639XXXXXXXXX
      const phoneRegex = /^(\+63|63|0)?9\d{9}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ 
          error: 'Invalid Philippine phone number. Use format: 09XXXXXXXXX or +639XXXXXXXXX' 
        });
      }
    }

    const updates = [];
    const values = [];
    let phoneChanged = false;
    let oldPhone = null;

    const normalizePhone = (value) => {
      if (!value) return null;
      const stripped = String(value).replace(/[\s\-()]/g, '');
      if (stripped.startsWith('+639')) return stripped;
      if (stripped.startsWith('639')) return `+${stripped}`;
      if (stripped.startsWith('09')) return `+63${stripped.slice(1)}`;
      return stripped;
    };

    // Get current phone to check if it changed
    const [currentCustomer] = await pool.execute(
      'SELECT phone FROM customers WHERE id = ?',
      [req.user.id]
    );
    oldPhone = currentCustomer[0]?.phone;

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (phone !== undefined) {
      const normalizedOldPhone = normalizePhone(oldPhone);
      const normalizedNewPhone = phone ? normalizePhone(phone) : null;

      updates.push('phone = ?');
      values.push(normalizedNewPhone);
      
      // Reset verification only when actual number changed (not format-only change)
      if (normalizedNewPhone && normalizedNewPhone !== normalizedOldPhone) {
        updates.push('phone_verified = FALSE');
        updates.push('phone_verification_token = NULL');
        updates.push('phone_verification_expires = NULL');
        phoneChanged = true;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');
    values.push(req.user.id);

    await pool.execute(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user data
    const [updatedCustomer] = await pool.execute(
      'SELECT id, email, name, phone, email_verified, phone_verified, created_at FROM customers WHERE id = ?',
      [req.user.id]
    );

    const user = updatedCustomer[0];

    await logActivity('CUSTOMER_UPDATE_PROFILE', `Customer ${user.email} updated profile`, user.email);

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: 'customer',
        emailVerified: Boolean(user.email_verified),
        phoneVerified: Boolean(user.phone_verified),
        createdAt: user.created_at
      },
      requiresPhoneVerification: phoneChanged
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/customers/change-password - Change customer password
router.put('/change-password', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
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
      'SELECT id, email, password_hash FROM customers WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = rows[0];
    const valid = await bcrypt.compare(currentPassword, customer.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE customers SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newHash, customer.id]
    );

    await logActivity('CUSTOMER_PASSWORD_CHANGE', `Customer changed password: ${customer.email}`, customer.email);

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Customer change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============================================================
// PHONE VERIFICATION ENDPOINTS
// ============================================================

// POST /api/customers/send-phone-otp - Send OTP to customer's phone
router.post('/send-phone-otp', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get customer's phone number
    const [customers] = await pool.execute(
      'SELECT id, phone, phone_verified FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];

    if (!customer.phone) {
      return res.status(400).json({ error: 'Phone number not set. Please update your profile.' });
    }

    if (customer.phone_verified) {
      return res.status(400).json({ error: 'Phone number already verified' });
    }

    // Check rate limiting - max 3 attempts per 5 minutes
    const [attempts] = await pool.execute(
      `SELECT attempt_count, last_attempt_at 
       FROM phone_verification_attempts 
       WHERE customer_id = ? AND phone = ?`,
      [customer.id, customer.phone]
    );

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (attempts.length > 0) {
      const attempt = attempts[0];
      const lastAttempt = new Date(attempt.last_attempt_at);

      if (lastAttempt > fiveMinutesAgo && attempt.attempt_count >= 3) {
        const timeLeft = Math.ceil((5 * 60 * 1000 - (now - lastAttempt)) / 1000);
        return res.status(429).json({
          error: `Too many attempts. Please try again in ${timeLeft} seconds.`,
          retryAfter: timeLeft
        });
      }

      // Reset counter if more than 5 minutes passed
      if (lastAttempt <= fiveMinutesAgo) {
        await pool.execute(
          'UPDATE phone_verification_attempts SET attempt_count = 0, last_attempt_at = NOW() WHERE customer_id = ? AND phone = ?',
          [customer.id, customer.phone]
        );
      }
    }

    // Generate and send OTP
    const result = await sendVerificationCode(customer.phone);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send verification code' });
    }

    // Calculate expiry time (5 minutes)
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    // Store OTP token in database
    await pool.execute(
      `UPDATE customers 
       SET phone_verification_token = ?, 
           phone_verification_expires = ? 
       WHERE id = ?`,
      [result.otp, expiresAt, customer.id]
    );

    // Update or insert attempt counter
    if (attempts.length > 0) {
      await pool.execute(
        `UPDATE phone_verification_attempts 
         SET attempt_count = attempt_count + 1, last_attempt_at = NOW() 
         WHERE customer_id = ? AND phone = ?`,
        [customer.id, customer.phone]
      );
    } else {
      await pool.execute(
        `INSERT INTO phone_verification_attempts (id, customer_id, phone, attempt_count, last_attempt_at, reset_at) 
         VALUES (?, ?, ?, 1, NOW(), ?)`,
        [uuidv4(), customer.id, customer.phone, expiresAt]
      );
    }

    // Log the sent OTP
    await pool.execute(
      `INSERT INTO phone_verification_log 
       (id, customer_id, phone, otp_sent, sent_at, expires_at, status) 
       VALUES (?, ?, ?, ?, NOW(), ?, 'pending')`,
      [uuidv4(), customer.id, customer.phone, result.otp, expiresAt]
    );

    await logActivity('PHONE_OTP_SENT', `OTP sent to ${customer.phone}`, req.user.email);

    res.json({
      message: 'Verification code sent to your phone',
      expiresIn: 300, // seconds
      cooldownUntil: expiresAt.toISOString(),
      mode: result.mode || 'production',
      deliveredTo: result.deliveredTo || customer.phone
    });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /api/customers/verify-phone - Verify OTP code
router.post('/verify-phone', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP code is required' });
    }

    // Get customer with verification token
    const [customers] = await pool.execute(
      `SELECT id, phone, phone_verified, phone_verification_token, phone_verification_expires 
       FROM customers 
       WHERE id = ?`,
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];

    if (customer.phone_verified) {
      return res.status(400).json({ error: 'Phone number already verified' });
    }

    if (!customer.phone_verification_token) {
      return res.status(400).json({ error: 'No verification code sent. Please request a new code.' });
    }

    // Check if token expired
    const now = new Date();
    const expires = new Date(customer.phone_verification_expires);

    if (now > expires) {
      return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
    }

    // Verify OTP
    if (otp.trim() !== customer.phone_verification_token) {
      // Update log with failed attempt
      await pool.execute(
        `UPDATE phone_verification_log 
         SET status = 'failed', verified_at = NOW() 
         WHERE customer_id = ? AND otp_sent = ? AND status = 'pending'`,
        [customer.id, customer.phone_verification_token]
      );

      await logActivity('PHONE_VERIFICATION_FAILED', `Invalid OTP for ${customer.phone}`, req.user.email);

      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark phone as verified
    await pool.execute(
      `UPDATE customers 
       SET phone_verified = TRUE, 
           phone_verification_token = NULL, 
           phone_verification_expires = NULL 
       WHERE id = ?`,
      [customer.id]
    );

    // Update log with success
    await pool.execute(
      `UPDATE phone_verification_log 
       SET status = 'verified', verified_at = NOW() 
       WHERE customer_id = ? AND otp_sent = ? AND status = 'pending'`,
      [customer.id, customer.phone_verification_token]
    );

    // Clear attempt counter
    await pool.execute(
      'DELETE FROM phone_verification_attempts WHERE customer_id = ?',
      [customer.id]
    );

    await logActivity('PHONE_VERIFIED', `Customer verified phone: ${customer.phone}`, req.user.email);

    res.json({
      message: 'Phone number verified successfully!',
      phoneVerified: true
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/customers/resend-phone-otp - Resend OTP (with cooldown)
router.post('/resend-phone-otp', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get customer
    const [customers] = await pool.execute(
      'SELECT id, phone, phone_verified, phone_verification_expires FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];

    if (!customer.phone) {
      return res.status(400).json({ error: 'Phone number not set' });
    }

    if (customer.phone_verified) {
      return res.status(400).json({ error: 'Phone number already verified' });
    }

    // Check if there's a recent OTP sent (5-minute cooldown)
    if (customer.phone_verification_expires) {
      const now = new Date();
      const expires = new Date(customer.phone_verification_expires);
      const threeMinutesBeforeExpiry = new Date(expires.getTime() - 3 * 60 * 1000);

      if (now < threeMinutesBeforeExpiry) {
        const waitTime = Math.ceil((threeMinutesBeforeExpiry - now) / 1000);
        return res.status(429).json({
          error: `Please wait ${waitTime} seconds before requesting a new code`,
          retryAfter: waitTime
        });
      }
    }

    // Generate and send OTP
    const result = await sendVerificationCode(customer.phone);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send verification code' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    // Persist OTP and expiry
    await pool.execute(
      `UPDATE customers 
       SET phone_verification_token = ?, 
           phone_verification_expires = ? 
       WHERE id = ?`,
      [result.otp, expiresAt, customer.id]
    );

    // Rate-limit tracking for resend calls
    const [attempts] = await pool.execute(
      `SELECT attempt_count, last_attempt_at 
       FROM phone_verification_attempts 
       WHERE customer_id = ? AND phone = ?`,
      [customer.id, customer.phone]
    );

    if (attempts.length > 0) {
      await pool.execute(
        `UPDATE phone_verification_attempts 
         SET attempt_count = attempt_count + 1, last_attempt_at = NOW() 
         WHERE customer_id = ? AND phone = ?`,
        [customer.id, customer.phone]
      );
    } else {
      await pool.execute(
        `INSERT INTO phone_verification_attempts (id, customer_id, phone, attempt_count, last_attempt_at, reset_at) 
         VALUES (?, ?, ?, 1, NOW(), ?)`,
        [uuidv4(), customer.id, customer.phone, expiresAt]
      );
    }

    await pool.execute(
      `INSERT INTO phone_verification_log 
       (id, customer_id, phone, otp_sent, sent_at, expires_at, status) 
       VALUES (?, ?, ?, ?, NOW(), ?, 'pending')`,
      [uuidv4(), customer.id, customer.phone, result.otp, expiresAt]
    );

    await logActivity('PHONE_OTP_RESENT', `OTP resent to ${customer.phone}`, req.user.email);

    return res.json({
      message: 'New verification code sent to your phone',
      expiresIn: 300,
      cooldownUntil: expiresAt.toISOString(),
      mode: result.mode || 'production'
    });
  } catch (error) {
    console.error('Resend phone OTP error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

module.exports = router;
