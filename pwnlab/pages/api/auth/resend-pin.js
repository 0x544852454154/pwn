import { getUserByUsername, generateRandomPin, hashPin } from '../../../lib/auth';
import { getCookie } from '../../../lib/cookies';
import { getCurrentUser } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/db';
import { pinResetRateLimit, sanitizeError } from '../../../lib/api-middleware';
require('dotenv').config({ path: '.env.local' });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pwnlab.lol';

async function sendDiscordDM(discordId, content) {
  if (!DISCORD_TOKEN) {
    console.log('[PIN-RESEND] No Discord token configured, skipping DM');
    return false;
  }

  try {
    const { Client } = require('discord.js');
    const client = new Client({ intents: ['DirectMessages'] });

    await new Promise((resolve, reject) => {
      client.once('ready', resolve);
      client.once('error', reject);
      client.login(DISCORD_TOKEN);
    });

    const user = await client.users.fetch(discordId);
    await user.send(content);
    await client.destroy();
    return true;
  } catch (error) {
    console.error('[PIN-RESEND] Failed to send DM:', error.message);
    return false;
  }
}

function formatPinMessage(username, pin) {
  return [
    '```',
    'pwnlab PIN RESET',
    '===============',
    '',
    'A new PIN has been generated for your account.',
    '',
    `USERNAME`,
    `${username}`,
    '',
    `NEW PIN`,
    `${pin}`,
    '',
    '[ OPEN pwnlab ]',
    '',
    APP_URL,
    '```',
    '',
    '⚠️ **SECURE THIS PIN** - Do not share it with anyone.',
    'Keep this message safe. Never post pins in public channels.'
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await pinResetRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many PIN reset requests. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  try {
    const token = getCookie(req, 'pwnlab_token');
    const currentUser = token ? await getCurrentUser(token) : null;

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await getUserByUsername(username.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.id !== user.id) {
      return res.status(403).json({ error: 'You can only reset your own PIN' });
    }

    const { data: discordAccount } = await supabaseAdmin
      .from('discord_accounts')
      .select('discord_id, username')
      .eq('user_id', user.id)
      .single();

    if (!discordAccount?.discord_id) {
      return res.status(400).json({
        error: 'No Discord account linked. Use /xlogin in Discord to link your account, or sign up with email instead.'
      });
    }

    const newPin = generateRandomPin(6);
    const pinHash = await hashPin(newPin);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ pin_hash: pinHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('[API] Failed to update PIN');
      return res.status(500).json({ error: 'Failed to update PIN' });
    }

    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('user_id', user.id);

    if (sessionError) {
      console.error('[API] Failed to invalidate sessions');
    }

    res.setHeader('Set-Cookie', 'pwnlab_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');

    const dmContent = formatPinMessage(user.username, newPin);
    const dmSent = await sendDiscordDM(discordAccount.discord_id, dmContent);

    console.log(`[PIN-RESEND] PIN regenerated for ${user.username}. DM sent: ${dmSent}`);

    return res.status(200).json({
      success: true,
      message: dmSent
        ? 'PIN has been regenerated and sent to your Discord DMs.'
        : 'PIN has been regenerated. Please check your Discord DMs from the bot.',
      hint: dmSent ? undefined : 'If you don\'t see a DM, enable DMs for the server.'
    });
  } catch (error) {
    console.error('[API] PIN resend error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
