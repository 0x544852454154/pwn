const { Client } = require('discord.js');
const { generateRandomPin, hashPin, createUser, linkDiscordAccount, getUserByDiscordId, updateUserPin, userExists } = require('../lib/auth');
require('dotenv').config({ path: '.env.local' });

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'MessageContent'] });

client.once('clientReady', () => {
  console.log(`[DISCORD] Bot logged in as ${client.user.tag}`);
  console.log(`[DISCORD] Listening for "pwn login" in guild channels`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim().toLowerCase();

  if (content === 'pwn login') {
    await handleLogin(message);
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
    return true;
  } catch (error) {
    console.error('[DISCORD] Failed to send DM:', error.message);
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

client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', () => {
  console.log('\n[DISCORD] Bot shutting down...');
  client.destroy();
  process.exit(0);
});
