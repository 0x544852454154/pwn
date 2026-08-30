const { supabaseAdmin, isSupabaseConfigured } = require('../lib/db');

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase setup...\n');

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured.');
    console.log('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('   are set in your .env.local file.\n');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found\n');

  // Test connection
  console.log('📡 Testing connection...');
  try {
    const { data, error } = await supabaseAdmin
      .from('challenge_categories')
      .select('count');

    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('\n   Make sure you ran the migration SQL in Supabase SQL Editor.');
      console.log('   Run: supabase/migrations/001_initial_schema.sql\n');
      process.exit(1);
    }

    console.log('✅ Connection successful\n');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  }

  // Check tables exist
  console.log('🗄️  Checking tables...');
  const tables = [
    'users',
    'challenges',
    'challenge_categories',
    'challenge_objectives',
    'challenge_hints',
    'discord_accounts',
    'profiles',
    'challenge_submissions',
    'challenge_completions',
    'teams',
    'team_members',
    'user_notes',
    'activity_log',
  ];

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('count').limit(1);
      if (error) {
        console.error(`   ❌ Table "${table}" missing or inaccessible: ${error.message}`);
      } else {
        console.log(`   ✅ Table "${table}" exists`);
      }
    } catch (error) {
      console.error(`   ❌ Table "${table}" error: ${error.message}`);
    }
  }

  // Check categories
  console.log('\n📊 Checking challenge categories...');
  try {
    const { data, error } = await supabaseAdmin
      .from('challenge_categories')
      .select('name, slug');

    if (error) {
      console.error('❌ Could not fetch categories:', error.message);
    } else if (data.length === 0) {
      console.log('   ⚠️  No categories found. Run the seed script.');
    } else {
      console.log(`   ✅ Found ${data.length} categories:`);
      data.forEach(cat => console.log(`      - ${cat.name} (${cat.slug})`));
    }
  } catch (error) {
    console.error('❌ Categories error:', error.message);
  }

  // Check Supabase Auth
  console.log('\n🔐 Checking Supabase Auth...');
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error('❌ Auth check failed:', error.message);
    } else {
      console.log(`   ✅ Auth is accessible (${data.users?.length || 0} users)`);
    }
  } catch (error) {
    console.error('❌ Auth error:', error.message);
  }

  // Check Storage
  console.log('\n📁 Checking Supabase Storage...');
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.log('   ⚠️  Could not list buckets (this is normal if Storage is not set up)');
    } else {
      console.log(`   ✅ Storage accessible (${data.length} buckets)`);
      if (!data.find(b => b.name === 'challenge-files')) {
        console.log('   💡 Tip: Create a "challenge-files" bucket for challenge downloads');
      }
    }
  } catch (error) {
    console.log('   ⚠️  Storage not accessible yet (this is normal)');
  }

  console.log('\n✅ Supabase setup check complete!\n');
}

checkSupabaseSetup().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
