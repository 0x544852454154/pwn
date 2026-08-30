import { getCurrentUser } from '../../../lib/auth';
import { getCookie } from '../../../lib/cookies';
import { apiRateLimit } from '../../../lib/api-middleware';

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

  try {
    const token = getCookie(req, 'pwnlab_token');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getCurrentUser(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('[API] Auth check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
