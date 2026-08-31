import { getCurrentUser } from '../../../lib/auth';
import { getCookie } from '../../../lib/cookies';
import { apiRateLimit } from '../../../lib/api-middleware';
import { supabaseAdmin } from '../../../lib/db';

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
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getCurrentUser(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    let avatarUrl = null;
    try {
      const { data: discordAcc } = await supabaseAdmin
        .from('discord_accounts')
        .select('discord_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (discordAcc?.discord_id) {
        const { getDiscordAvatarUrl } = await import('../../../lib/discord-presence');
        avatarUrl = getDiscordAvatarUrl(discordAcc.discord_id, null);
      }
    } catch (e) {
      // Discord not linked
    }

    return res.status(200).json({ user, avatarUrl });
  } catch (error) {
    console.error('[API] Auth check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
