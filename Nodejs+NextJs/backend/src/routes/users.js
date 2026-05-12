const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Returns the list of configured users (passwords are never exposed).
router.get('/', authMiddleware, (req, res) => {
  const raw = process.env.USERS || '';

  const users = raw
    .split(',')
    .map((pair, index) => {
      const idx = pair.indexOf(':');
      if (idx === -1) return null;
      const username = pair.slice(0, idx).trim();
      if (!username) return null;
      return {
        id: index + 1,
        username,
        role: index === 0 ? 'admin' : 'user',
        status: 'active',
      };
    })
    .filter(Boolean);

  res.json({ users, total: users.length });
});

module.exports = router;
