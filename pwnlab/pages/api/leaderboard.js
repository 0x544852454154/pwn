import { supabaseAdmin } from '../../lib/db';
import { getCookie } from '../../lib/cookies';
import { getCurrentUser } from '../../lib/auth';
import { sanitizeError, getClientIp, apiRateLimit } from '../../lib/api-middleware';
import { fetchDiscordUser } from '../../lib/discord-presence';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await apiRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  try {
    const token = getCookie(req, 'pwnlab_token');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const currentUser = await getCurrentUser(token);
    if (!currentUser) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { type = 'global' } = req.query;

    const [usersRes, completionsRes, discordRes] = await Promise.all([
      supabaseAdmin.from('users').select('id, username'),
      supabaseAdmin.from('challenge_completions').select('user_id, challenge_id, points_earned'),
      supabaseAdmin.from('discord_accounts').select('user_id, discord_id')
    ]);

    const users = usersRes.data || [];
    const completions = completionsRes.data || [];
    const discordMap = {};
    for (const d of (discordRes.data || [])) {
      discordMap[d.user_id] = d;
    }

    const statsByUser = {};
    for (const u of users) {
      statsByUser[u.id] = {
        id: u.id,
        username: u.username,
        discord_id: discordMap[u.id]?.discord_id || null,
        total_points: 0,
        challenges_completed: 0,
        completed_set: new Set(),
        isSelf: u.id === currentUser.id
      };
    }

    for (const c of completions) {
      if (statsByUser[c.user_id]) {
        statsByUser[c.user_id].total_points += (c.points_earned || 0);
        if (!statsByUser[c.user_id].completed_set.has(c.challenge_id)) {
          statsByUser[c.user_id].completed_set.add(c.challenge_id);
          statsByUser[c.user_id].challenges_completed += 1;
        }
      }
    }

    const sortedLeaderboard = Object.values(statsByUser)
      .sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return a.username.localeCompare(b.username);
      })
      .slice(0, 100);

    const leaderboardWithAvatars = await Promise.all(
      sortedLeaderboard.map(async (entry, index) => {
        const discordInfo = entry.discord_id ? await fetchDiscordUser(entry.discord_id, process.env.DISCORD_TOKEN) : null;
        return {
          rank: index + 1,
          id: entry.id,
          username: entry.username,
          avatarUrl: discordInfo?.avatarUrl || null,
          status: discordInfo?.status || 'offline',
          total_points: entry.total_points,
          challenges_completed: entry.challenges_completed,
          isSelf: entry.isSelf
        };
      })
    );

    return res.status(200).json({
      leaderboard: leaderboardWithAvatars,
      type,
    });
  } catch (error) {
    console.error('[API] Leaderboard error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
