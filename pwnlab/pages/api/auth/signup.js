import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { authRateLimit, sanitizeError } from '../../../lib/api-middleware';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimitResult = await authRateLimit(req, res);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many signup attempts. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3-50 characters' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters' });
    }

    const supabase = getSupabaseServerClient(req, res);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (error) {
      return res.status(400).json({ error: 'Failed to create account. Please try again.' });
    }

    return res.status(201).json({
      success: true,
      userId: data.user.id,
      message: 'Account created successfully.',
    });
  } catch (error) {
    console.error('[API] Signup error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
