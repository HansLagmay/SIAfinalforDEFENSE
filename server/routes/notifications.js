const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, type, title, message, related_id, related_type, read_at, created_at
       FROM notifications
       WHERE user_id = ? AND user_role = ?
       ORDER BY created_at DESC
       LIMIT 200`,
      [req.user.id, req.user.role]
    );

    const unread = rows.filter((n) => !n.read_at).length;
    return res.json({ data: rows, unreadCount: unread });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      `UPDATE notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE id = ? AND user_id = ? AND user_role = ?`,
      [req.params.id, req.user.id, req.user.role]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ? AND user_role = ?',
      [req.params.id, req.user.id, req.user.role]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

router.delete('/', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM notifications WHERE user_id = ? AND user_role = ?',
      [req.user.id, req.user.role]
    );

    return res.json({ message: 'Notifications cleared' });
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;
