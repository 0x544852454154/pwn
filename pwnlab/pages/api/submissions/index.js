import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * (parseInt(limit) || 20);
    const limitVal = parseInt(limit) || 20;

    const [submissionsRes, totalRes] = await Promise.all([
      supabaseAdmin
        .from('challenge_submissions')
        .select('id, flag_submitted, is_correct, submitted_at, challenge:challenges(id, name, difficulty, points, category:challenge_categories(name))')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limitVal - 1),
      supabaseAdmin
        .from('challenge_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
    ]);

    const submissions = (submissionsRes.data || []).map(s => ({
      id: s.id,
      flag: s.flag_submitted,
      is_correct: s.is_correct,
      submitted_at: s.submitted_at,
      challenge: s.challenge ? {
        id: s.challenge.id,
        name: s.challenge.name,
        difficulty: s.challenge.difficulty,
        points: s.challenge.points,
        category: s.challenge.category?.name || 'GENERAL'
      } : null
    }));

    return res.status(200).json({
      submissions,
      pagination: {
        page: pageNum,
        limit: limitVal,
        total: totalRes.count || 0,
        pages: Math.ceil((totalRes.count || 0) / limitVal) || 1
      }
    });
  } catch (error) {
    console.error('[API] Submissions error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
