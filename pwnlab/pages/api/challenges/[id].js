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
      .select('id, name, description, difficulty, points, estimated_time, category:challenge_categories(name)')
      .eq('id', challengeId)
      .single();

    let challengeData = c;
    let selectError = challError;

    if (challError) {
      const retrySelect = 'id, name, description, difficulty, points, estimated_time, category:challenge_categories(name)';
      const retry = await supabaseAdmin
        .from('challenges')
        .select(retrySelect)
        .eq('id', challengeId)
        .single();
      challengeData = retry.data;
      selectError = retry.error;
    }

    if (selectError || !challengeData) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Fetch completion history separately (avoids nested-select coercion issues).
    const { data: completions, error: compError } = await supabaseAdmin
      .from('challenge_completions')
      .select('user_id, completed_at')
      .eq('challenge_id', challengeId)
      .order('completed_at', { ascending: true });

    const solves = (completions || []).length;
    const isCompleted = (completions || []).some((comp) => comp.user_id === user.id);

    // Derive first blood from the completions table (earliest completed_at),
    // since the challenge row has no first_blood_* columns in this instance.
    let firstBlood = null;
    if (completions && completions.length > 0 && completions[0].completed_at) {
      firstBlood = {
        userId: completions[0].user_id,
        username: null,
        timestamp: completions[0].completed_at,
      };
    }

    const [objectivesRes, hintsRes] = await Promise.all([
      supabaseAdmin.from('challenge_objectives').select('id, objective').eq('challenge_id', challengeId).order('order_num', { ascending: true }),
      supabaseAdmin.from('challenge_hints').select('id, hint_text, point_penalty').eq('challenge_id', challengeId).order('order_num', { ascending: true })
    ]);

    if (firstBlood && !firstBlood.username) {
      const { data: fbUser } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', firstBlood.userId)
        .single();
      firstBlood.username = fbUser?.username || 'unknown';
    }

    return res.status(200).json({
      challenge: {
         id: challengeData.id,
         name: challengeData.name,
         description: challengeData.description,
         difficulty: challengeData.difficulty,
         points: challengeData.points,
         estimated_time: challengeData.estimated_time,
         category: challengeData.category?.name || 'GENERAL',
        solves,
        is_completed: isCompleted,
        first_blood: firstBlood,
        objectives: objectivesRes.data || [],
        hints: hintsRes.data || [],
      },
    });
  } catch (error) {
    console.error('[API] Challenge detail error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
