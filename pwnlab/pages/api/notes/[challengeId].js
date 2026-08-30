import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { challengeId } = req.query;
    const challId = parseInt(challengeId);

    if (isNaN(challId) || challId <= 0) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const { data: note, error } = await supabaseAdmin
      .from('user_notes')
      .select('id, content, updated_at, challenge:challenges(name)')
      .eq('user_id', user.id)
      .eq('challenge_id', challId)
      .maybeSingle();

    if (error) {
      console.error('[API] Note query error');
      return res.status(500).json({ error: 'Failed to fetch note' });
    }

    return res.status(200).json({
      note: note ? {
        id: note.id,
        content: note.content,
        updated_at: note.updated_at,
        challenge_name: note.challenge?.name
      } : null
    });
  } catch (error) {
    console.error('[API] Note fetch error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
