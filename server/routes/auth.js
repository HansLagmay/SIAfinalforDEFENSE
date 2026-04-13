const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { sanitizeBody } = require('../middleware/sanitize');
const logActivity = require('../middleware/logger');

router.post('/', loginLimiter, sanitizeBody, async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND archived_at IS NULL', [email]);
    const user = rows[0];

    if (!user) {
      await logActivity('LOGIN_FAILED', `Failed login attempt: ${email}`, 'Unknown');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await logActivity('LOGIN_FAILED', `Failed login attempt: ${email}`, 'Unknown');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    await logActivity('LOGIN_SUCCESS', `User logged in: ${user.name}`, user.name);

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
