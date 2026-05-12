const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/datetime ────────────────────────────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const now = new Date();

  res.json({
    iso: now.toISOString(),
    utc: now.toUTCString(),
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    timestamp: now.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
});

module.exports = router;
