const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[SUPABASE] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'Server-side admin features will not work.'
  );
}

const supabaseAdmin = createClient(
  supabaseUrl || 'http://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseServiceKey);
};

module.exports = {
  supabaseAdmin,
  isSupabaseConfigured,
};
