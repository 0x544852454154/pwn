import https from 'https';

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

function getDiscordBannerUrl(discordId, bannerHash) {
  if (!bannerHash) return null;
  const ext = bannerHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${discordId}/${bannerHash}.${ext}?size=600`;
}

function getDiscordAvatarUrl(discordId, avatarHash) {
  if (!avatarHash) {
    const defaultIndex = discordId ? (BigInt(discordId) >> 22n) % 6n : 0n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }
  const ext = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=256`;
}

export async function fetchDiscordUser(discordId, botToken = null) {
  if (!discordId) return null;

  const result = {
    discord_id: discordId,
    username: null,
    global_name: null,
    avatarUrl: getDiscordAvatarUrl(discordId, null),
    bannerUrl: getDiscordBannerUrl(discordId, null),
    status: 'offline',
    custom_status: null,
    custom_status_emoji: null,
    activities: [],
    spotify: null,
  };

  const lanyardRes = await fetchJSON(`https://api.lanyard.rest/v1/users/${discordId}`);
  if (lanyardRes.ok && lanyardRes.data?.success && lanyardRes.data?.data) {
    const d = lanyardRes.data.data;
    const u = d.discord_user || {};

    result.username = u.username || result.username;
    result.global_name = u.global_name || u.display_name || u.username || result.global_name;
    result.avatarUrl = getDiscordAvatarUrl(discordId, u.avatar);
    result.bannerUrl = getDiscordBannerUrl(discordId, u.banner);
    result.status = d.discord_status || 'offline';

    const customActivity = d.activities ? d.activities.find(a => a.type === 4 || a.id === 'custom') : null;
    result.custom_status = customActivity ? (customActivity.state || '') : null;
    result.custom_status_emoji = customActivity && customActivity.emoji ? customActivity.emoji.name : null;

    result.activities = d.activities ? d.activities.filter(a => a.type !== 4 && a.id !== 'custom').map(a => ({
      name: a.name,
      details: a.details,
      state: a.state,
      platform: a.platform,
    })) : [];

    result.spotify = d.listening_to_spotify ? { title: d.spotify.song, artist: d.spotify.artist } : null;

    return result;
  }

  if (botToken) {
    const discordRes = await fetchJSON(`https://discord.com/api/v10/users/${discordId}`, {
      Authorization: `Bot ${botToken}`,
    });

    if (discordRes.ok && discordRes.data) {
      const u = discordRes.data;
      result.username = u.username || result.username;
      result.global_name = u.global_name || u.display_name || u.username || result.global_name;
      result.avatarUrl = getDiscordAvatarUrl(discordId, u.avatar);
      result.bannerUrl = getDiscordBannerUrl(discordId, u.banner);
      return result;
    }
  }

  return result;
}
