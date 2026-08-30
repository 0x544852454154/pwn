import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const eventId = parseInt(id);

  if (isNaN(eventId) || eventId <= 0) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data: event, error: eventError } = await supabaseAdmin
        .from('competitions')
        .select('id, name, description, mode, start_time, end_time, status, creator_id, created_at, creator:users(username)')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const { data: participants } = await supabaseAdmin
        .from('competition_participants')
        .select('id, user_id, team_id, points_earned, user:users(username), team:teams(name)')
        .eq('competition_id', eventId);

      const participantList = (participants || []).map(p => ({
        id: p.id,
        user: p.user?.username || 'unknown',
        team: p.team?.name || null,
        points: p.points_earned || 0
      }));

      const isParticipant = participants?.some(p => p.user_id === user.id);

      return res.status(200).json({
        event: {
          id: event.id,
          name: event.name,
          description: event.description,
          mode: event.mode,
          start_time: event.start_time,
          end_time: event.end_time,
          status: event.status,
          creator: event.creator?.username || 'unknown',
          isCreator: event.creator_id === user.id,
          isParticipant
        },
        participants: participantList
      });
    } catch (error) {
      console.error('[API] Event detail error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('competitions')
        .select('creator_id, status')
        .eq('id', eventId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (existing.creator_id !== user.id) {
        return res.status(403).json({ error: 'Only the creator can modify this event' });
      }

      const { name, description, mode, startTime, endTime, status } = req.body;

      const updates = {};
      if (typeof name === 'string') updates.name = name.trim();
      if (typeof description === 'string') updates.description = description.trim();
      if (typeof mode === 'string') updates.mode = mode.toUpperCase();
      if (typeof startTime === 'string') updates.start_time = startTime;
      if (typeof endTime === 'string') updates.end_time = endTime;
      if (typeof status === 'string') updates.status = status.toUpperCase();

      const { data, error } = await supabaseAdmin
        .from('competitions')
        .update(updates)
        .eq('id', eventId)
        .select('id, name, description, mode, start_time, end_time, status')
        .single();

      if (error) throw error;

      return res.status(200).json({ event: data });
    } catch (error) {
      console.error('[API] Update event error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('competitions')
        .select('creator_id')
        .eq('id', eventId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (existing.creator_id !== user.id) {
        return res.status(403).json({ error: 'Only the creator can delete this event' });
      }

      await supabaseAdmin.from('competitions').delete().eq('id', eventId);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API] Delete event error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
