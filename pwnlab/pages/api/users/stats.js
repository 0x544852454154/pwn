import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const [
      completionsRes,
      submissionsRes,
      challengesRes,
      allCompletionsRes,
      profileRes
    ] = await Promise.all([
      supabaseAdmin
        .from('challenge_completions')
        .select('id, challenge_id, points_earned, completed_at, challenge:challenges(id, name, difficulty, points, estimated_time, category:challenge_categories(name))')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false }),
      supabaseAdmin
        .from('challenge_submissions')
        .select('is_correct')
        .eq('user_id', user.id),
      supabaseAdmin
        .from('challenges')
        .select('id, name, category:challenge_categories(name)')
        .in('visibility', ['PUBLIC', 'TEAM ONLY']),
      supabaseAdmin
        .from('challenge_completions')
        .select('user_id, points_earned'),
      supabaseAdmin
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single()
    ]);

    const profile = profileRes.data || {};
    const currentStreak = profile.current_streak || 0;
    const longestStreak = profile.longest_streak || 0;

    const completions = completionsRes.data || [];
    const totalCompleted = completions.length;
    const totalPoints = completions.reduce((acc, c) => acc + (c.points_earned || 0), 0);

    let totalTime = 0;
    let timeCount = 0;
    for (const c of completions) {
      if (c.challenge?.estimated_time) {
        totalTime += c.challenge.estimated_time;
        timeCount++;
      }
    }
    const avgSolveTime = timeCount > 0 ? Math.round(totalTime / timeCount) : 0;

    const submissions = submissionsRes.data || [];
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(s => s.is_correct).length;
    const successRate = totalSubmissions > 0
      ? Math.round((correctSubmissions / totalSubmissions) * 100)
      : 0;

    const userScores = {};
    for (const row of (allCompletionsRes.data || [])) {
      userScores[row.user_id] = (userScores[row.user_id] || 0) + (row.points_earned || 0);
    }
    let rank = 1;
    for (const [uid, score] of Object.entries(userScores)) {
      if (uid !== user.id && score > totalPoints) {
        rank++;
      }
    }

    const completedChallengeIds = new Set(completions.map(c => c.challenge_id));
    const allChallenges = challengesRes.data || [];
    const categoryStats = {};

    for (const ch of allChallenges) {
      const catName = ch.category?.name || 'GENERAL';
      if (!categoryStats[catName]) {
        categoryStats[catName] = { category: catName, total: 0, completed: 0 };
      }
      categoryStats[catName].total += 1;
      if (completedChallengeIds.has(ch.id)) {
        categoryStats[catName].completed += 1;
      }
    }

    const byCategory = Object.values(categoryStats).sort((a, b) =>
      a.category.localeCompare(b.category)
    );

    const recentChallenges = completions.slice(0, 5).map(c => ({
      id: c.challenge?.id || c.challenge_id,
      name: c.challenge?.name || `Challenge #${c.challenge_id}`,
      difficulty: c.challenge?.difficulty || 'EASY',
      points: c.challenge?.points || c.points_earned,
      completed_at: c.completed_at
    }));

    return res.status(200).json({
      stats: {
        challengesCompleted: totalCompleted,
        ctfPoints: totalPoints,
        successRate,
        averageSolveTime: avgSolveTime,
        rank,
        submissionsCorrect: correctSubmissions,
        submissionsTotal: totalSubmissions,
        currentStreak,
        longestStreak
      },
      byCategory,
      recentChallenges,
    });
  } catch (error) {
    console.error('[API] Stats error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
