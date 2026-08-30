import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import path, { join, resolve } from 'path';
import AdmZip from 'adm-zip';

const CHALLENGE_FILES_ROOT = '/home/misery/pwnlab/challenges';

function collectFiles(dir, zipPrefix = '') {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    const zipPath = zipPrefix ? (zipPrefix + '/' + entry) : entry;

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, zipPath));
    } else {
      files.push({ path: fullPath, zipPath });
    }
  }
  return files;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { id } = req.query;
    const challengeId = parseInt(id);

    if (isNaN(challengeId) || challengeId <= 0) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const { data: challenge, error: challError } = await supabaseAdmin
      .from('challenges')
      .select('id, name, storage_path')
      .eq('id', challengeId)
      .single();

    if (challError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const folderPath = challenge.storage_path;
    if (!folderPath || typeof folderPath !== 'string') {
      return res.status(404).json({ error: 'No files available for this challenge' });
    }

    const rootResolved = resolve(CHALLENGE_FILES_ROOT);
    const targetResolved = resolve(rootResolved, folderPath);

    if (!targetResolved.startsWith(rootResolved)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }

    if (!existsSync(targetResolved)) {
      return res.status(404).json({ error: 'Challenge file directory does not exist' });
    }

    const files = collectFiles(targetResolved);
    if (files.length === 0) {
      return res.status(404).json({ error: 'No files available in challenge package' });
    }

    const zip = new AdmZip();
    for (const file of files) {
      const fileResolved = resolve(file.path);
      if (!fileResolved.startsWith(rootResolved)) {
        continue;
      }
      const content = readFileSync(file.path);
      zip.addFile(file.zipPath, content);
    }

    const zipBuffer = zip.toBuffer();
    const sanitizedName = challenge.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + sanitizedName + '.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (error) {
    console.error('[API] Download error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
