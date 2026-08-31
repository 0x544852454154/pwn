import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import path, { join, resolve } from 'path';
import AdmZip from 'adm-zip';

const CHALLENGE_FILES_ROOT = '/home/misery/pwnlab/challenges';
const STORAGE_BUCKET = 'challenge-files';

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

async function downloadFromStorage(supabase, storagePath) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error) throw error;

  const buffer = Buffer.from(await data.arrayBuffer());
  return buffer;
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
    const rootResolved = resolve(CHALLENGE_FILES_ROOT);

    let files = [];

    const localPath = folderPath
      ? resolve(rootResolved, folderPath)
      : null;

    if (localPath && localPath.startsWith(rootResolved) && existsSync(localPath)) {
      files = collectFiles(localPath, folderPath);
    } else {
      const { data: fileRows, error: fileErr } = await supabaseAdmin
        .from('challenge_files')
        .select('filename, storage_path')
        .eq('challenge_id', challengeId)
        .order('id');

      if (fileErr || !fileRows || fileRows.length === 0) {
        if (localPath && existsSync(localPath)) {
          files = collectFiles(localPath, folderPath);
        }
      } else {
        for (const fileRow of fileRows) {
          try {
            const content = await downloadFromStorage(supabaseAdmin, fileRow.storage_path);
            files.push({ path: null, zipPath: fileRow.storage_path, content });
          } catch (err) {
            console.warn(`[API] Failed to download ${fileRow.storage_path}:`, err.message);
          }
        }
      }
    }

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files available for this challenge' });
    }

    const zip = new AdmZip();
    for (const file of files) {
      if (file.content) {
        zip.addFile(file.zipPath, file.content);
      } else {
        const fileResolved = resolve(file.path);
        if (!fileResolved.startsWith(rootResolved)) {
          continue;
        }
        const content = readFileSync(file.path);
        zip.addFile(file.zipPath, content);
      }
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
