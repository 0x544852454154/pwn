import { requireAuth, sanitizeError, apiRateLimit } from '../../../lib/api-middleware';
import { getUserAuditLog } from '../../../lib/audit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await apiRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const logs = await getUserAuditLog(user.id, limit);

    return res.status(200).json({ logs });
  } catch (error) {
    console.error('[API] Audit log fetch error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
