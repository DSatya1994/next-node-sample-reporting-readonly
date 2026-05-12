const express = require('express');
const jwt = require('jsonwebtoken');
const { getUsers } = require('../config/users');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/** Cookie options — HttpOnly prevents JS access (XSS protection) */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  path: '/',
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = getUsers();

  if (!users[username] || users[username] !== password) {
    // Deliberate generic message — don't reveal which field is wrong
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  res.cookie('token', token, cookieOptions);
  res.json({ message: 'Login successful', username });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/me  (protected) ───────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = router;
