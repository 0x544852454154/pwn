import { supabaseAdmin } from '../../lib/db';
import { requireAuth, sanitizeError } from '../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { data: logs, error } = await supabaseAdmin
      .from('activity_log')
      .select('id, action, details, created_at, user:users(username)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[API] Activity query error');
      return res.status(200).json({ activity: [] });
    }

    const activity = (logs || []).map(l => ({
      id: l.id,
      action: l.action,
      details: l.details,
      created_at: l.created_at,
      username: l.user?.username || 'operator'
    }));

    return res.status(200).json({ activity });
  } catch (error) {
    console.error('[API] Activity error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
