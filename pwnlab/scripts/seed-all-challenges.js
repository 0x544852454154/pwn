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
  ...part4Challenges
];

async function seed() {
  console.log(`\n======================================================`);
  console.log(`  Seeding ${allChallenges.length} Terminal Challenges for pwnlab`);
  console.log(`======================================================\n`);

  // 1. Write challenge files to disk
  console.log(`1. Writing challenge environment files to ${ROOT}...`);
  for (const chall of allChallenges) {
    const dir = path.join(ROOT, chall.storage_path);
    fs.mkdirSync(dir, { recursive: true });
    for (const [filename, content] of Object.entries(chall.files)) {
      const filePath = path.join(dir, filename);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
    }
  }
  console.log(`  ✓ All ${allChallenges.length} challenge directories and files written to disk.\n`);

  // 2. Fetch category map from Supabase
  console.log('2. Fetching category taxonomy from Supabase...');
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
  console.log(`  ✓ Found ${categories.length} categories in database.\n`);

  // 3. Reset existing challenges
  console.log('3. Cleaning up old challenge database records...');
  await supabaseAdmin.from('challenge_hints').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_objectives').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_files').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_submissions').delete().neq('id', 0);
  await supabaseAdmin.from('challenge_completions').delete().neq('id', 0);
  await supabaseAdmin.from('challenges').delete().neq('id', 0);
  console.log('  ✓ Database reset complete.\n');

  // 4. Insert challenges concurrently in chunks
  console.log(`4. Inserting ${allChallenges.length} challenges into Supabase in parallel batches...`);
  const CHUNK_SIZE = 15;
  let insertedCount = 0;

  for (let i = 0; i < allChallenges.length; i += CHUNK_SIZE) {
    const chunk = allChallenges.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (chall) => {
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
          console.error(`❌ Failed to insert [${chall.difficulty}] ${chall.name}:`, challError.message);
          return;
        }

        const challId = insertedChallenge.id;
        insertedCount++;

        const tasks = [];

        // Insert objectives
        if (chall.objectives && chall.objectives.length > 0) {
          const objRows = chall.objectives.map((obj, idx) => ({
            challenge_id: challId,
            objective: obj,
            order_num: idx + 1
          }));
          tasks.push(supabaseAdmin.from('challenge_objectives').insert(objRows));
        }

        // Insert hints
        if (chall.hints && chall.hints.length > 0) {
          const hintRows = chall.hints.map((hint, idx) => ({
            challenge_id: challId,
            hint_text: hint.text,
            point_penalty: hint.penalty || 0,
            order_num: idx + 1
          }));
          tasks.push(supabaseAdmin.from('challenge_hints').insert(hintRows));
        }

        // Insert files metadata
        if (chall.files) {
          const fileRows = Object.entries(chall.files).map(([filename, content]) => ({
            challenge_id: challId,
            filename: filename,
            storage_path: `${chall.storage_path}/${filename}`,
            size_bytes: Buffer.byteLength(content)
          }));
          if (fileRows.length > 0) {
            tasks.push(supabaseAdmin.from('challenge_files').insert(fileRows));
          }
        }

        if (tasks.length > 0) {
          await Promise.all(tasks);
        }
      })
    );
    console.log(`  ✓ Inserted batch ${Math.min(i + CHUNK_SIZE, allChallenges.length)}/${allChallenges.length}...`);
  }

  console.log(`\n======================================================`);
  console.log(`✅ Successfully seeded ${insertedCount} challenges!`);
  console.log(`======================================================\n`);
}

seed().catch(err => {
  console.error('Seed script fatal error:', err);
  process.exit(1);
});
