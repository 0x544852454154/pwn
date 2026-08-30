import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, supabaseAdmin } from './db.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const JWT_SECRET = process.env.JWT_SECRET;
const PIN_HASH_ROUNDS = parseInt(process.env.PIN_HASH_ROUNDS || 10);
const PIN_LENGTH = parseInt(process.env.PIN_LENGTH || 6);

export async function hashPin(pin) {
  return bcrypt.hash(pin, PIN_HASH_ROUNDS);
}

export async function comparePin(pin, hash) {
  return bcrypt.compare(pin, hash);
}

export function generateRandomPin(length = PIN_LENGTH) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function createToken(userId) {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000), jti: crypto.randomBytes(16).toString('hex') },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function createSession(userId) {
  const token = createToken(userId);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const result = await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id',
    [userId, token, expiresAt]
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return token;
}

export async function validateSession(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const result = await query(
    'SELECT id, user_id, expires_at FROM sessions WHERE token = $1',
    [token]
  );

  if (result.error || result.rows.length === 0) return null;

  const session = result.rows[0];
  if (new Date(session.expires_at) < new Date()) {
    await query('DELETE FROM sessions WHERE id = $1', [session.id]);
    return null;
  }

  return session;
}

export async function endSession(token) {
  await query('DELETE FROM sessions WHERE token = $1', [token]);
}

export async function authenticateUser(username, pin) {
  const normalizedUsername = username.trim().toLowerCase();

  const result = await query(
    'SELECT id, pin_hash FROM users WHERE username = $1',
    [normalizedUsername]
  );

  if (result.error || result.rows.length === 0) {
    return { success: false, error: 'INVALID_CREDENTIALS' };
  }

  const user = result.rows[0];
  const isValid = await comparePin(pin, user.pin_hash);

  if (!isValid) {
    return { success: false, error: 'INVALID_CREDENTIALS' };
  }

  const token = await createSession(user.id);
  return { success: true, userId: user.id, token };
}

export async function getCurrentUser(token) {
  const session = await validateSession(token);
  if (session) {
    const result = await query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [session.user_id]
    );
    if (!result.error && result.rows.length > 0) {
      return result.rows[0];
    }
  }

  if (supabaseAdmin) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        const result = await query(
          'SELECT id, username, created_at FROM users WHERE id = $1',
          [user.id]
        );
        if (!result.error && result.rows.length > 0) {
          return result.rows[0];
        }
      }
    } catch (err) {
    }
  }

  return null;
}

export async function userExists(username) {
  const result = await query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );
  return result.rows.length > 0;
}

export async function createUser(username, pin, options = {}) {
  const normalizedUsername = username.toLowerCase().trim();
  const exists = await userExists(normalizedUsername);
  if (exists) {
    return { success: false, error: 'USERNAME_TAKEN' };
  }

  const pinHash = await hashPin(pin);

  let userId = options.userId;

  if (!userId) {
    const dummyEmail = `discord_${Date.now()}@pwnlab.local`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dummyEmail,
      password: generateRandomPin(12),
      email_confirm: true,
      user_metadata: { username: normalizedUsername },
    });

    if (authError || !authData?.user) {
      return { success: false, error: authError?.message || 'Failed to create auth user' };
    }

    userId = authData.user.id;
  }

  const result = await query(
    'INSERT INTO users (id, username, pin_hash) VALUES ($1, $2, $3) RETURNING id, username',
    [userId, normalizedUsername, pinHash]
  );

  if (result.error || result.rows.length === 0) {
    return { success: false, error: result.error?.message || 'Failed to create user' };
  }

  const user = result.rows[0];

  await query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);

  return { success: true, userId: user.id, username: user.username };
}

export async function linkDiscordAccount(userId, discordId, discordUsername) {
  if (!supabaseAdmin) {
    return { user_id: userId };
  }

  const { data, error } = await supabaseAdmin
    .from('discord_accounts')
    .upsert(
      { user_id: userId, discord_id: discordId, username: discordUsername },
      { onConflict: 'discord_id' }
    )
    .select('user_id')
    .single();

  if (error) {
    console.error('[AUTH] Failed to link Discord account');
    return { user_id: userId };
  }

  return data || { user_id: userId };
}

export async function getUserByDiscordId(discordId) {
  const discordResult = await query(
    'SELECT user_id FROM discord_accounts WHERE discord_id = $1',
    [discordId]
  );

  if (discordResult.error || discordResult.rows.length === 0) {
    return null;
  }

  const userResult = await query(
    'SELECT id, username FROM users WHERE id = $1',
    [discordResult.rows[0].user_id]
  );

  return userResult.rows[0] || null;
}

export async function getUserByUsername(username) {
  const result = await query(
    'SELECT id, username, created_at FROM users WHERE username = $1',
    [username]
  );

  return result.rows[0] || null;
}

export async function updateUserPin(userId, newPin) {
  const pinHash = await hashPin(newPin);
  const result = await query(
    'UPDATE users SET pin_hash = $1 WHERE id = $2',
    [pinHash, userId]
  );
  return !result.error;
}
