import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { data: notes, error } = await supabaseAdmin
        .from('user_notes')
        .select('id, content, updated_at, created_at, challenge_id, challenge:challenges(id, name)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[API] Notes fetch error');
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      const formattedNotes = (notes || []).map(n => ({
        id: n.id,
        content: n.content,
        updated_at: n.updated_at,
        created_at: n.created_at,
        challenge_id: n.challenge?.id || n.challenge_id,
        challenge_name: n.challenge?.name || `Challenge #${n.challenge_id}`
      }));

      return res.status(200).json({ notes: formattedNotes });
    } catch (error) {
      console.error('[API] Notes list error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { challengeId, content } = req.body;
      const challId = parseInt(challengeId);

      if (isNaN(challId) || challId <= 0) {
        return res.status(400).json({ error: 'Valid challenge ID required' });
      }

      const safeContent = typeof content === 'string' ? content.substring(0, 10000) : '';

      const { data: existingNote } = await supabaseAdmin
        .from('user_notes')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', challId)
        .maybeSingle();

      let savedNote;
      if (existingNote) {
        const updateRes = await supabaseAdmin
          .from('user_notes')
          .update({
            content: safeContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id)
          .select('id, content, updated_at')
          .single();

        if (updateRes.error) {
          return res.status(500).json({ error: 'Failed to update note' });
        }
        savedNote = updateRes.data;
      } else {
        const insertRes = await supabaseAdmin
          .from('user_notes')
          .insert({
            user_id: user.id,
            challenge_id: challId,
            content: safeContent
          })
          .select('id, content, updated_at')
          .single();

        if (insertRes.error) {
          return res.status(500).json({ error: 'Failed to insert note' });
        }
        savedNote = insertRes.data;
      }

      return res.status(200).json({ success: true, note: savedNote });
    } catch (error) {
      console.error('[API] Notes save error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
