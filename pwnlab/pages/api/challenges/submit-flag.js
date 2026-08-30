import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError, getClientIp } from '../../../lib/api-middleware';

const failedAttemptsMap = new Map();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

function checkRateLimit(key) {
  const now = Date.now();
  const attempts = failedAttemptsMap.get(key) || [];
  const recentAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  failedAttemptsMap.set(key, recentAttempts);

  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0];
    const remainingMs = oldestAttempt + RATE_LIMIT_WINDOW_MS - now;
    const cooldownSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
    return { limited: true, cooldownSeconds };
  }

  return { limited: false, cooldownSeconds: 0 };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const attempts = failedAttemptsMap.get(key) || [];
  attempts.push(now);
  failedAttemptsMap.set(key, attempts);
}

function clearRateLimit(key) {
  failedAttemptsMap.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of failedAttemptsMap.entries()) {
    const recentAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recentAttempts.length === 0) {
      failedAttemptsMap.delete(key);
    } else {
      failedAttemptsMap.set(key, recentAttempts);
    }
  }
}, 5 * 60 * 1000);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { challengeId, flag } = req.body;

    if (!challengeId || typeof flag !== 'string') {
      return res.status(400).json({ error: 'Challenge ID and flag required' });
    }

    const challId = parseInt(challengeId);
    if (isNaN(challId) || challId <= 0) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    if (flag.length > 500) {
      return res.status(400).json({ error: 'Flag too long' });
    }

    const clientIp = getClientIp(req);
    const rateLimitKey = `${user.id}:${challId}:${clientIp}`;

    const { limited, cooldownSeconds } = checkRateLimit(rateLimitKey);
    if (limited) {
      res.setHeader('Retry-After', cooldownSeconds);
      return res.status(429).json({
        success: false,
        correct: false,
        error: 'RATE_LIMITED',
        cooldown: cooldownSeconds,
        message: `Too many failed flag submissions. Please wait ${cooldownSeconds}s before trying again.`,
      });
    }

    const { data: challenge, error: challError } = await supabaseAdmin
      .from('challenges')
      .select('id, name, flag, points')
      .eq('id', challId)
      .single();

    if (challError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const cleanSubmittedFlag = flag.trim();
    const isCorrect = cleanSubmittedFlag === challenge.flag.trim();

    await supabaseAdmin
      .from('challenge_submissions')
      .upsert({
        user_id: user.id,
        challenge_id: challId,
        flag_submitted: cleanSubmittedFlag,
        is_correct: isCorrect,
      }, { onConflict: 'user_id, challenge_id' });

    if (!isCorrect) {
      recordFailedAttempt(rateLimitKey);
      return res.status(200).json({
        success: false,
        correct: false,
        message: 'Invalid flag',
      });
    }

    clearRateLimit(rateLimitKey);

    const { data: existingCompletion } = await supabaseAdmin
      .from('challenge_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challId)
      .maybeSingle();

    const { count: priorSolvesCount } = await supabaseAdmin
      .from('challenge_completions')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challId);

    const isFirstBlood = (priorSolvesCount || 0) === 0;

    let pointsEarned = 0;
    if (!existingCompletion) {
      pointsEarned = challenge.points;
      await supabaseAdmin
        .from('challenge_completions')
        .insert({
          user_id: user.id,
          challenge_id: challId,
          points_earned: pointsEarned,
        });

      await supabaseAdmin
        .from('activity_log')
        .insert({
          user_id: user.id,
          action: isFirstBlood ? 'FIRST_BLOOD' : 'CHALLENGE_COMPLETED',
          details: isFirstBlood
            ? `FIRST BLOOD: ${user.username} solved [${challenge.name}] (+${pointsEarned} pts)`
            : `Solved challenge: ${challenge.name} (+${pointsEarned} pts)`,
        });
    }

    return res.status(200).json({
      success: true,
      correct: true,
      pointsEarned,
      isFirstBlood,
      message: isFirstBlood
        ? `FIRST BLOOD! You were the first to conquer ${challenge.name}!`
        : 'Flag accepted!',
    });
  } catch (error) {
    console.error('[API] Flag submission error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
