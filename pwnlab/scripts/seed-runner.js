#!/usr/bin/env node
// scripts/seed-runner.js
// 1. Wipes Supabase challenge data (challenges, objectives, hints, files, submissions, completions).
// 2. Regenerates 120 fresh challenges via scripts/generate-challenges.js (points=0).
// 3. Inserts them into Supabase.
// 4. Uploads all artifact files (no solver, no flag) to the `challenge-files` bucket.
//
// Run: node scripts/seed-runner.js

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { buildChallenges } = require('./generate-challenges');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'challenge-files';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GEN_ROOT = path.join(__dirname, '..', 'generated-challenges');

async function wipe() {
  console.log('\n=== Wiping existing challenge data ===');
  const tables = [
    'challenge_hints',
    'challenge_objectives',
    'challenge_files',
    'challenge_submissions',
    'challenge_completions',
    'challenges',
  ];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', 0);
    if (error) {
      console.error(`  ! failed to wipe ${t}: ${error.message}`);
    } else {
      console.log(`  - wiped ${t}`);
    }
  }
}

async function fetchCategoryMap() {
  const { data, error } = await supabase
    .from('challenge_categories')
    .select('id, name');
  if (error) throw error;
  const map = {};
  for (const c of data || []) map[c.name.toUpperCase()] = c.id;
  return map;
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (!(buckets || []).find((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createErr) throw createErr;
    console.log(`  + created bucket ${BUCKET}`);
  } else {
    console.log(`  = bucket ${BUCKET} exists`);
  }
}

async function insertChallenges(challenges, catMap) {
  console.log(`\n=== Inserting ${challenges.length} challenges ===`);
  const failures = [];
  for (const c of challenges) {
    const catId = catMap[c.category.toUpperCase()];
    if (!catId) {
      console.error(`  ! no category row for ${c.category}`);
      failures.push(c);
      continue;
    }

    const { data: ins, error } = await supabase
      .from('challenges')
      .insert({
        name: c.name,
        description: c.description,
        category_id: catId,
        difficulty: c.difficulty,
        points: c.points, // per-difficulty curve from generator
        estimated_time: c.estimated_time,
        flag: c.flag,     // SERVER-SIDE ONLY -- never written to a user-visible file
        storage_path: c.storage_path,
        visibility: 'PUBLIC',
      })
      .select('id')
      .single();
    if (error) {
      console.error(`  ! insert ${c.storage_path}: ${error.message}`);
      failures.push(c);
      continue;
    }
    const id = ins.id;

    if (c.objectives && c.objectives.length) {
      await supabase.from('challenge_objectives').insert(
        c.objectives.map((o, i) => ({ challenge_id: id, objective: o, order_num: i + 1 }))
      );
    }
    if (c.hints && c.hints.length) {
      await supabase.from('challenge_hints').insert(
        c.hints.map((h, i) => ({
          challenge_id: id,
          hint_text: h.text,
          point_penalty: h.penalty || 0,
          order_num: i + 1,
        }))
      );
    }

    // Record file metadata (no flag, no solver in any of these files)
    for (const [fname, content] of Object.entries(c.files)) {
      const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
      await supabase.from('challenge_files').insert({
        challenge_id: id,
        filename: fname,
        storage_path: `${c.storage_path}/${fname}`,
        size_bytes: buf.length,
        mime_type: mimeFor(fname),
      });
    }
    console.log(`  + [#${id}] ${c.difficulty.padEnd(6)} ${c.category.padEnd(18)} ${c.name}`);
  }
  return failures;
}

function mimeFor(name) {
  const ext = path.extname(name).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.pcap': return 'application/vnd.tcpdump.pcap';
    case '.pdf': return 'application/pdf';
    case '.elf': return 'application/x-executable';
    case '.bin': return 'application/octet-stream';
    case '.sqlite': return 'application/x-sqlite3';
    case '.json': return 'application/json';
    case '.md': return 'text/markdown';
    case '.txt': case '.log': return 'text/plain';
    case '.c': return 'text/x-c';
    default: return 'application/octet-stream';
  }
}

async function uploadArtifacts(challenges) {
  console.log('\n=== Uploading artifact files to Supabase Storage ===');
  await ensureBucket();
  let ok = 0, fail = 0;
  for (const c of challenges) {
    for (const [fname, content] of Object.entries(c.files)) {
      const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
      const key = `${c.storage_path}/${fname}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, buf, { upsert: true, contentType: mimeFor(fname) });
      if (error) {
        console.error(`  ! upload ${key}: ${error.message}`);
        fail++;
      } else {
        ok++;
      }
    }
  }
  console.log(`  uploaded ${ok} files, failed ${fail}`);
}

async function main() {
  console.log('Generating fresh challenge set...');
  const challenges = buildChallenges();
  console.log(`Generated ${challenges.length} challenges.`);

  await wipe();
  const catMap = await fetchCategoryMap();
  const failures = await insertChallenges(challenges, catMap);
  await uploadArtifacts(challenges);

  console.log(`Done. Inserted ${challenges.length - failures.length}/${challenges.length}.`);
  console.log(`Points curve applied by difficulty (EASY=100/MEDIUM=200/HARD=400/INSANE=750).`);
  console.log(`First-blood logic: only the first solver of each challenge is awarded points + notification.`);
  if (failures.length) {
    console.log(`Failures:`);
    failures.forEach((f) => console.log('  ', f.storage_path));
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});