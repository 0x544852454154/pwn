import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const challengeId = parseInt(id);

  if (isNaN(challengeId) || challengeId <= 0) {
    return res.status(400).json({ error: 'Invalid challenge ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data: challenge, error } = await supabaseAdmin
        .from('challenges')
        .select('id, name, description, category_id, difficulty, points, estimated_time, flag, visibility, creator_id, category:challenge_categories(name)')
        .eq('id', challengeId)
        .single();

      if (error || !challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      if (challenge.creator_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this challenge' });
      }

      const { data: objectives } = await supabaseAdmin
        .from('challenge_objectives')
        .select('id, objective, order_num')
        .eq('challenge_id', challengeId)
        .order('order_num', { ascending: true });

      const { data: hints } = await supabaseAdmin
        .from('challenge_hints')
        .select('id, hint_text, point_penalty, order_num')
        .eq('challenge_id', challengeId)
        .order('order_num', { ascending: true });

      return res.status(200).json({
        challenge: {
          ...challenge,
          category: challenge.category?.name || 'GENERAL',
          objectives: objectives || [],
          hints: hints || []
        }
      });
    } catch (error) {
      console.error('[API] Challenge edit fetch error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, category, difficulty, points, estimatedTime, flag, visibility, objectives = [], hints = [] } = req.body;

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('challenges')
        .select('creator_id')
        .eq('id', challengeId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      if (existing.creator_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this challenge' });
      }

      const categoryName = typeof category === 'string' ? category.toUpperCase() : null;
      let categoryId = null;
      if (categoryName) {
        const { data: catRow } = await supabaseAdmin
          .from('challenge_categories')
          .select('id')
          .ilike('name', categoryName)
          .maybeSingle();
        categoryId = catRow?.id || null;
      }

      const updates = {};
      if (typeof name === 'string') updates.name = name.trim().substring(0, 255);
      if (typeof description === 'string') updates.description = description.trim();
      if (categoryId) updates.category_id = categoryId;
      if (typeof difficulty === 'string') updates.difficulty = difficulty.toUpperCase();
      if (typeof points !== 'undefined') updates.points = parseInt(points) || 0;
      if (typeof estimatedTime !== 'undefined') updates.estimated_time = parseInt(estimatedTime) || null;
      if (typeof flag === 'string') updates.flag = flag.trim();
      if (typeof visibility === 'string') updates.visibility = visibility.toUpperCase();

      const { data: challenge, error } = await supabaseAdmin
        .from('challenges')
        .update(updates)
        .eq('id', challengeId)
        .select('id, name, description, difficulty, points, estimated_time, visibility')
        .single();

      if (error) throw error;

      if (objectives.length > 0) {
        await supabaseAdmin.from('challenge_objectives').delete().eq('challenge_id', challengeId);
        const objRows = objectives.map((obj, idx) => ({
          challenge_id: challengeId,
          objective: obj.trim(),
          order_num: idx + 1
        })).filter(o => o.objective);

        if (objRows.length > 0) {
          await supabaseAdmin.from('challenge_objectives').insert(objRows);
        }
      }

      if (hints.length > 0) {
        await supabaseAdmin.from('challenge_hints').delete().eq('challenge_id', challengeId);
        const hintRows = hints.map((hint, idx) => ({
          challenge_id: challengeId,
          hint_text: hint.text?.trim() || '',
          point_penalty: parseInt(hint.penalty) || 0,
          order_num: idx + 1
        })).filter(h => h.hint_text);

        if (hintRows.length > 0) {
          await supabaseAdmin.from('challenge_hints').insert(hintRows);
        }
      }

      return res.status(200).json({ challenge });
    } catch (error) {
      console.error('[API] Update challenge error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('challenges')
        .select('creator_id')
        .eq('id', challengeId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      if (existing.creator_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this challenge' });
      }

      await supabaseAdmin.from('challenges').delete().eq('id', challengeId);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API] Delete challenge error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
