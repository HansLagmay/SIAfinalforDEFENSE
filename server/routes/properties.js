const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken, authenticateTokenOptional, requireRole } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { propertyCreationLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/upload');
const {
  propertySchema,
  propertyDraftSchema,
  propertyUpdateSchema,
  uuidParamSchema,
  validate,
  validateParams
} = require('../middleware/validators');
const logActivity = require('../middleware/logger');
const { canManagePropertyAsAgent, isAdmin } = require('../utils/accessControl');

let hasVisibilityColumnCache;

const hasVisibilityColumn = async () => {
  if (typeof hasVisibilityColumnCache === 'boolean') {
    return hasVisibilityColumnCache;
  }

  const [rows] = await pool.execute("SHOW COLUMNS FROM properties LIKE 'visible_to_customers'");
  hasVisibilityColumnCache = rows.length > 0;
  return hasVisibilityColumnCache;
};

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// Transform snake_case DB fields to camelCase for frontend
const transformProperty = (property) => {
  if (!property) return null;
  return {
    id: property.id,
    title: property.title,
    type: property.type,
    price: property.price,
    location: property.location,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    description: property.description,
    status: property.status,
    imageUrl: property.imageUrl || property.image_url || '',
    images: property.images || [],
    features: typeof property.features === 'string' ? JSON.parse(property.features) : (property.features || []),
    createdBy: property.created_by,
    createdByUserId: property.created_by_user_id,
    statusHistory: typeof property.status_history === 'string' ? JSON.parse(property.status_history) : (property.status_history || []),
    viewCount: property.view_count || 0,
    viewHistory: typeof property.view_history === 'string' ? JSON.parse(property.view_history) : (property.view_history || []),
    lastViewedAt: property.last_viewed_at,
    soldBy: property.sold_by,
    soldByAgentId: property.sold_by_agent_id,
    soldAt: property.sold_at,
    salePrice: property.sale_price,
    commission: typeof property.commission === 'string' ? JSON.parse(property.commission) : property.commission,
    reservedBy: property.reserved_by,
    reservedAt: property.reserved_at,
    reservedUntil: property.reserved_until,
    documentCount: Number(property.document_count || 0),
    hasVerifiedDocuments: Number(property.document_count || 0) > 0,
    visibleToCustomers: property.visible_to_customers !== undefined ? Boolean(property.visible_to_customers) : true,
    createdAt: property.created_at,
    updatedAt: property.updated_at
  };
};

// Helper: attach images to property rows
const attachImages = async (properties) => {
  if (!properties.length) return properties;
  const ids = properties.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const [imgRows] = await pool.execute(
    `SELECT property_id, image_url FROM property_images WHERE property_id IN (${placeholders}) ORDER BY is_primary DESC, created_at ASC`,
    ids
  );

  const imgMap = {};
  imgRows.forEach((r) => {
    if (!imgMap[r.property_id]) imgMap[r.property_id] = [];
    imgMap[r.property_id].push(r.image_url);
  });

  return properties.map((p) => {
    const imgs = imgMap[p.id] || [];
    return {
      ...p,
      imageUrl: imgs[0] || p.imageUrl || '',
      images: imgs
    };
  });
};

const attachDocumentMeta = async (properties) => {
  if (!properties.length) return properties;
  const ids = properties.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');

  const [rows] = await pool.execute(
    `SELECT property_id, COUNT(*) AS document_count
     FROM property_documents
     WHERE property_id IN (${placeholders})
     GROUP BY property_id`,
    ids
  );

  const countMap = {};
  rows.forEach((r) => {
    countMap[r.property_id] = Number(r.document_count || 0);
  });

  return properties.map((p) => ({
    ...p,
    document_count: countMap[p.id] || 0
  }));
};

// GET all properties (public, paginated, advanced filtering)
router.get('/', authenticateTokenOptional, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const where = [];
    const params = [];

    const supportsVisibilityColumn = await hasVisibilityColumn();

    // Only privileged roles (admin/agent) can bypass visibility filtering.
    const isPrivileged = req.user && ['admin', 'agent'].includes(req.user.role);

    if (!isPrivileged && supportsVisibilityColumn) {
      where.push('visible_to_customers = true');
    }

    if (!isPrivileged) {
      where.push("status IN ('available', 'for-sale', 'for sale')");
    }

    where.push('archived_at IS NULL');

    const queryTypes = String(req.query.type || req.query.types || '').split(',').map((v) => v.trim()).filter(Boolean);
    if (queryTypes.length > 0) {
      where.push(`type IN (${queryTypes.map(() => '?').join(',')})`);
      params.push(...queryTypes);
    }

    const minPrice = Number(req.query.minPrice);
    if (Number.isFinite(minPrice)) {
      where.push('price >= ?');
      params.push(minPrice);
    }

    const maxPrice = Number(req.query.maxPrice);
    if (Number.isFinite(maxPrice)) {
      where.push('price <= ?');
      params.push(maxPrice);
    }

    const bedrooms = Number(req.query.bedrooms);
    if (Number.isInteger(bedrooms) && bedrooms > 0) {
      if (bedrooms >= 5) {
        where.push('bedrooms >= ?');
      } else {
        where.push('bedrooms = ?');
      }
      params.push(bedrooms);
    }

    const bathrooms = Number(req.query.bathrooms);
    if (Number.isInteger(bathrooms) && bathrooms > 0) {
      if (bathrooms >= 5) {
        where.push('bathrooms >= ?');
      } else {
        where.push('bathrooms = ?');
      }
      params.push(bathrooms);
    }

    const minArea = Number(req.query.minArea);
    if (Number.isFinite(minArea)) {
      where.push('area >= ?');
      params.push(minArea);
    }

    const maxArea = Number(req.query.maxArea);
    if (Number.isFinite(maxArea)) {
      where.push('area <= ?');
      params.push(maxArea);
    }

    const city = String(req.query.city || req.query.location || '').trim();
    if (city) {
      where.push('location LIKE ?');
      params.push(`%${city}%`);
    }

    const amenities = String(req.query.amenities || '').split(',').map((v) => v.trim()).filter(Boolean);
    amenities.forEach((amenity) => {
      where.push('EXISTS (SELECT 1 FROM property_amenities pa WHERE pa.property_id = properties.id AND pa.amenity_name LIKE ?)');
      params.push(`%${amenity}%`);
    });

    let countQuery = 'SELECT COUNT(*) AS total FROM properties';
    let selectQuery = 'SELECT * FROM properties';
    const whereClause = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
    
    countQuery += whereClause;
    selectQuery += `${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [[{ total }]] = await pool.execute(countQuery, params);
    const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

    const withImages = await attachImages(rows);
    const withDocuments = await attachDocumentMeta(withImages);
    const transformedData = withDocuments.map(transformProperty);
    res.json(paginate(total, transformedData, page, limit));
  } catch (error) {
    console.error('Properties fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// GET single property (public with visibility guard)
router.get('/:id([0-9a-fA-F-]{36})', authenticateTokenOptional, validateParams(uuidParamSchema), async (req, res) => {
  try {
    const supportsVisibilityColumn = await hasVisibilityColumn();
    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = rows[0];
    const isPrivileged = req.user && ['admin', 'agent'].includes(req.user.role);

    if (supportsVisibilityColumn && !isPrivileged && property.visible_to_customers === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const [withImages] = await attachImages(rows);
    const [withDocuments] = await attachDocumentMeta([withImages]);
    res.json(transformProperty(withDocuments));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// GET property amenities
router.get('/:id/amenities', authenticateTokenOptional, validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT amenity_name FROM property_amenities WHERE property_id = ? ORDER BY amenity_name ASC',
      [req.params.id]
    );

    return res.json({ data: rows.map((r) => r.amenity_name) });
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    return res.status(500).json({ error: 'Failed to fetch amenities' });
  }
});

// PUT property amenities (admin/agent)
router.put('/:id/amenities', authenticateToken, requireRole(['admin', 'agent']), validateParams(uuidParamSchema), sanitizeBody, async (req, res) => {
  try {
    const amenities = Array.isArray(req.body.amenities)
      ? req.body.amenities.map((a) => String(a || '').trim()).filter(Boolean)
      : [];

    await pool.execute('DELETE FROM property_amenities WHERE property_id = ?', [req.params.id]);

    for (const amenity of amenities) {
      await pool.execute(
        'INSERT INTO property_amenities (id, property_id, amenity_name, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), req.params.id, amenity]
      );
    }

    return res.json({ message: 'Amenities updated', data: amenities });
  } catch (error) {
    console.error('Failed to update amenities:', error);
    return res.status(500).json({ error: 'Failed to update amenities' });
  }
});

// POST upload property images (admin and agent)
router.post('/upload', authenticateToken, requireRole(['admin', 'agent']), upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    const imageUrls = req.files.map((f) => `/uploads/properties/${f.filename}`);
    await logActivity('UPLOAD_IMAGES', `Uploaded ${req.files.length} property images`, req.user.name);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// POST new property (admin only)
router.post('/', authenticateToken, requireRole(['admin']), sanitizeBody, validate(propertySchema), propertyCreationLimiter, async (req, res) => {
  try {
    const id = uuidv4();
    const {
      title, type, price, location, bedrooms, bathrooms, area,
      description, status, imageUrl, features
    } = req.body;

    await pool.execute(
      `INSERT INTO properties (id, title, type, price, location, bedrooms, bathrooms, area, description, status, image_url, features, created_by, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title,
        type,
        price,
        location,
        bedrooms,
        bathrooms,
        area,
        description,
        status,
        imageUrl || '',
        JSON.stringify(Array.isArray(features) ? features : []),
        req.user.name,
        req.user.id
      ]
    );

    // Insert images array if provided
    const images = Array.isArray(req.body.images) ? req.body.images : (imageUrl ? [imageUrl] : []);
    for (let i = 0; i < images.length; i++) {
      await pool.execute(
        'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())',
        [uuidv4(), id, images[i], i === 0 ? 1 : 0]
      );
    }

    await logActivity('CREATE_PROPERTY', `Created property: ${title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [id]);
    const [withImages] = await attachImages(rows);
    res.status(201).json(transformProperty(withImages));
  } catch (error) {
    console.error('Failed to create property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// POST new draft property (agent only)
router.post('/draft', authenticateToken, requireRole(['agent']), sanitizeBody, validate(propertyDraftSchema), async (req, res) => {
  try {
    const id = uuidv4();
    const {
      title, type, price, location, bedrooms, bathrooms, area,
      description, imageUrl, features
    } = req.body;

    await pool.execute(
      `INSERT INTO properties (id, title, type, price, location, bedrooms, bathrooms, area, description, status, image_url, features, created_by, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title,
        type,
        price,
        location || '',
        bedrooms,
        bathrooms,
        area,
        description || '',
        imageUrl || '',
        JSON.stringify(Array.isArray(features) ? features : []),
        req.user.name,
        req.user.id
      ]
    );

    await logActivity('CREATE_PROPERTY_DRAFT', `Draft property created: ${title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [id]);
    const [withImages] = await attachImages(rows);
    res.status(201).json(transformProperty(withImages));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property draft' });
  }
});

// PUT update property (admin or agent-own-draft)
router.put('/:id', authenticateToken, requireRole(['admin', 'agent']), validateParams(uuidParamSchema), sanitizeBody, validate(propertyUpdateSchema), async (req, res) => {
  try {
    const supportsVisibilityColumn = await hasVisibilityColumn();

    const [existing] = await pool.execute('SELECT id, title, status, created_by, created_by_user_id FROM properties WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = existing[0];

    if (req.user.role === 'agent') {
      const ownsDraft = property.status === 'draft' && canManagePropertyAsAgent(req.user, property);
      if (!ownsDraft) {
        return res.status(403).json({ error: 'Agents can only edit their own draft properties' });
      }
    }

    const fields = [];
    const values = [];

    const adminAllowed = [
      'title', 'type', 'price', 'location', 'bedrooms', 'bathrooms', 'area', 'description', 'status',
      'image_url', 'visible_to_customers', 'status_history', 'sold_by', 'sold_by_agent_id', 'sold_at',
      'sale_price', 'reserved_by', 'reserved_at', 'reserved_until', 'commission'
    ];
    const agentAllowed = [
      'title', 'type', 'price', 'location', 'bedrooms', 'bathrooms', 'area', 'description', 'status', 'image_url'
    ];
    const allowed = req.user.role === 'admin' ? adminAllowed : agentAllowed;
    const mapping = {
      imageUrl: 'image_url',
      visibleToCustomers: 'visible_to_customers',
      statusHistory: 'status_history',
      soldBy: 'sold_by',
      soldByAgentId: 'sold_by_agent_id',
      soldAt: 'sold_at',
      salePrice: 'sale_price',
      reservedBy: 'reserved_by',
      reservedAt: 'reserved_at',
      reservedUntil: 'reserved_until'
    };

    Object.keys(req.body).forEach((key) => {
      const col = mapping[key] || key;
      if (allowed.includes(col)) {
        if (!supportsVisibilityColumn && col === 'visible_to_customers') {
          return;
        }
        if (req.user.role === 'agent' && col === 'status' && !['draft', 'available'].includes(String(req.body[key]))) {
          return;
        }
        fields.push(`${col} = ?`);
        values.push(req.body[key]);
      }
    });

    if (req.body.features !== undefined) {
      fields.push('features = ?');
      values.push(JSON.stringify(Array.isArray(req.body.features) ? req.body.features : []));
    }

    // Auto-hide from customers when status changes to restricted statuses
    if (req.body.status && supportsVisibilityColumn && req.user.role === 'admin') {
      const restrictedStatuses = ['under-contract', 'sold', 'withdrawn', 'off-market'];
      if (restrictedStatuses.includes(req.body.status)) {
        fields.push('visible_to_customers = ?');
        values.push(false);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Update images if provided
    if (Array.isArray(req.body.images)) {
      await pool.execute('DELETE FROM property_images WHERE property_id = ?', [req.params.id]);
      for (let i = 0; i < req.body.images.length; i++) {
        await pool.execute(
          'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())',
          [uuidv4(), req.params.id, req.body.images[i], i === 0 ? 1 : 0]
        );
      }
    }

    await logActivity('UPDATE_PROPERTY', `Updated property: ${existing[0].title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    const [withImages] = await attachImages(rows);
    res.json(transformProperty(withImages));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// PATCH toggle visibility (admin and agent)
router.patch('/:id/visibility', authenticateToken, requireRole(['admin', 'agent']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const supportsVisibilityColumn = await hasVisibilityColumn();
    if (!supportsVisibilityColumn) {
      return res.status(400).json({ error: 'Property visibility control is not available until database migration is applied' });
    }

    const [existing] = await pool.execute(
      'SELECT id, title, visible_to_customers, created_by, created_by_user_id FROM properties WHERE id = ? AND archived_at IS NULL', 
      [req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!isAdmin(req.user) && !canManagePropertyAsAgent(req.user, existing[0])) {
      return res.status(403).json({ error: 'Agents can only change visibility for their own properties' });
    }

    const { visible } = req.body;
    if (typeof visible !== 'boolean') {
      return res.status(400).json({ error: 'visible must be a boolean value' });
    }

    await pool.execute(
      'UPDATE properties SET visible_to_customers = ?, updated_at = NOW() WHERE id = ?',
      [visible, req.params.id]
    );

    await logActivity(
      'TOGGLE_VISIBILITY', 
      `Property "${existing[0].title}" ${visible ? 'shown to' : 'hidden from'} customers`, 
      req.user.name
    );

    const [rows] = await pool.execute('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    const [withImages] = await attachImages(rows);
    res.json(transformProperty(withImages));
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

// DELETE property -> archive property (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT title FROM properties WHERE id = ? AND archived_at IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await pool.execute(
      'UPDATE properties SET archived_at = NOW(), archived_by = ?, archive_reason = ?, updated_at = NOW() WHERE id = ?',
      [req.user.id, 'Archived by admin', req.params.id]
    );
    await logActivity('ARCHIVE_PROPERTY', `Archived property: ${rows[0].title}`, req.user.name);

    res.json({ message: 'Property archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive property' });
  }
});

// POST restore archived property (admin only)
router.post('/:id/restore', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT title FROM properties WHERE id = ? AND archived_at IS NOT NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Archived property not found' });
    }

    await pool.execute(
      'UPDATE properties SET archived_at = NULL, archived_by = NULL, archive_reason = NULL, updated_at = NOW() WHERE id = ?',
      [req.params.id]
    );

    await logActivity('RESTORE_PROPERTY', `Restored property: ${rows[0].title}`, req.user.name);
    return res.json({ message: 'Property restored successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to restore property' });
  }
});

// GET property assignment status (admin only)
// Returns all properties with their primary agent, inquiry count for admin reassignment UI
router.get('/admin/assignment-status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.type,
        p.price,
        p.location,
        p.primary_agent_id,
        u.name AS primary_agent_name,
        COUNT(i.id) AS active_inquiry_count,
        p.created_at
      FROM properties p
      LEFT JOIN users u ON p.primary_agent_id = u.id
      LEFT JOIN inquiries i ON p.id = i.property_id AND i.archived_at IS NULL AND i.status NOT IN ('deal-successful', 'deal-cancelled', 'no-response')
      WHERE p.archived_at IS NULL
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `);

    const [agentRows] = await pool.execute(`
      SELECT
        u.id,
        u.name,
        COALESCE(
          (
            SELECT p2.type
            FROM properties p2
            WHERE p2.primary_agent_id = u.id AND p2.archived_at IS NULL
            GROUP BY p2.type
            ORDER BY COUNT(*) DESC, p2.type ASC
            LIMIT 1
          ),
          'General'
        ) AS specialization
      FROM users u
      WHERE u.role = 'agent' AND u.archived_at IS NULL
      ORDER BY u.name ASC
    `);

    const formatted = rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.type,
      price: row.price,
      location: row.location,
      primaryAgentId: row.primary_agent_id,
      primaryAgentName: row.primary_agent_name,
      activeInquiryCount: row.active_inquiry_count,
      canReassign: row.active_inquiry_count === 0,
      createdAt: row.created_at
    }));

    res.json({
      data: formatted,
      agents: agentRows.map((a) => ({
        id: a.id,
        name: a.name,
        specialization: a.specialization
      }))
    });
  } catch (error) {
    console.error('Failed to get assignment status:', error);
    res.status(500).json({ error: 'Failed to get property assignment status' });
  }
});

// PUT reassign property to different agent (admin only)
// Must have 0 active inquiries
router.put('/:id/assign-agent', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), sanitizeBody, async (req, res) => {
  try {
    const { newAgentId, reason } = req.body;

    if (!newAgentId) {
      return res.status(400).json({ error: 'newAgentId is required' });
    }

    // Get property
    const [propRows] = await pool.execute(
      'SELECT id, title, primary_agent_id FROM properties WHERE id = ? AND archived_at IS NULL',
      [req.params.id]
    );
    if (propRows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = propRows[0];

    // Verify new agent exists and is active
    const [agentRows] = await pool.execute(
      "SELECT id, name, archived_at FROM users WHERE id = ? AND role = 'agent' LIMIT 1",
      [newAgentId]
    );
    if (agentRows.length === 0) {
      return res.status(400).json({ error: 'Agent not found or is not an agent' });
    }

    if (agentRows[0].archived_at) {
      return res.status(400).json({ error: 'Cannot assign to archived agent' });
    }

    const newAgentName = agentRows[0].name;

    // Count active inquiries (not in terminal state)
    const [[{ activeCount }]] = await pool.execute(
      `SELECT COUNT(*) as activeCount FROM inquiries 
       WHERE property_id = ? AND archived_at IS NULL AND status NOT IN ('deal-successful', 'deal-cancelled', 'no-response')`,
      [req.params.id]
    );

    if (activeCount > 0) {
      return res.status(409).json({
        error: `Cannot reassign property with active inquiries (${activeCount} inquiries pending)`,
        activeInquiryCount: activeCount
      });
    }

    // Reassign
    await pool.execute(
      `UPDATE properties SET primary_agent_id = ?, assigned_to_agent_at = NOW(), assigned_by_admin_id = ?, assignment_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [newAgentId, req.user.id, reason || 'Admin reassignment', req.params.id]
    );

    await logActivity(
      'REASSIGN_PROPERTY',
      `Reassigned property "${property.title}" from ${property.primary_agent_id || 'unassigned'} to ${newAgentName}. Reason: ${reason || 'Admin reassignment'}`,
      req.user.name
    );

    res.json({
      message: 'Property reassigned successfully',
      propertyId: req.params.id,
      newAgentId: newAgentId,
      newAgentName: newAgentName
    });
  } catch (error) {
    console.error('Failed to reassign property:', error);
    res.status(500).json({ error: 'Failed to reassign property' });
  }
});

// GET agent's sold properties
router.get('/agent/sold', authenticateToken, requireRole(['agent']), async (req, res) => {
  try {
    const agentId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM properties 
       WHERE sold_by_agent_id = ? AND archived_at IS NULL`,
      [agentId]
    );

    const [rows] = await pool.execute(
      `SELECT 
        id, title, type, price, location, bedrooms, bathrooms, area, description, status,
        image_url, features, created_by, status_history, view_count, view_history, last_viewed_at,
        sold_by, sold_by_agent_id, sold_at, sale_price, commission, reserved_by, reserved_at,
        reserved_until, created_at, updated_at
       FROM properties 
       WHERE sold_by_agent_id = ? AND archived_at IS NULL
       ORDER BY sold_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, limit, offset]
    );

    const properties = rows.map((p) => ({
      ...transformProperty(p),
      salePrice: p.sale_price,
      soldAt: p.sold_at
    }));

    const enrichedProps = await attachImages(properties);

    res.json(paginate(total, enrichedProps, page, limit));
  } catch (error) {
    console.error('Failed to get sold properties:', error);
    res.status(500).json({ error: 'Failed to get sold properties' });
  }
});

module.exports = router;
