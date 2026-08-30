import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { id } = req.query;
    const challengeId = parseInt(id);

    if (isNaN(challengeId) || challengeId <= 0) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const { data: c, error: challError } = await supabaseAdmin
      .from('challenges')
      .select('id, name, description, difficulty, points, estimated_time, storage_path, category:challenge_categories(name), completions:challenge_completions(id, user_id)')
      .eq('id', challengeId)
      .single();

    if (challError || !c) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const solves = c.completions?.length || 0;
    const isCompleted = c.completions?.some((comp) => comp.user_id === user.id) || false;

    const [objectivesRes, hintsRes] = await Promise.all([
      supabaseAdmin.from('challenge_objectives').select('id, objective').eq('challenge_id', challengeId).order('order_num', { ascending: true }),
      supabaseAdmin.from('challenge_hints').select('id, hint_text, point_penalty').eq('challenge_id', challengeId).order('order_num', { ascending: true })
    ]);

    return res.status(200).json({
      challenge: {
        id: c.id,
        name: c.name,
        description: c.description,
        difficulty: c.difficulty,
        points: c.points,
        estimated_time: c.estimated_time,
        category: c.category?.name || 'GENERAL',
        solves,
        is_completed: isCompleted,
        objectives: objectivesRes.data || [],
        hints: hintsRes.data || [],
      },
    });
  } catch (error) {
    console.error('[API] Challenge detail error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
