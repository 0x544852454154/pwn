import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { id } = req.query;
    const eventId = parseInt(id);

    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('competitions')
      .select('id, name, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data: existing } = await supabaseAdmin
      .from('competition_participants')
      .select('id')
      .eq('competition_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'You have already joined this event' });
    }

    await supabaseAdmin.from('competition_participants').insert({
      competition_id: eventId,
      user_id: user.id,
      points_earned: 0
    });

    return res.status(200).json({ success: true, message: `Joined ${event.name}` });
  } catch (error) {
    console.error('[API] Join event error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
