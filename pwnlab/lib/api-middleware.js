const { getCookie } = require('./cookies');
const { getCurrentUser } = require('./auth');
const { apiRateLimit } = require('./middleware');

async function requireAuth(req, res) {
  const rateLimitResult = await apiRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
    return null;
  }

  const token = getCookie(req, 'pwnlab_token');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const user = await getCurrentUser(token);

  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  return user;
}

async function requireAuthWithCsrf(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;

  const csrfToken = req.headers['x-csrf-token'];
  const sessionId = getCookie(req, 'pwnlab_token');

  if (!csrfToken || !validateCsrfToken(csrfToken, sessionId)) {
    res.status(403).json({ error: 'Invalid or missing CSRF token' });
    return null;
  }

  return user;
}

function validateCsrfToken(token, sessionId) {
  const { validateCsrfToken: validate } = require('./middleware');
  return validate(token, sessionId);
}

async function optionalAuth(req, res) {
  const rateLimitResult = await apiRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
    return null;
  }

  const token = getCookie(req, 'pwnlab_token');

  if (!token) {
    return null;
  }

  const user = await getCurrentUser(token);
  return user || null;
}

function sanitizeError(error) {
  if (error && error.message) {
    const sanitized = error.message
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED_IP]')
      .replace(/postgres:\/\/[^/\s]+/g, '[REDACTED_DB]')
      .replace(/@[^\s]+/g, '[REDACTED_HOST]');
    return sanitized;
  }
  return 'An internal error occurred';
}

module.exports = {
  requireAuth,
  requireAuthWithCsrf,
  optionalAuth,
  sanitizeError,
};
