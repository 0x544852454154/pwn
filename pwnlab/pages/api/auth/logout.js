import { endSession } from '../../../lib/auth';
import { getCookie } from '../../../lib/cookies';
import { apiRateLimit } from '../../../lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    if (token) {
      await endSession(token);
    }

    res.setHeader(
      'Set-Cookie',
      'pwnlab_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Logout error');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
