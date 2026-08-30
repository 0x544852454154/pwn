import https from 'https';
import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

function fetchJSON(url, headers = {}, timeoutMs = 3000) {
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

function parseProfileMeta(rawBio) {
  if (!rawBio) return { bio: '', banner_url: null, friends: [] };
  try {
    const parsed = JSON.parse(rawBio);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        bio: typeof parsed.bio === 'string' ? parsed.bio : '',
        banner_url: typeof parsed.banner_url === 'string' ? parsed.banner_url : null,
        friends: Array.isArray(parsed.friends) ? parsed.friends : []
      };
    }
  } catch {}
  return { bio: rawBio, banner_url: null, friends: [] };
}

function sanitizeBannerUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed.substring(0, 500);
  }
  return null;
}

async function getDiscordPresence(discordId) {
  if (!discordId) return null;

  try {
    const lanyardRes = await fetchJSON('https://api.lanyard.rest/v1/users/' + discordId);
    if (lanyardRes.ok && lanyardRes.data && lanyardRes.data.success && lanyardRes.data.data) {
      const d = lanyardRes.data.data;
      const u = d.discord_user || {};

      let avatarUrl = null;
      if (u.avatar) {
        const ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
        avatarUrl = 'https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.' + ext + '?size=256';
      } else {
        avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
      }

      const customActivity = d.activities ? d.activities.find(a => a.type === 4 || a.id === 'custom') : null;
      const richActivities = d.activities ? d.activities.filter(a => a.type !== 4 && a.id !== 'custom') : [];

      return {
        discord_id: u.id,
        username: u.username,
        global_name: u.global_name || u.display_name || u.username,
        avatarUrl,
        status: d.discord_status || 'offline',
        custom_status: customActivity ? (customActivity.state || '') : null,
        custom_status_emoji: customActivity && customActivity.emoji ? customActivity.emoji.name : null,
        activities: richActivities.map(a => ({
          name: a.name,
          details: a.details,
          state: a.state,
          platform: a.platform
        })),
        spotify: d.listening_to_spotify ? { title: d.spotify.song, artist: d.spotify.artist } : null,
        source: 'lanyard'
      };
    }
  } catch {}

  return null;
}

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'PUT' || req.method === 'PATCH' || (req.method === 'POST' && req.body?.action)) {
    const { bio, banner_url } = req.body;

    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('bio')
      .eq('user_id', user.id)
      .single();

    const meta = parseProfileMeta(currentProfile?.bio);

    if (typeof bio === 'string') {
      meta.bio = bio.substring(0, 500);
    }

    if (typeof banner_url !== 'undefined') {
      meta.banner_url = sanitizeBannerUrl(banner_url);
    }

    const serialized = JSON.stringify(meta);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ bio: serialized, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({
      success: true,
      bio: meta.bio,
      banner_url: meta.banner_url,
      friends: meta.friends
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.query;
    const targetUsername = (username || user.username).trim().toLowerCase();

    const { data: profileUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, created_at')
      .eq('username', targetUsername)
      .single();

    if (userError || !profileUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [
      profileRes,
      discordRes,
      completionsRes,
      submissionsRes,
      allCompletionsRes,
      teamMemberRes,
      currentUserProfileRes
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('bio, rank_title').eq('user_id', profileUser.id).single(),
      supabaseAdmin.from('discord_accounts').select('discord_id, username').eq('user_id', profileUser.id).single(),
      supabaseAdmin.from('challenge_completions').select('points_earned, challenge:challenges(category:challenge_categories(name))').eq('user_id', profileUser.id),
      supabaseAdmin.from('challenge_submissions').select('is_correct').eq('user_id', profileUser.id),
      supabaseAdmin.from('challenge_completions').select('user_id, points_earned'),
      supabaseAdmin.from('team_members').select('team:teams(id, name)').eq('user_id', profileUser.id).maybeSingle(),
      supabaseAdmin.from('profiles').select('bio').eq('user_id', user.id).single()
    ]);

    const meta = parseProfileMeta(profileRes.data?.bio);
    const currentUserMeta = parseProfileMeta(currentUserProfileRes.data?.bio);
    const isFriend = currentUserMeta.friends.includes(profileUser.username.toLowerCase());

    const discordPresence = discordRes.data?.discord_id
      ? await getDiscordPresence(discordRes.data.discord_id)
      : null;

    const completions = completionsRes.data || [];
    const challengesCompleted = completions.length;
    const totalPoints = completions.reduce((acc, c) => acc + (c.points_earned || 0), 0);

    const submissions = submissionsRes.data || [];
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(s => s.is_correct).length;
    const successRate = totalSubmissions > 0
      ? Math.round((correctSubmissions / totalSubmissions) * 100)
      : 0;

    const catCounts = {};
    for (const c of completions) {
      const catName = c.challenge?.category?.name;
      if (catName) {
        catCounts[catName] = (catCounts[catName] || 0) + 1;
      }
    }
    const specialties = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);

    const userScores = {};
    for (const row of (allCompletionsRes.data || [])) {
      userScores[row.user_id] = (userScores[row.user_id] || 0) + (row.points_earned || 0);
    }
    let rank = 1;
    for (const [uid, score] of Object.entries(userScores)) {
      if (uid !== profileUser.id && score > totalPoints) {
        rank++;
      }
    }

    return res.status(200).json({
      profile: {
        id: profileUser.id,
        username: profileUser.username,
        memberSince: profileUser.created_at,
        bio: meta.bio,
        banner_url: meta.banner_url,
        friendsCount: meta.friends.length,
        isFriend,
        challengesCompleted,
        totalPoints,
        successRate,
        rank,
        specialties,
        team: teamMemberRes.data?.team || null,
        isOwnProfile: profileUser.id === user.id,
        discord: discordPresence,
      },
    });
  } catch (error) {
    console.error('[API] Profile error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
