const { supabaseAdmin } = require('../../../lib/db');
const { requireAuth, sanitizeError } = require('../../../lib/api-middleware');

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

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { data: profileRecord } = await supabaseAdmin
        .from('profiles')
        .select('bio')
        .eq('user_id', user.id)
        .single();

      const meta = parseProfileMeta(profileRecord?.bio);
      const friendUsernames = meta.friends;

      if (friendUsernames.length === 0) {
        return res.status(200).json({ friends: [], friendsUsernames: [] });
      }

      const { data: friendUsers } = await supabaseAdmin
        .from('users')
        .select('id, username, created_at')
        .in('username', friendUsernames);

      const [completionsRes, submissionsRes] = await Promise.all([
        supabaseAdmin.from('challenge_completions').select('user_id, points_earned, completed_at, challenge:challenges(name, points)'),
        supabaseAdmin.from('challenge_submissions').select('user_id, is_correct')
      ]);

      const completionsByUser = {};
      for (const c of (completionsRes.data || [])) {
        if (!completionsByUser[c.user_id]) completionsByUser[c.user_id] = [];
        completionsByUser[c.user_id].push(c);
      }

      const submissionsByUser = {};
      for (const s of (submissionsRes.data || [])) {
        if (!submissionsByUser[s.user_id]) submissionsByUser[s.user_id] = { total: 0, correct: 0 };
        submissionsByUser[s.user_id].total += 1;
        if (s.is_correct) submissionsByUser[s.user_id].correct += 1;
      }

      const friendCards = (friendUsers || []).map((fUser) => {
        const userCompletions = completionsByUser[fUser.id] || [];
        const userSubs = submissionsByUser[fUser.id] || { total: 0, correct: 0 };

        const totalPoints = userCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0);
        const successRate = userSubs.total > 0 ? Math.round((userSubs.correct / userSubs.total) * 100) : 0;
        const recentSolves = userCompletions
          .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
          .slice(0, 3)
          .map(c => ({
            name: c.challenge?.name || 'Challenge',
            points: c.points_earned,
            completed_at: c.completed_at
          }));

        return {
          id: fUser.id,
          username: fUser.username,
          totalPoints,
          challengesCompleted: userCompletions.length,
          successRate,
          recentSolves,
          memberSince: fUser.created_at
        };
      });

      return res.status(200).json({
        friends: friendCards,
        friendsUsernames: friendUsernames
      });
    } catch (error) {
      console.error('[API] Friends list error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { targetUsername, action } = req.body;
      if (!targetUsername || typeof targetUsername !== 'string') {
        return res.status(400).json({ error: 'Target username is required' });
      }

      const cleanTarget = targetUsername.trim().toLowerCase();
      if (cleanTarget === user.username.toLowerCase()) {
        return res.status(400).json({ error: 'You cannot add yourself as a friend' });
      }

      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .eq('username', cleanTarget)
        .single();

      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }

      const { data: profileRecord } = await supabaseAdmin
        .from('profiles')
        .select('bio')
        .eq('user_id', user.id)
        .single();

      const meta = parseProfileMeta(profileRecord?.bio);
      const friendsSet = new Set(meta.friends.map(f => f.toLowerCase()));

      let isFriend = false;
      if (action === 'remove' || (action === 'toggle' && friendsSet.has(cleanTarget))) {
        friendsSet.delete(cleanTarget);
        isFriend = false;
      } else {
        friendsSet.add(cleanTarget);
        isFriend = true;
      }

      meta.friends = Array.from(friendsSet);
      const serializedMeta = JSON.stringify(meta);

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ bio: serializedMeta, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update friends list' });
      }

      return res.status(200).json({
        success: true,
        targetUsername: targetUser.username,
        isFriend,
        friends: meta.friends
      });
    } catch (error) {
      console.error('[API] Friends update error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
