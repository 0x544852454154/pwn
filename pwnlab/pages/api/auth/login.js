import { authenticateUser, getCurrentUser } from '../../../lib/auth';
import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { authRateLimit, sanitizeError } from '../../../lib/api-middleware';
import { logAudit, AuditAction } from '../../../lib/audit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await authRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  try {
    const { username, pin, email, password } = req.body;

    if (email && password) {
      const supabase = getSupabaseServerClient(req, res);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logAudit(AuditAction.LOGIN_FAILED, null, req, { email, reason: 'supabase_error' });
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = await getCurrentUser(data.session.access_token);
      if (!user) {
        await logAudit(AuditAction.LOGIN_FAILED, null, req, { email, reason: 'user_not_found' });
        return res.status(401).json({ error: 'User not found' });
      }

      res.setHeader(
        'Set-Cookie',
        `pwnlab_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
      );

      await logAudit(AuditAction.LOGIN, user.id, req, { email, method: 'supabase' });

      return res.status(200).json({
        success: true,
        userId: user.id,
        username: user.username,
        method: 'supabase',
      });
    }

    if (!username || !pin) {
      return res.status(400).json({ error: 'Username and PIN required' });
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3-50 characters' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (typeof pin !== 'string' || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    const result = await authenticateUser(normalizedUsername, pin);

    if (!result.success) {
      const errorMessage = result.error === 'INVALID_CREDENTIALS'
        ? 'Invalid username or PIN. If you used Discord to sign up, type "pwn login" in Discord to regenerate your PIN.'
        : 'Authentication failed';
      await logAudit(AuditAction.LOGIN_FAILED, null, req, { username: normalizedUsername, reason: result.error });
      return res.status(401).json({ error: errorMessage });
    }

    res.setHeader(
      'Set-Cookie',
      `pwnlab_token=${result.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
    );

    await logAudit(AuditAction.LOGIN, result.userId, req, { username, method: 'pin' });

    return res.status(200).json({
      success: true,
      userId: result.userId,
      username,
      method: 'pin',
    });
  } catch (error) {
    console.error('[API] Login error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
