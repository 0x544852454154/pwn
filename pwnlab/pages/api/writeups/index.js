import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { challengeId, page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page) || 1;
      const offset = (pageNum - 1) * (parseInt(limit) || 20);
      const limitVal = parseInt(limit) || 20;

      let query = supabaseAdmin
        .from('writeups')
        .select('id, title, content, visibility, created_at, updated_at, user:users(username), challenge:challenges(name)', { count: 'exact' })
        .eq('visibility', 'PUBLIC')
        .order('created_at', { ascending: false })
        .range(offset, offset + limitVal - 1);

      if (challengeId) {
        query = query.eq('challenge_id', parseInt(challengeId));
      }

      const { data, count, error } = await query;

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('[API] Writeups table does not exist yet');
          return res.status(200).json({
            writeups: [],
            pagination: {
              page: pageNum,
              limit: limitVal,
              total: 0,
              pages: 1
            }
          });
        }
        throw error;
      }

      return res.status(200).json({
        writeups: (data || []).map(w => ({
          id: w.id,
          title: w.title,
          content: w.content,
          visibility: w.visibility,
          created_at: w.created_at,
          updated_at: w.updated_at,
          author: w.user?.username || 'unknown',
          challenge: w.challenge?.name || null
        })),
        pagination: {
          page: pageNum,
          limit: limitVal,
          total: count || 0,
          pages: Math.ceil((count || 0) / limitVal) || 1
        }
      });
    } catch (error) {
      console.error('[API] Writeups list error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { challengeId, title, content, visibility = 'PUBLIC' } = req.body;

      if (!challengeId || !title || !content) {
        return res.status(400).json({ error: 'Challenge ID, title, and content required' });
      }

      const challId = parseInt(challengeId);
      if (isNaN(challId)) {
        return res.status(400).json({ error: 'Invalid challenge ID' });
      }

      const { data: challenge } = await supabaseAdmin
        .from('challenges')
        .select('id')
        .eq('id', challId)
        .single();

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const { data: writeup, error } = await supabaseAdmin
        .from('writeups')
        .insert({
          user_id: user.id,
          challenge_id: challId,
          title: title.trim().substring(0, 255),
          content: content.trim(),
          visibility: visibility.toUpperCase()
        })
        .select('id, title, content, visibility, created_at, updated_at')
        .single();

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return res.status(503).json({ error: 'Writeups feature is not yet available. Please try again later.' });
        }
        throw error;
      }

      return res.status(201).json({ writeup });
    } catch (error) {
      console.error('[API] Create writeup error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
