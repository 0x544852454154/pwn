import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const [eventsRes, participantsRes] = await Promise.all([
        supabaseAdmin
          .from('competitions')
          .select('id, name, description, mode, start_time, end_time, status, creator_id, created_at, creator:users(username)')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('competition_participants')
          .select('competition_id, user_id, team_id, points_earned')
          .eq('user_id', user.id)
      ]);

      const events = (eventsRes.data || []).map(e => {
        const participant = participantsRes.data?.find(p => p.competition_id === e.id);
        return {
          id: e.id,
          name: e.name,
          description: e.description,
          mode: e.mode,
          start_time: e.start_time,
          end_time: e.end_time,
          status: e.status,
          creator: e.creator?.username || 'unknown',
          isParticipant: !!participant,
          participantPoints: participant?.points_earned || 0
        };
      });

      return res.status(200).json({ events });
    } catch (error) {
      console.error('[API] Events list error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, mode = 'TEAM', startTime, endTime } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 3) {
        return res.status(400).json({ error: 'Event name must be at least 3 characters' });
      }

      const { data: event, error } = await supabaseAdmin
        .from('competitions')
        .insert({
          name: name.trim(),
          description: (description || '').trim(),
          mode: mode.toUpperCase(),
          start_time: startTime || null,
          end_time: endTime || null,
          creator_id: user.id,
          status: 'SCHEDULED'
        })
        .select('id, name, description, mode, start_time, end_time, status')
        .single();

      if (error) throw error;

      await supabaseAdmin.from('competition_participants').insert({
        competition_id: event.id,
        user_id: user.id,
        points_earned: 0
      });

      return res.status(201).json({ event });
    } catch (error) {
      console.error('[API] Create event error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
