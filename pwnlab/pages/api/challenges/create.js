import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { name, description, category, difficulty, points, estimatedTime, flag, visibility = 'PUBLIC', objectives = [], hints = [] } = req.body;

    if (!name || !description || !difficulty || !points || !flag) {
      return res.status(400).json({ error: 'Missing required fields: name, description, difficulty, points, flag' });
    }

    const categoryName = typeof category === 'string' ? category.toUpperCase() : 'GENERAL';
    const { data: categoryRow } = await supabaseAdmin
      .from('challenge_categories')
      .select('id')
      .ilike('name', categoryName)
      .maybeSingle();

    const categoryId = categoryRow?.id || null;

    const { data: challenge, error } = await supabaseAdmin
      .from('challenges')
      .insert({
        name: name.trim().substring(0, 255),
        description: description.trim(),
        category_id: categoryId,
        difficulty: difficulty.toUpperCase(),
        points: parseInt(points) || 0,
        estimated_time: parseInt(estimatedTime) || null,
        flag: flag.trim(),
        creator_id: user.id,
        visibility: visibility.toUpperCase()
      })
      .select('id, name, description, difficulty, points, estimated_time, visibility')
      .single();

    if (error) throw error;

    if (objectives.length > 0) {
      const objRows = objectives.map((obj, idx) => ({
        challenge_id: challenge.id,
        objective: obj.trim(),
        order_num: idx + 1
      })).filter(o => o.objective);

      if (objRows.length > 0) {
        await supabaseAdmin.from('challenge_objectives').insert(objRows);
      }
    }

    if (hints.length > 0) {
      const hintRows = hints.map((hint, idx) => ({
        challenge_id: challenge.id,
        hint_text: hint.text?.trim() || '',
        point_penalty: parseInt(hint.penalty) || 0,
        order_num: idx + 1
      })).filter(h => h.hint_text);

      if (hintRows.length > 0) {
        await supabaseAdmin.from('challenge_hints').insert(hintRows);
      }
    }

    return res.status(201).json({ challenge });
  } catch (error) {
    console.error('[API] Create challenge error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
