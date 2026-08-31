import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { category, difficulty, status, search, page = 1 } = req.query;
    const limit = 20;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limit;

    let queryBuilder = supabaseAdmin
      .from('challenges')
      .select('id, name, description, difficulty, points, estimated_time, category_id, category:challenge_categories(name), completions:challenge_completions(id, user_id)', { count: 'exact' })
      .in('visibility', ['PUBLIC', 'TEAM ONLY']);

    if (category) {
      const cleanCat = category.trim();
      const { data: catData } = await supabaseAdmin
        .from('challenge_categories')
        .select('id')
        .ilike('name', cleanCat)
        .maybeSingle();

      if (catData?.id) {
        queryBuilder = queryBuilder.eq('category_id', catData.id);
      }
    }

    if (difficulty) {
      const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'INSANE'];
      const upperDifficulty = difficulty.toUpperCase();
      if (validDifficulties.includes(upperDifficulty)) {
        queryBuilder = queryBuilder.eq('difficulty', upperDifficulty);
      }
    }

    if (search) {
      const sanitizedSearch = search.replace(/[%_]/g, '').substring(0, 100);
      queryBuilder = queryBuilder.ilike('name', `%${sanitizedSearch}%`);
    }

    queryBuilder = queryBuilder
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: rawChallenges, count: totalCount, error } = await queryBuilder;

    if (error) {
      console.error('[API] Challenges query error', error);
      return res.status(500).json({ error: 'Failed to fetch challenges' });
    }

    let challenges = (rawChallenges || []).map((c) => {
      const solves = c.completions?.length || 0;
      const isCompleted = c.completions?.some((comp) => comp.user_id === user.id) || false;
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        difficulty: c.difficulty,
        points: c.points,
        estimated_time: c.estimated_time,
        category: c.category?.name || 'GENERAL',
        solves,
        is_completed: isCompleted,
      };
    });

    if (status === 'completed') {
      challenges = challenges.filter((c) => c.is_completed);
    } else if (status === 'not-completed') {
      challenges = challenges.filter((c) => !c.is_completed);
    }

    const total = totalCount !== null && totalCount !== undefined ? totalCount : challenges.length;

    return res.status(200).json({
      challenges,
      pagination: {
        page: pageNum,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[API] Challenges error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
