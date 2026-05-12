const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 * Reads JWT from the HTTP-only cookie set at login,
 * or falls back to the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user on success.
 */
const authMiddleware = (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.headers?.authorization?.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};

module.exports = authMiddleware;
