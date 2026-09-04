const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../lib/supabase-admin');
const { part1Challenges } = require('./challenges-part1');
const { part2Challenges } = require('./challenges-part2');
const { part3Challenges } = require('./challenges-part3');
const { part4Challenges } = require('./challenges-part4');
require('dotenv').config({ path: '.env.local' });

const ROOT = '/home/misery/pwnlab/challenges';

const allChallenges = [
  ...part1Challenges,
  ...part2Challenges,
  ...part3Challenges,
  ...part4Challenges,
];

async function run() {
  console.log(`\n=== Seeding ${allChallenges.length} Downloadable Challenges ===\n`);

  // 1. Create file directory tree on disk
  console.log('Writing challenge files to', ROOT);
  for (const chall of allChallenges) {
    const dir = path.join(ROOT, chall.storage_path);
    fs.mkdirSync(dir, { recursive: true });
    for (const [filename, content] of Object.entries(chall.files)) {
      const filePath = path.join(dir, filename);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
    console.log(`  ✓ Files created for [${chall.difficulty}] ${chall.name} (${chall.storage_path})`);
  }

  // 2. Fetch category map from database
  const { data: categories, error: catError } = await supabaseAdmin
    .from('challenge_categories')
    .select('id, name');

  if (catError || !categories) {
    console.error('Failed to fetch categories:', catError);
    process.exit(1);
  }

  const catMap = {};
  for (const c of categories) {
    catMap[c.name.toUpperCase()] = c.id;
  }

  // 3. Clear existing challenges and re-seed
  console.log('\nResetting existing challenge records in database...');
  await supabaseAdmin.from('challenge_hints').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_objectives').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_files').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_submissions').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_completions').delete().neq('id', 0);
  await supabaseAdmin.from('challenges').delete().neq('id', 0);

  // 4. Insert each challenge
  console.log(`\nInserting ${allChallenges.length} challenges into Supabase...`);
  for (const [idx, chall] of allChallenges.entries()) {
    const catId = catMap[chall.category.toUpperCase()] || catMap['WEB'];

    const { data: insertedChallenge, error: challError } = await supabaseAdmin
      .from('challenges')
      .insert({
        name: chall.name,
        description: chall.description,
        category_id: catId,
        difficulty: chall.difficulty,
        points: chall.points,
        estimated_time: chall.estimated_time,
        flag: chall.flag,
        storage_path: chall.storage_path,
        visibility: 'PUBLIC'
      })
      .select('id, name, difficulty, points')
      .single();

    if (challError) {
      console.error(`❌ Failed to insert challenge ${chall.name}:`, challError.message);
      continue;
    }

    const challId = insertedChallenge.id;

    // Insert objectives
    if (chall.objectives && chall.objectives.length > 0) {
      const objectivesData = chall.objectives.map((obj, i) => ({
        challenge_id: challId,
        objective: obj,
        order_num: i + 1
      }));
      await supabaseAdmin.from('challenge_objectives').insert(objectivesData);
    }

    // Insert hints
    if (chall.hints && chall.hints.length > 0) {
      const hintsData = chall.hints.map((hint, i) => ({
        challenge_id: challId,
        hint_text: hint.text,
        point_penalty: hint.penalty || 0,
        order_num: i + 1
      }));
      await supabaseAdmin.from('challenge_hints').insert(hintsData);
    }

    // Insert challenge files record
    for (const filename of Object.keys(chall.files)) {
      await supabaseAdmin.from('challenge_files').insert({
        challenge_id: challId,
        filename: filename,
        file_path: `${chall.storage_path}/${filename}`,
        file_size: Buffer.byteLength(chall.files[filename])
      });
    }

    console.log(`  [#${challId}] ${chall.difficulty} | ${chall.category} | ${chall.name} (${chall.points} pts)`);
  }

  console.log(`\n✅ All ${allChallenges.length} challenges seeded successfully!`);
}

run().catch(err => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
