const express = require('express');
const { getPool } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const queries = require('../config/queries.json');

const router = express.Router();

// ─── GET /api/query/codes ─────────────────────────────────────────────────────
// Returns available query codes and a short preview of each SQL statement.
router.get('/codes', authMiddleware, (req, res) => {
  const codes = Object.entries(queries).map(([code, sql]) => ({
    code,
    preview: sql.length > 80 ? sql.substring(0, 80) + '…' : sql,
  }));
  res.json({ codes });
});

// ─── POST /api/query/run ──────────────────────────────────────────────────────
// Accepts { code: "GET_TABLES" }, looks up the matching SQL in queries.json,
// executes it against the read-only MSSQL pool, and returns JSON results.
router.post('/run', authMiddleware, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Query code is required' });
  }

  const normalizedCode = code.trim().toUpperCase();
  const sql = queries[normalizedCode];

  if (!sql) {
    return res.status(404).json({
      error: `Unknown query code: "${code}"`,
      availableCodes: Object.keys(queries),
    });
  }

  try {
    const pool = await getPool();
    const result = await pool.request().query(sql);

    res.json({
      code: normalizedCode,
      rowCount: result.recordset.length,
      columns:
        result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
      data: result.recordset,
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[DB Error]', err.message);
    res.status(500).json({
      error: 'Database query failed',
      details: err.message,
    });
  }
});

module.exports = router;
