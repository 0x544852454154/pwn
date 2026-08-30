import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError, apiRateLimit } from '../../../lib/api-middleware';
import { logAudit, AuditAction } from '../../../lib/audit';

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

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }

    if (targetUserId !== user.id) {
      return res.status(403).json({ error: 'Can only invalidate your own sessions' });
    }

    const { error } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('user_id', targetUserId);

    if (error) {
      console.error('[API] Session invalidation error:', error);
      return res.status(500).json({ error: 'Failed to invalidate sessions' });
    }

    await logAudit(AuditAction.SESSION_INVALIDATED, user.id, req);

    res.setHeader(
      'Set-Cookie',
      'pwnlab_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );

    return res.status(200).json({
      success: true,
      message: 'All sessions invalidated. Please log in again.',
    });
  } catch (error) {
    console.error('[API] Session invalidation error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
