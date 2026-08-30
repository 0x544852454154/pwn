const { getUserByDiscordId, getUserByUsername, authenticateUser } = require('../lib/auth');
const { supabaseAdmin } = require('../lib/db');

async function diagnose(usernameOrDiscordId) {
  console.log('=== pwnlab Discord Auth Diagnostic ===\n');

  // Try to find by username first
  let user = await getUserByUsername(usernameOrDiscordId);
  let discordId = null;
  let pinHashExists = false;

  if (!user) {
    // Try to find by Discord ID
    const discordResult = await supabaseAdmin
      .from('discord_accounts')
      .select('user_id, discord_id, username')
      .eq('discord_id', usernameOrDiscordId)
      .single();

    if (discordResult.data) {
      const userResult = await supabaseAdmin
        .from('users')
        .select('id, username, pin_hash, created_at')
        .eq('id', discordResult.data.user_id)
        .single();

      if (userResult.data) {
        user = userResult.data;
        discordId = discordResult.data.discord_id;
        pinHashExists = !!userResult.data.pin_hash;
      }
    }
  } else {
    // Find Discord ID and pin_hash for this user
    const [discordResult, userDetails] = await Promise.all([
      supabaseAdmin.from('discord_accounts').select('discord_id').eq('user_id', user.id).single(),
      supabaseAdmin.from('users').select('pin_hash').eq('id', user.id).single()
    ]);

    if (discordResult.data) {
      discordId = discordResult.data.discord_id;
    }
    pinHashExists = !!userDetails.data?.pin_hash;
  }

  if (!user) {
    console.log('❌ User not found:', usernameOrDiscordId);
    console.log('\nTo create an account, type "pwn login" in Discord.');
    return;
  }

  console.log('✅ User found:');
  console.log('   Username:', user.username);
  console.log('   User ID:', user.id);
  console.log('   Discord ID:', discordId || 'N/A');
  console.log('   PIN hash exists:', pinHashExists);
  console.log('   Created at:', user.created_at);

  console.log('\nTo test login, run:');
  console.log(`   node scripts/discord-test-login.js ${user.username} <PIN>`);
}

const usernameOrId = process.argv[2];
if (!usernameOrId) {
  console.log('Usage: node scripts/discord-diagnose.js <username_or_discord_id>');
  process.exit(1);
}

diagnose(usernameOrId).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
