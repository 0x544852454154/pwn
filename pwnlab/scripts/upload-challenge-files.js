const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || 'http://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHALLENGE_FILES_ROOT = '/home/misery/pwnlab/challenges';
const BUCKET_NAME = 'challenge-files';

async function setupStorage() {
  console.log('Setting up Supabase Storage for challenge files...\n');

  // 1. Create bucket if it doesn't exist
  const { data: buckets, error: bucketErr } = await supabaseAdmin.storage.listBuckets();
  if (bucketErr) {
    console.error('Error listing buckets:', bucketErr.message);
    process.exit(1);
  }

  const existingBucket = buckets.find(b => b.name === BUCKET_NAME);
  if (!existingBucket) {
    const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true
    });
    if (createErr) {
      console.error('Error creating bucket:', createErr.message);
      process.exit(1);
    }
    console.log(`✓ Created bucket: ${BUCKET_NAME}`);
  } else {
    console.log(`✓ Bucket already exists: ${BUCKET_NAME}`);
  }

  // 2. List all files in challenge_files table
  const { data: fileRows, error: fileErr } = await supabaseAdmin
    .from('challenge_files')
    .select('challenge_id, filename, storage_path');

  if (fileErr) {
    console.error('Error fetching challenge_files:', fileErr.message);
    process.exit(1);
  }

  console.log(`✓ Found ${fileRows.length} files in challenge_files table\n`);

  // 3. Upload each file to Supabase Storage
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const fileRow of fileRows) {
    const localPath = path.join(CHALLENGE_FILES_ROOT, fileRow.storage_path);

    if (!fs.existsSync(localPath)) {
      console.error(`  ⚠ Local file not found: ${localPath} (skipping)`);
      failed++;
      continue;
    }

    try {
      const content = fs.readFileSync(localPath);
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileRow.storage_path, content, {
          upsert: true,
          contentType: 'application/octet-stream'
        });

      if (uploadErr) {
        console.error(`  ✗ Failed to upload ${fileRow.storage_path}:`, uploadErr.message);
        failed++;
      } else {
        uploaded++;
        if ((uploaded + skipped + failed) % 50 === 0) {
          console.log(`  Progress: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
        }
      }
    } catch (e) {
      console.error(`  ✗ Error uploading ${fileRow.storage_path}:`, e.message);
      failed++;
    }
  }

  console.log(`\n✓ Upload complete: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  process.exit(0);
}

setupStorage().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
