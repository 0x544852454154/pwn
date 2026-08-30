import { supabaseAdmin } from '../../lib/db';
import { sanitizeError, apiRateLimit } from '../../lib/api-middleware';

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
    const { data: logs, error } = await supabaseAdmin
      .from('activity_log')
      .select('id, action, details, created_at, user:users(id, username)')
      .in('action', ['FIRST_BLOOD', 'ANNOUNCEMENT'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[API] Announcements query error');
      return res.status(200).json({ announcements: [] });
    }

    const announcements = (logs || []).map(l => ({
      id: l.id,
      action: l.action,
      details: l.details,
      created_at: l.created_at,
      username: l.user?.username || 'system',
      isFirstBlood: l.action === 'FIRST_BLOOD'
    }));

    return res.status(200).json({ announcements });
  } catch (error) {
    console.error('[API] Announcements error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
