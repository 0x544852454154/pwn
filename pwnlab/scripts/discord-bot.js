const { Client } = require('discord.js');
const { generateRandomPin, hashPin, createUser, linkDiscordAccount, getUserByDiscordId, updateUserPin, userExists } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/db');
const { fetchDiscordUser } = require('../lib/discord-presence');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'MessageContent'] });

client.once('clientReady', () => {
  console.log(`[DISCORD] Bot logged in as ${client.user.tag}`);
  console.log(`[DISCORD] Listening for "pwn login", "pwn leaderboards", "pwn user <name>"`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim().toLowerCase();

  if (content === 'pwn login') {
    await handleLogin(message);
  } else if (content === 'pwn leaderboards') {
    await handleLeaderboards(message);
  } else if (content.startsWith('pwn user ')) {
    const username = content.slice('pwn user '.length).trim();
    if (!username) {
      await message.reply({ content: 'Usage: `pwn user <username>`' });
      return;
    }
    await handleUser(message, username);
  }
});

async function handleLogin(message) {
  const userId = message.author.id;
  const discordUsername = message.author.username;

  try {
    console.log(`[DISCORD] Login request from ${discordUsername} (${userId})`);

    const existingUser = await getUserByDiscordId(userId);

    if (existingUser) {
      console.log(`[DISCORD] Existing user found: ${existingUser.username}`);
      
      const newPin = generateRandomPin(6);
      console.log(`[DISCORD] Regenerating PIN for ${existingUser.username}: ${newPin}`);
      
      const updated = await updateUserPin(existingUser.id, newPin);
      
      if (!updated) {
        console.error(`[DISCORD] Failed to update PIN for ${existingUser.username}`);
        await message.reply({
          content: '❌ Failed to update your PIN. Please try again or contact an admin.',
        });
        return;
      }

      console.log(`[DISCORD] PIN updated successfully for ${existingUser.username}`);

      const dmContent = formatAccountFound(existingUser.username, newPin);
      const dmSent = await sendDM(message.author, dmContent);

      if (dmSent) {
        await message.reply({
          content: `✅ Account found. Check your DMs for your new PIN.`,
        });
      } else {
        await message.reply({
          content: `✅ Account found. Your new PIN is: ||${newPin}||`,
        });
      }
      return;
    }

    // New user flow
    console.log(`[DISCORD] Creating new account for ${discordUsername}`);
    
      let pwnlabUsername = discordUsername.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50).toLowerCase();
    let finalUsername = pwnlabUsername;
    let counter = 1;
    
    while (await userExists(finalUsername)) {
      finalUsername = `${pwnlabUsername}${counter}`;
      counter++;
    }

    const pin = generateRandomPin(6);
    console.log(`[DISCORD] Generated PIN for ${finalUsername}: ${pin}`);

    const userResult = await createUser(finalUsername, pin);

    if (!userResult.success) {
      console.error(`[DISCORD] Failed to create user: ${userResult.error}`);
      await message.reply({
        content: `❌ Failed to create account: ${userResult.error}`,
      });
      return;
    }

    console.log(`[DISCORD] User created: ${finalUsername} (${userResult.userId})`);

    const linkResult = await linkDiscordAccount(userResult.userId, userId, discordUsername);
    console.log(`[DISCORD] Discord account linked:`, !!linkResult);

    const dmContent = formatAccountCreated(finalUsername, pin);
    const dmSent = await sendDM(message.author, dmContent);

    if (dmSent) {
      await message.reply({
        content: `✅ Account created successfully! Check your DMs for credentials.`,
      });
    } else {
      await message.reply({
        content: `✅ Account created, but I couldn't DM you.\nYour PIN is: ||${pin}||`,
      });
    }

    console.log(`[DISCORD] New pwnlab account created: ${finalUsername}`);
  } catch (error) {
    console.error('[DISCORD] Error in pwn login:', error);
    await message.reply({
      content: '❌ An error occurred creating your account. Please try again.',
    });
  }
}

async function sendDM(user, content) {
  try {
    const dmChannel = await user.createDM();
    await dmChannel.send(content);
    console.log(`[DISCORD] DM sent to ${user.tag || user.id}`);
    return true;
  } catch (error) {
    console.error('[DISCORD] Failed to send DM:', error.message);
    console.log(`[DISCORD] Attempting fallback reply for ${user.tag || user.id}`);
    return false;
  }
}

function formatAccountCreated(username, pin) {
  return [
    '```',
    'pwnlab ACCOUNT',
    '============',
    '',
    `USERNAME: ${username}`,
    `PIN: ${pin}`,
    '```',
    '',
    '⚠️ **SECURE THIS PIN** - Do not share it with anyone.'
  ].join('\n');
}

function formatAccountFound(username, newPin) {
  return [
    '```',
    'pwnlab ACCOUNT',
    '============',
    '',
    `USERNAME: ${username}`,
    `PIN: ${newPin}`,
    '```',
    '',
    '⚠️ **SECURE THIS PIN** - Do not share it with anyone.'
  ].join('\n');
}

async function handleLeaderboards(message) {
  try {
    const [usersRes, completionsRes] = await Promise.all([
      supabaseAdmin.from('users').select('id, username'),
      supabaseAdmin.from('challenge_completions').select('user_id, points_earned')
    ]);

    const userScores = {};
    for (const u of (usersRes.data || [])) {
      userScores[u.id] = { username: u.username, total_points: 0, challenges: 0 };
    }
    const challengeSet = {};
    for (const c of (completionsRes.data || [])) {
      if (userScores[c.user_id]) {
        userScores[c.user_id].total_points += (c.points_earned || 0);
      }
    }
    for (const c of (completionsRes.data || [])) {
      if (userScores[c.user_id]) {
        const key = c.user_id + ':' + c.challenge_id;
        if (!challengeSet[key]) {
          challengeSet[key] = true;
          userScores[c.user_id].challenges += 1;
        }
      }
    }

    const sorted = Object.values(userScores)
      .sort((a, b) => b.total_points - a.total_points || a.username.localeCompare(b.username))
      .slice(0, 10);

    const lines = sorted.map((entry, i) => {
      const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : '  ';
      return `${medal} **#${i + 1}** ${entry.username} — ${entry.total_points} pts (${entry.challenges} solves)`;
    });

    await message.reply({
      content: '**pwnlab Global Leaderboard (Top 10)**\n```\n' + lines.join('\n') + '\n```',
    });
  } catch (error) {
    console.error('[DISCORD] Leaderboard error:', error.message);
    await message.reply({ content: '⚠️ Failed to load leaderboards. Please try again later.' });
  }
}

async function handleUser(message, username) {
  try {
    const { data: profileUser, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, username, created_at')
      .eq('username', username)
      .maybeSingle();

    if (userErr || !profileUser) {
      await message.reply({ content: `⚠️ User **${username}** not found.` });
      return;
    }

    const [{ data: discordAcc }, { data: completions }] = await Promise.all([
      supabaseAdmin
        .from('discord_accounts')
        .select('discord_id, username')
        .eq('user_id', profileUser.id)
        .maybeSingle(),
      supabaseAdmin
        .from('challenge_completions')
        .select('points_earned, challenge:challenges(id, name, points, category:challenge_categories(name))')
        .eq('user_id', profileUser.id)
        .order('completed_at', { ascending: false }),
    ]);

    const completedChallenges = completions || [];
    const totalPoints = completedChallenges.reduce((acc, c) => acc + (c.points_earned || 0), 0);
    const totalSolves = completedChallenges.length;

    let discordInfo = null;
    if (discordAcc?.discord_id) {
      discordInfo = await fetchDiscordUser(discordAcc.discord_id, process.env.DISCORD_TOKEN);
    }

    const avatarUrl = discordInfo?.avatarUrl || message.client.user.displayAvatarURL({ size: 256 });

    const embed = {
      color: 0x0099ff,
      author: {
        name: profileUser.username,
        icon_url: avatarUrl,
      },
      thumbnail: { url: avatarUrl },
      fields: [
        { name: 'Total Points', value: totalPoints.toLocaleString(), inline: true },
        { name: 'Challenges Solved', value: totalSolves.toString(), inline: true },
        { name: 'Member Since', value: `<t:${Math.floor(new Date(profileUser.created_at).getTime() / 1000)}:R>`, inline: true },
      ],
      footer: { text: `pwnlab operator dossier` },
    };

    if (discordInfo?.bannerUrl) {
      embed.image = { url: discordInfo.bannerUrl };
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('[DISCORD] User lookup error:', error.message);
    await message.reply({ content: '⚠️ Failed to look up user. Please try again.' });
  }
}

client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', () => {
  console.log('\n[DISCORD] Bot shutting down...');
  client.destroy();
  process.exit(0);
});
