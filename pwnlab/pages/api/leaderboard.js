import { supabaseAdmin } from '../../lib/db';
import { getCookie } from '../../lib/cookies';
import { getCurrentUser } from '../../lib/auth';
import { sanitizeError, getClientIp } from '../../lib/api-middleware';

import https from 'https';

function fetchJSON(url, headers = {}, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: JSON.parse(data) });
        } catch {
          resolve({ ok: false, data: null });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, data: null });
    });

    req.on('error', () => {
      resolve({ ok: false, data: null });
    });
  });
}

async function getDiscordAvatar(discordId) {
  if (!discordId) return null;

  try {
    const lanyardRes = await fetchJSON('https://api.lanyard.rest/v1/users/' + discordId);
    if (lanyardRes.ok && lanyardRes.data && lanyardRes.data.success && lanyardRes.data.data) {
      const u = lanyardRes.data.data.discord_user || {};
      if (u.avatar) {
        const ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
        return {
          avatarUrl: 'https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.' + ext + '?size=128',
          status: lanyardRes.data.data.discord_status || 'offline'
        };
      }
    }
  } catch {}

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
        const discordInfo = entry.discord_id ? await getDiscordAvatar(entry.discord_id) : null;
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
