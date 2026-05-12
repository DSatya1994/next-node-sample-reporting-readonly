const sql = require('mssql');

/**
 * MSSQL connection config driven entirely from environment variables.
 * The connection is read-only (applicationIntent: 'ReadOnly').
 */
const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    applicationIntent: 'ReadOnly',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool = null;
let poolPromise = null;

/**
 * Returns a shared connection pool.
 * Creates the pool lazily on first call; subsequent calls reuse it.
 */
const getPool = async () => {
  if (pool) return pool;

  // Guard against concurrent connection attempts
  if (poolPromise) return poolPromise;

  poolPromise = sql
    .connect(dbConfig)
    .then((p) => {
      pool = p;
      poolPromise = null;
      console.log('Connected to MSSQL database');
      return pool;
    })
    .catch((err) => {
      poolPromise = null;
      throw err;
    });

  return poolPromise;
};

module.exports = { getPool, sql };
