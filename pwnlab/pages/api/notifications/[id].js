import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { id } = req.query;
    const notificationId = parseInt(id);

    if (isNaN(notificationId) || notificationId <= 0) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (existing.user_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Mark notification read error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
