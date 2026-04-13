const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const logActivity = require('../middleware/logger');
const { createNotification } = require('../services/notificationService');

const CONFLICT_BUFFER_MS = 60 * 60 * 1000; // 1 hour

const parseDateTimeInput = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  // Parse date/time components as local wall-clock time and ignore timezone suffixes.
  const localMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (localMatch) {
    const [, year, month, day, hour, minute, second] = localMatch;
    const parsedLocal = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second || '0')
    );
    return Number.isNaN(parsedLocal.getTime()) ? null : parsedLocal;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDateTimeForDb = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

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

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

const CALENDAR_SELECT_FIELDS = `
  id,
  title,
  description,
  type,
  DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') AS start_time,
  DATE_FORMAT(end_time, '%Y-%m-%d %H:%i:%s') AS end_time,
  agent_id,
  inquiry_id,
  property_id,
  created_by,
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
  DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
`;

// Transform snake_case DB fields to camelCase for frontend
const transformCalendarEvent = (event) => {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    start: formatDateTimeForApi(event.start_time),
    end: formatDateTimeForApi(event.end_time),
    agentId: event.agent_id,
    inquiryId: event.inquiry_id,
    propertyId: event.property_id,
    createdBy: event.created_by,
    createdAt: formatDateTimeForApi(event.created_at),
    updatedAt: formatDateTimeForApi(event.updated_at)
  };
};

// GET all calendar events (protected, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const shared = req.query.shared === 'true';

    let countSql = 'SELECT COUNT(*) AS total FROM calendar_events';
    let dataSql = `SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events ORDER BY start_time ASC LIMIT ? OFFSET ?`;
    const countParams = [];
    const dataParams = [limit, offset];

    if (req.user.role === 'agent' && !shared) {
      countSql += ' WHERE agent_id = ?';
      dataSql = `SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE agent_id = ? ORDER BY start_time ASC LIMIT ? OFFSET ?`;
      countParams.push(req.user.id);
      dataParams.unshift(req.user.id);
    }

    const [[{ total }]] = await pool.execute(countSql, countParams);
    const [rows] = await pool.query(dataSql, dataParams);

    const transformedRows = rows.map(transformCalendarEvent);
    res.json(paginate(total, transformedRows, page, limit));
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET events for specific agent (protected)
router.get('/agent/:agentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'agent' && req.params.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.execute(
      `SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE agent_id = ? ORDER BY start_time ASC`,
      [req.params.agentId]
    );
    const transformedRows = rows.map(transformCalendarEvent);
    res.json(transformedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent events' });
  }
});

// POST new event (protected)
router.post('/', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { start, end, agentId, title, description, type, inquiryId, propertyId } = req.body;

    const effectiveAgentId = agentId || req.user.id;

    if (req.user.role === 'agent' && effectiveAgentId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot create events for other agents' });
    }

    // Validate start/end times
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end times are required' });
    }

    const startDate = parseDateTimeInput(start);
    const endDate = parseDateTimeInput(end);

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Invalid start or end datetime format' });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    if (type === 'viewing' && !inquiryId) {
      return res.status(400).json({ error: 'inquiryId is required for viewing events' });
    }

    if (inquiryId) {
      const [inquiryRows] = await pool.execute('SELECT id FROM inquiries WHERE id = ? LIMIT 1', [inquiryId]);
      if (inquiryRows.length === 0) {
        return res.status(400).json({ error: 'Invalid inquiryId' });
      }
    }

    // Conflict check with 1-hour buffer
    const newStart = startDate.getTime();
    const newEnd = endDate.getTime();
    const bufferStart = formatDateTimeForDb(new Date(newStart - CONFLICT_BUFFER_MS));
    const bufferEnd = formatDateTimeForDb(new Date(newEnd + CONFLICT_BUFFER_MS));

    console.log('Checking conflicts for agent:', effectiveAgentId);
    console.log('New event time:', startDate.toISOString(), 'to', endDate.toISOString());
    console.log('Buffer check:', bufferStart, 'to', bufferEnd);

    const [conflicts] = await pool.execute(
      'SELECT id, title, start_time, end_time FROM calendar_events WHERE agent_id = ? AND start_time < ? AND end_time > ?',
      [effectiveAgentId, bufferEnd, bufferStart]
    );

    if (conflicts.length > 0) {
      console.log('Conflict detected:', conflicts);
      return res.status(409).json({
        error: 'Schedule conflict: You have another event within 1 hour of this time',
        conflictingEvents: conflicts.map(c => ({
          id: c.id,
          title: c.title,
          start: c.start_time,
          end: c.end_time
        }))
      });
    }

    console.log('No conflicts found, creating event');

    const id = uuidv4();
    const startDb = formatDateTimeForDb(startDate);
    const endDb = formatDateTimeForDb(endDate);

    await pool.execute(
      'INSERT INTO calendar_events (id, title, description, type, start_time, end_time, agent_id, inquiry_id, property_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [id, title || '', description || null, type || 'other', startDb, endDb, effectiveAgentId, inquiryId || null, propertyId || null, req.user.name]
    );

    await logActivity('CREATE_EVENT', `Created calendar event: ${title}`, req.user.name);

    // Note: Property status is NOT automatically changed when viewing is scheduled
    // Properties should remain 'available' or 'reserved' until an offer is accepted
    // Status should only change to 'under-contract' when contracts are actually signed

    // Update inquiry status to viewing-scheduled
    if (inquiryId) {
      await pool.execute(
        'UPDATE inquiries SET status = "viewing-scheduled", updated_at = NOW() WHERE id = ?',
        [inquiryId]
      );
      await logActivity('AUTO_UPDATE_INQUIRY', `Inquiry ${inquiryId} status updated to viewing-scheduled`, req.user.name);

      const [inquiryRows] = await pool.execute(
        'SELECT id, ticket_number, customer_id, email, property_title FROM inquiries WHERE id = ? LIMIT 1',
        [inquiryId]
      );

      if (inquiryRows.length > 0) {
        let customerId = inquiryRows[0].customer_id;

        if (!customerId && inquiryRows[0].email) {
          const [customerRows] = await pool.execute(
            'SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1',
            [inquiryRows[0].email]
          );
          customerId = customerRows[0]?.id || null;
        }

        if (customerId) {
          const when = formatDateTimeForApi(startDb).replace('T', ' ');
          await createNotification(pool, {
            userId: customerId,
            userRole: 'customer',
            type: 'viewing-scheduled',
            title: 'Viewing Confirmed',
            message: `Your viewing for ${inquiryRows[0].property_title || 'the property'} is confirmed on ${when}.`,
            relatedId: inquiryRows[0].id,
            relatedType: 'inquiry'
          }).catch((err) => console.error('Notification create failed:', err.message));
        }
      }
    }

    const [rows] = await pool.execute(`SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE id = ?`, [id]);
    res.status(201).json(transformCalendarEvent(rows[0]));
  } catch (error) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT update event (protected)
router.put('/:id', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const [existing] = await pool.execute(`SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE id = ?`, [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role === 'agent' && existing[0].agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If updating start or end time, check for conflicts
    if (req.body.start || req.body.end) {
      const newStart = req.body.start ? parseDateTimeInput(req.body.start) : parseDateTimeInput(existing[0].start_time);
      const newEnd = req.body.end ? parseDateTimeInput(req.body.end) : parseDateTimeInput(existing[0].end_time);

      if (!newStart || !newEnd) {
        return res.status(400).json({ error: 'Invalid start or end datetime format' });
      }

      if (newStart >= newEnd) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      const newStartMs = newStart.getTime();
      const newEndMs = newEnd.getTime();
      const bufferStart = formatDateTimeForDb(new Date(newStartMs - CONFLICT_BUFFER_MS));
      const bufferEnd = formatDateTimeForDb(new Date(newEndMs + CONFLICT_BUFFER_MS));

      console.log('Checking update conflicts for agent:', existing[0].agent_id);
      console.log('Updated time:', newStart.toISOString(), 'to', newEnd.toISOString());

      // Check for conflicts, excluding the current event being updated
      const [conflicts] = await pool.execute(
        'SELECT id, title, start_time, end_time FROM calendar_events WHERE agent_id = ? AND id != ? AND start_time < ? AND end_time > ?',
        [existing[0].agent_id, req.params.id, bufferEnd, bufferStart]
      );

      if (conflicts.length > 0) {
        console.log('Update conflict detected:', conflicts);
        return res.status(409).json({
          error: 'Schedule conflict: You have another event within 1 hour of this time',
          conflictingEvents: conflicts.map(c => ({
            id: c.id,
            title: c.title,
            start: c.start_time,
            end: c.end_time
          }))
        });
      }
    }

    const fields = [];
    const values = [];
    const allowed = ['title', 'description', 'type'];

    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    if (req.body.start) {
      const parsedStart = parseDateTimeInput(req.body.start);
      if (!parsedStart) {
        return res.status(400).json({ error: 'Invalid start datetime format' });
      }
      fields.push('start_time = ?');
      values.push(formatDateTimeForDb(parsedStart));
    }
    if (req.body.end) {
      const parsedEnd = parseDateTimeInput(req.body.end);
      if (!parsedEnd) {
        return res.status(400).json({ error: 'Invalid end datetime format' });
      }
      fields.push('end_time = ?');
      values.push(formatDateTimeForDb(parsedEnd));
    }
    if ('inquiryId' in req.body) {
      fields.push('inquiry_id = ?');
      values.push(req.body.inquiryId || null);
    }
    if ('propertyId' in req.body) {
      fields.push('property_id = ?');
      values.push(req.body.propertyId || null);
    }

    if (fields.length > 0) {
      const effectiveType = req.body.type || existing[0].type;
      const effectiveInquiryId = Object.prototype.hasOwnProperty.call(req.body, 'inquiryId')
        ? (req.body.inquiryId || null)
        : existing[0].inquiry_id;

      if (effectiveType === 'viewing' && !effectiveInquiryId) {
        return res.status(400).json({ error: 'inquiryId is required for viewing events' });
      }

      if (effectiveInquiryId) {
        const [inquiryRows] = await pool.execute('SELECT id FROM inquiries WHERE id = ? LIMIT 1', [effectiveInquiryId]);
        if (inquiryRows.length === 0) {
          return res.status(400).json({ error: 'Invalid inquiryId' });
        }
      }

      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await logActivity('UPDATE_EVENT', `Updated calendar event: ${existing[0].title}`, req.user.name);

    const [rows] = await pool.execute(`SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE id = ?`, [req.params.id]);
    res.json(transformCalendarEvent(rows[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// POST mark event as done (protected)
router.post('/:id/mark-done', authenticateToken, async (req, res) => {
  try {
    const { inquiryStatus } = req.body;

    if (!inquiryStatus || !['viewed-interested', 'viewed-not-interested'].includes(inquiryStatus)) {
      return res.status(400).json({ error: 'Invalid inquiry status. Must be "viewed-interested" or "viewed-not-interested"' });
    }

    const [existing] = await pool.execute(`SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE id = ?`, [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role === 'agent' && existing[0].agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const event = existing[0];

    // Update linked inquiry status if exists
    if (event.inquiry_id) {
      await pool.execute(
        'UPDATE inquiries SET status = ?, updated_at = NOW() WHERE id = ?',
        [inquiryStatus, event.inquiry_id]
      );
      await logActivity('UPDATE_INQUIRY_STATUS', `Marked inquiry ${event.inquiry_id} as ${inquiryStatus}`, req.user.name);

      const [inquiryRows] = await pool.execute(
        'SELECT id, customer_id, email, property_title FROM inquiries WHERE id = ? LIMIT 1',
        [event.inquiry_id]
      );

      if (inquiryRows.length > 0) {
        let customerId = inquiryRows[0].customer_id;

        if (!customerId && inquiryRows[0].email) {
          const [customerRows] = await pool.execute(
            'SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1',
            [inquiryRows[0].email]
          );
          customerId = customerRows[0]?.id || null;
        }

        if (customerId) {
          await createNotification(pool, {
            userId: customerId,
            userRole: 'customer',
            type: 'feedback-request',
            title: 'How was your viewing?',
            message: `Your viewing for ${inquiryRows[0].property_title || 'the property'} is marked completed. Please leave a rating.`,
            relatedId: event.id,
            relatedType: 'appointment'
          }).catch((err) => console.error('Notification create failed:', err.message));
        }
      }
    }

    // Keep the calendar row for tracking and customer history.
    // Use type to indicate lifecycle state while preserving date/time record.
    await pool.execute(
      'UPDATE calendar_events SET type = ?, updated_at = NOW() WHERE id = ?',
      ['viewing-completed', req.params.id]
    );
    await logActivity('VIEWING_COMPLETED', `Completed viewing: ${event.title} - Status: ${inquiryStatus}`, req.user.name);

    res.json({ 
      message: 'Viewing marked as done',
      inquiryStatus,
      eventId: event.id
    });
  } catch (error) {
    console.error('Failed to mark viewing as done:', error);
    res.status(500).json({ error: 'Failed to mark viewing as done' });
  }
});

// DELETE event (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [existing] = await pool.execute(`SELECT ${CALENDAR_SELECT_FIELDS} FROM calendar_events WHERE id = ?`, [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role === 'agent' && existing[0].agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Keep cancelled event as history instead of hard-delete.
    await pool.execute(
      'UPDATE calendar_events SET type = ?, updated_at = NOW() WHERE id = ?',
      ['viewing-cancelled', req.params.id]
    );
    await logActivity('CANCEL_EVENT', `Cancelled calendar event: ${existing[0].title}`, req.user.name);

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
