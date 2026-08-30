import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const eventId = parseInt(id);

    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('competitions')
      .select('id, name, mode')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data: participants, error: partError } = await supabaseAdmin
      .from('competition_participants')
      .select('id, user_id, team_id, points_earned, user:users(username), team:teams(name)')
      .eq('competition_id', eventId)
      .order('points_earned', { ascending: false });

    if (partError) throw partError;

    const ranked = (participants || []).map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      user: p.user?.username || 'unknown',
      team: p.team?.name || null,
      points: p.points_earned || 0
    }));

    return res.status(200).json({
      event: { id: event.id, name: event.name, mode: event.mode },
      participants: ranked
    });
  } catch (error) {
    console.error('[API] Event participants error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
