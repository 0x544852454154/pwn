const { authenticateUser } = require('../lib/auth');

const username = process.argv[2];
const pin = process.argv[3];

if (!username || !pin) {
  console.log('Usage: node scripts/discord-test-login.js <username> <pin>');
  process.exit(1);
}

(async () => {
  console.log(`Testing login for ${username} with PIN ${pin}...`);
  const result = await authenticateUser(username, pin);
  
  if (result.success) {
    console.log('✅ Login SUCCESS');
    console.log('   Token:', result.token.substring(0, 20) + '...');
  } else {
    console.log('❌ Login FAILED:', result.error);
  }
})();
