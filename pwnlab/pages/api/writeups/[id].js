import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const writeupId = parseInt(id);

  if (isNaN(writeupId) || writeupId <= 0) {
    return res.status(400).json({ error: 'Invalid writeup ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('writeups')
        .select('id, title, content, visibility, created_at, updated_at, user:users(username), challenge:challenges(name, id)')
        .eq('id', writeupId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Writeup not found' });
      }

      const isAuthor = data.user_id === user.id;
      if (data.visibility !== 'PUBLIC' && !isAuthor) {
        return res.status(403).json({ error: 'This writeup is private' });
      }

      return res.status(200).json({
        writeup: {
          id: data.id,
          title: data.title,
          content: data.content,
          visibility: data.visibility,
          created_at: data.created_at,
          updated_at: data.updated_at,
          author: data.user?.username || 'unknown',
          challenge: data.challenge,
          isAuthor
        }
      });
    } catch (error) {
      console.error('[API] Writeup detail error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { title, content, visibility } = req.body;

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('writeups')
        .select('user_id')
        .eq('id', writeupId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Writeup not found' });
      }

      if (existing.user_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this writeup' });
      }

      const updates = {};
      if (typeof title === 'string') updates.title = title.trim().substring(0, 255);
      if (typeof content === 'string') updates.content = content.trim();
      if (typeof visibility === 'string') updates.visibility = visibility.toUpperCase();

      const { data, error } = await supabaseAdmin
        .from('writeups')
        .update(updates)
        .eq('id', writeupId)
        .select('id, title, content, visibility, created_at, updated_at')
        .single();

      if (error) throw error;

      return res.status(200).json({ writeup: data });
    } catch (error) {
      console.error('[API] Update writeup error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('writeups')
        .select('user_id')
        .eq('id', writeupId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Writeup not found' });
      }

      if (existing.user_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this writeup' });
      }

      await supabaseAdmin.from('writeups').delete().eq('id', writeupId);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API] Delete writeup error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
