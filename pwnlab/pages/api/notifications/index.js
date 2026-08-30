import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, type, title, message, data, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return res.status(200).json({
        notifications: (data || []).map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          isRead: n.is_read,
          created_at: n.created_at
        }))
      });
    } catch (error) {
      console.error('[API] Notifications list error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'POST' && req.body?.action === 'readAll') {
    try {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API] Mark all notifications error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
