import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path, { resolve } from 'path';

const CHALLENGE_FILES_ROOT = '/home/misery/pwnlab/challenges';
const STORAGE_BUCKET = 'challenge-files';

// On-demand materialization directory for the web terminal
const WORK_ROOT = resolve(os.tmpdir(), 'pwnlab-terminal');
fs.mkdirSync(WORK_ROOT, { recursive: true });

const ALLOWED_COMMANDS = new Set([
  'ls', 'cat', 'file', 'strings', 'hexdump', 'xxd',
  'python3', 'gcc', 'grep', 'base64', 'wc', 'head', 'tail',
  'pwd', 'echo', 'find', 'sort', 'uniq', 'diff', 'md5sum',
  'sha256sum', 'tar', 'gzip', 'gunzip', 'zip', 'unzip',
  'curl', 'wget', 'nc', 'nmap', 'ping', 'traceroute',
  'openssl', 'jq', 'awk', 'sed', 'cut', 'tr'
]);

const MAX_COMMAND_LENGTH = 500;
const EXEC_TIMEOUT = 10000;
const MAX_OUTPUT_SIZE = 1024 * 512;

/**
 * Materialize a challenge's file bundle into a local working directory.
 * Each file is read from the Supabase Storage bucket and written under:
 *   WORK_ROOT/<userId>/<challengeId>/
 * The directory is reused and refreshed on first request for that user+challenge.
 * This lets the web terminal work even when the legacy
 * /home/misery/pwnlab/challenges tree is absent (files live in Storage).
 */
async function materializeChallengeDir(userId, challengeId, storagePath) {
  const userDir = resolve(WORK_ROOT, String(userId), String(challengeId));
  const marker = resolve(userDir, '.pwnlab-ready');

  // Refresh if not already materialized (or stale)
  if (fs.existsSync(marker)) return userDir;

  fs.mkdirSync(userDir, { recursive: true });

  // Try legacy on-disk tree first, then fall back to Storage bucket.
  const legacyRoot = resolve(CHALLENGE_FILES_ROOT);
  const legacyDir = resolve(legacyRoot, storagePath || '');
  if (legacyDir.startsWith(legacyRoot) && fs.existsSync(legacyDir)) {
    for (const entry of fs.readdirSync(legacyDir, { withFileTypes: true })) {
      if (entry.isFile()) {
        const src = path.join(legacyDir, entry.name);
        fs.copyFileSync(src, resolve(userDir, entry.name));
      }
    }
  } else {
    // Fetch file list + content from Supabase Storage
    const { data: fileRows, error: listError } = await supabaseAdmin
      .from('challenge_files')
      .select('filename, storage_path')
      .eq('challenge_id', challengeId);

    if (listError) {
      throw new Error(`Failed to list challenge files: ${listError.message}`);
    }

    for (const { filename, storage_path: sp } of fileRows || []) {
      try {
        const { data: blob, error: dlError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .download(sp);
        if (dlError) throw dlError;
        const buf = Buffer.from(await blob.arrayBuffer());
        // Sanitize filename (no path traversal)
        const safeName = path.basename(filename);
        fs.writeFileSync(resolve(userDir, safeName), buf);
      } catch (dlErr) {
        console.warn(`[terminal] failed to materialize ${sp}: ${dlErr.message}`);
      }
    }
  }

  fs.writeFileSync(marker, 'ready');
  return userDir;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { id } = req.query;
    const { command } = req.body;

    const challengeId = parseInt(id);
    if (isNaN(challengeId) || challengeId <= 0) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string required' });
    }

    const cleanCommand = command.trim();
    if (!cleanCommand) {
      return res.status(200).json({ output: '' });
    }

    if (cleanCommand.length > MAX_COMMAND_LENGTH) {
      return res.status(400).json({ error: 'Command too long' });
    }

    if (cleanCommand === 'help') {
      const helpText = [
        'pwnlab Challenge Web CLI / Interactive Terminal',
        'Available tools: ' + Array.from(ALLOWED_COMMANDS).join(', '),
        'Note: Only read-only and analysis commands are allowed.',
        ''
      ].join('\r\n');
      return res.status(200).json({ output: helpText });
    }

    const parts = cleanCommand.split(/\s+/);
    const baseCommand = parts[0];

    if (!ALLOWED_COMMANDS.has(baseCommand)) {
      return res.status(403).json({
        output: `pwnlab sandbox: command '${baseCommand}' is not allowed.\r\nType 'help' for available commands.\r\n`
      });
    }

    const { data: challenge, error: challError } = await supabaseAdmin
      .from('challenges')
      .select('id, name, storage_path')
      .eq('id', challengeId)
      .single();

    if (challError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Materialize (or reuse) the challenge environment on disk
    const targetDir = await materializeChallengeDir(user.id, challengeId, challenge.storage_path);

    // Guard: never escape the working directory
    const targetResolved = resolve(targetDir);
    if (!targetResolved.startsWith(resolve(WORK_ROOT))) {
      return res.status(500).json({ error: 'Invalid working directory' });
    }

    const args = parts.slice(1);

    execFile(baseCommand, args, {
      cwd: targetResolved,
      timeout: EXEC_TIMEOUT,
      maxBuffer: MAX_OUTPUT_SIZE,
      env: {
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        TERM: 'xterm-256color',
        USER: 'operator',
        HOME: targetResolved
      }
    }, (err, stdout, stderr) => {
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;
      if (err && !stdout && !stderr) {
        output += `Error: Command failed\r\n`;
      }

      const formattedOutput = output.replace(/\r?\n/g, '\r\n');
      return res.status(200).json({ output: formattedOutput });
    });
  } catch (error) {
    console.error('[API] Terminal exec error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
