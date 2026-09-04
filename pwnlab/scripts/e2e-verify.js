// Comprehensive end-to-end verification
// - All 120 challenges present in DB with points=0
// - For each challenge: download every file from Supabase Storage,
//   confirm no flag leak, decode the clue via clue.txt, verify it
//   round-trips to the DB flag string
// - Confirm no solver/decode files anywhere

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function xorKeyFor(seed) { return crypto.createHash('md5').update(seed).digest().slice(0, 4); }
function xorBuf(buf, key) {
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ key[i % key.length];
  return out;
}
function decodeFlag(diff, slug, flagLen, enc) {
  if (diff === 'EASY') {
    const b = Buffer.from(enc, 'hex');
    const k = xorKeyFor(slug + '/easy');
    return Buffer.from(b.map((c, i) => c ^ k[i % 4])).toString();
  }
  if (diff === 'MEDIUM') {
    const b = Buffer.from(enc, 'base64');
    const k = xorKeyFor(slug + '/medium');
    return Buffer.from(b.map((c, i) => c ^ k[i % 4])).toString();
  }
  if (diff === 'HARD') {
    const x = Buffer.from(enc, 'hex');
    const b = Buffer.from(x.toString('latin1'), 'base64');
    const k = xorKeyFor(slug + '/hard');
    return Buffer.from(b.map((c, i) => c ^ k[i % 4])).toString();
  }
  const rev = Buffer.from(enc, 'hex').reverse();
  const k = xorKeyFor(slug + '/insane/' + flagLen);
  return Buffer.from(rev.map((c, i) => c ^ k[i % 4])).toString();
}

function readClueTxt(buf) {
  // Pulls the last non-comment, non-blank hex/base64 line from clue.txt
  const lines = buf.toString('utf8').split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const ln = lines[i].trim();
    if (!ln || ln.startsWith('#')) continue;
    return ln;
  }
  return null;
}

async function main() {
  const { data: chals, error } = await sb.from('challenges')
    .select('id, name, flag, difficulty, points, storage_path')
    .order('id', { ascending: true });
  if (error) throw error;
  console.log(`Loaded ${chals.length} challenges`);

  let nonZeroPoints = 0;
  const failures = [];
  let totalFiles = 0, totalBytes = 0;

  for (const c of chals) {
    if (c.points !== 0) nonZeroPoints++;

    const { data: fileRows } = await sb.from('challenge_files')
      .select('filename, storage_path, size_bytes')
      .eq('challenge_id', c.id);

    if (!fileRows || fileRows.length === 0) {
      failures.push({ id: c.id, name: c.name, issue: 'NO FILE ROWS' });
      continue;
    }

    let clueTxtContent = null;
    const downloaded = [];
    for (const f of fileRows) {
      totalFiles++;
      try {
        const { data: blob } = await sb.storage.from('challenge-files').download(f.storage_path);
        const buf = Buffer.from(await blob.arrayBuffer());
        totalBytes += buf.length;
        if (buf.includes(Buffer.from(c.flag))) {
          failures.push({ id: c.id, name: c.name, issue: 'FLAG LEAK in ' + f.filename });
        }
        if (/^solve\.(sh|py|js|pl|rb)$/i.test(f.filename) || /^decode\.(py|sh)$/i.test(f.filename)) {
          failures.push({ id: c.id, name: c.name, issue: 'SOLVER FILE ' + f.filename });
        }
        if (f.filename === 'clue.txt') clueTxtContent = buf;
        downloaded.push({ name: f.filename, buf, declaredSize: f.size_bytes });
      } catch (e) {
        failures.push({ id: c.id, name: c.name, issue: 'DOWNLOAD FAILED ' + f.storage_path + ': ' + e.message });
      }
    }

    // Sanity: file sizes match what was declared
    for (const d of downloaded) {
      if (d.declaredSize != null && d.buf.length !== d.declaredSize) {
        failures.push({ id: c.id, name: c.name, issue: `SIZE MISMATCH ${d.name} declared=${d.declaredSize} actual=${d.buf.length}` });
      }
    }

    if (!clueTxtContent) {
      failures.push({ id: c.id, name: c.name, issue: 'NO clue.txt' });
      continue;
    }
    const clue = readClueTxt(clueTxtContent);
    if (!clue) {
      failures.push({ id: c.id, name: c.name, issue: 'EMPTY CLUE' });
      continue;
    }
    const got = decodeFlag(c.difficulty, c.storage_path, c.flag.length, clue);
    if (got !== c.flag) {
      failures.push({ id: c.id, name: c.name, issue: `DECODE FAIL (${c.difficulty}) expected=${c.flag} got=${got}` });
    }
  }

  console.log(`\nnon-zero points: ${nonZeroPoints}`);
  console.log(`total files downloaded: ${totalFiles}, total bytes: ${totalBytes}`);
  console.log(`\n=== ${failures.length} failures ===`);
  for (const f of failures.slice(0, 30)) console.log(`  [#${f.id}] ${f.name}: ${f.issue}`);
  if (failures.length > 30) console.log(`  ... and ${failures.length - 30} more`);

  if (failures.length === 0 && nonZeroPoints === 0) {
    console.log('\n=== ALL CHALLENGES PASS ===');
    process.exit(0);
  } else {
    process.exit(2);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });