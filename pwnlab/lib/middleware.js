const rateLimitStore = new Map();
const csrfTokens = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_AUTH_MAX = 10;
const RATE_LIMIT_PIN_RESET_MAX = 3;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

function rateLimit(options = {}) {
  const {
    windowMs = RATE_LIMIT_WINDOW,
    max = RATE_LIMIT_MAX_REQUESTS,
    keyPrefix = 'rl',
    skipFailedRequests = false,
  } = options;

  return async (req, res) => {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    const record = rateLimitStore.get(key);

    if (now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    record.count++;

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return {
        allowed: false,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    return { allowed: true, remaining: max - record.count };
  };
}

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMIT_AUTH_MAX,
  keyPrefix: 'auth',
});

const pinResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMIT_PIN_RESET_MAX,
  keyPrefix: 'pinreset',
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMIT_MAX_REQUESTS,
  keyPrefix: 'api',
});

function generateCsrfToken(sessionId) {
  const token = require('crypto').randomBytes(32).toString('hex');
  csrfTokens.set(token, {
    sessionId,
    expiresAt: Date.now() + 30 * 60 * 1000,
  });
  return token;
}

function validateCsrfToken(token, sessionId) {
  if (!token || !csrfTokens.has(token)) {
    return false;
  }

  const record = csrfTokens.get(token);

  if (Date.now() > record.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }

  if (record.sessionId !== sessionId) {
    return false;
  }

  return true;
}

function cleanupStores() {
  const now = Date.now();

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  for (const [token, record] of csrfTokens.entries()) {
    if (now > record.expiresAt) {
      csrfTokens.delete(token);
    }
  }
}

setInterval(cleanupStores, 5 * 60 * 1000);

module.exports = {
  rateLimit,
  authRateLimit,
  pinResetRateLimit,
  apiRateLimit,
  generateCsrfToken,
  validateCsrfToken,
  getClientIp,
};
