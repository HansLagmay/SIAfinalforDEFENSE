const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logActivity = require('../middleware/logger');
const { isAdmin, isAgent, canManagePropertyAsAgent } = require('../utils/accessControl');

const router = express.Router();

const docsRoot = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(docsRoot)) {
  fs.mkdirSync(docsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const propertyDir = path.join(docsRoot, req.params.id);
    fs.mkdirSync(propertyDir, { recursive: true });
    cb(null, propertyDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path.basename(file.originalname || 'document', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const allowedMime = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg'
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      cb(new Error('Only PDF, PNG, and JPG files are allowed'));
      return;
    }
    cb(null, true);
  }
});

const getPropertyAccessRow = async (propertyId) => {
  const [rows] = await pool.execute(
    `SELECT id, visible_to_customers, created_by, created_by_user_id, archived_at
     FROM properties
     WHERE id = ?
     LIMIT 1`,
    [propertyId]
  );
  return rows[0] || null;
};

const canAccessPropertyDocuments = (user, propertyRow, action) => {
  if (!user || !propertyRow) return false;
  if (propertyRow.archived_at) return false;

  if (isAdmin(user)) {
    return true;
  }

  if (isAgent(user)) {
    if (action === 'list' || action === 'download') {
      return canManagePropertyAsAgent(user, propertyRow);
    }
    if (action === 'upload' || action === 'delete') {
      return canManagePropertyAsAgent(user, propertyRow);
    }
    return false;
  }

  if (user.role === 'customer') {
    if (propertyRow.visible_to_customers === undefined || propertyRow.visible_to_customers === null) {
      return true;
    }
    return Boolean(propertyRow.visible_to_customers);
  }

  return false;
};

router.post('/properties/:id/documents', authenticateToken, requireRole(['admin', 'agent']), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' });
    }

    const [properties] = await pool.execute(
      'SELECT id, title, visible_to_customers, created_by, created_by_user_id, archived_at FROM properties WHERE id = ?',
      [req.params.id]
    );
    if (properties.length === 0 || properties[0].archived_at) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!canAccessPropertyDocuments(req.user, properties[0], 'upload')) {
      return res.status(403).json({ error: 'Access denied for this property document' });
    }

    const documentType = (req.body.documentType || '').trim();
    if (!documentType) {
      return res.status(400).json({ error: 'documentType is required' });
    }

    const id = uuidv4();
    const relativePath = `/uploads/documents/${req.params.id}/${req.file.filename}`;

    await pool.execute(
      `INSERT INTO property_documents
        (id, property_id, document_type, file_name, file_path, file_size, uploaded_by, uploaded_by_name, uploaded_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)` ,
      [
        id,
        req.params.id,
        documentType,
        req.file.originalname,
        relativePath,
        req.file.size,
        req.user.id,
        req.user.name,
        req.body.expiresAt || null
      ]
    );

    await logActivity('UPLOAD_DOCUMENT', `Uploaded ${documentType} for property ${properties[0].title}`, req.user.name);

    return res.status(201).json({
      id,
      propertyId: req.params.id,
      documentType,
      fileName: req.file.originalname,
      filePath: relativePath,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/properties/:id/documents', authenticateToken, async (req, res) => {
  try {
    const property = await getPropertyAccessRow(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!canAccessPropertyDocuments(req.user, property, 'list')) {
      return res.status(403).json({ error: 'Access denied for this property document' });
    }

    const [rows] = await pool.execute(
      `SELECT id, property_id, document_type, file_name, file_size, uploaded_by, uploaded_by_name, uploaded_at, expires_at
       FROM property_documents
       WHERE property_id = ?
       ORDER BY uploaded_at DESC`,
      [req.params.id]
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({ error: 'Failed to load documents' });
  }
});

router.get('/documents/:id/download', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, property_id, file_name, file_path FROM property_documents WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const property = await getPropertyAccessRow(rows[0].property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!canAccessPropertyDocuments(req.user, property, 'download')) {
      return res.status(403).json({ error: 'Access denied for this property document' });
    }

    const filePath = path.join(__dirname, '..', rows[0].file_path.replace(/^\//, ''));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File no longer exists on server' });
    }

    return res.download(filePath, rows[0].file_name);
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({ error: 'Failed to download document' });
  }
});

router.delete('/properties/:id/documents/:docId', authenticateToken, requireRole(['admin', 'agent']), async (req, res) => {
  try {
    const property = await getPropertyAccessRow(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!canAccessPropertyDocuments(req.user, property, 'delete')) {
      return res.status(403).json({ error: 'Access denied for this property document' });
    }

    const [rows] = await pool.execute(
      `SELECT id, file_path, file_name FROM property_documents WHERE id = ? AND property_id = ? LIMIT 1`,
      [req.params.docId, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', rows[0].file_path.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.execute('DELETE FROM property_documents WHERE id = ?', [req.params.docId]);

    await logActivity('DELETE_DOCUMENT', `Deleted document ${rows[0].file_name}`, req.user.name);

    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
