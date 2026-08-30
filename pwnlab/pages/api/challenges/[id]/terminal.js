import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';
import { execFile } from 'child_process';
import path, { resolve } from 'path';
import { existsSync } from 'fs';

const CHALLENGE_FILES_ROOT = '/home/misery/pwnlab/challenges';

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

    const folderPath = challenge.storage_path || '';
    const rootResolved = resolve(CHALLENGE_FILES_ROOT);
    const targetDir = resolve(rootResolved, folderPath);

    if (!targetDir.startsWith(rootResolved) || !existsSync(targetDir)) {
      return res.status(404).json({ error: 'Challenge environment directory not found' });
    }

    const args = parts.slice(1);

    execFile(baseCommand, args, {
      cwd: targetDir,
      timeout: EXEC_TIMEOUT,
      maxBuffer: MAX_OUTPUT_SIZE,
      env: {
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        TERM: 'xterm-256color',
        USER: 'operator',
        HOME: targetDir
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
