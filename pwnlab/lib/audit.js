import { supabaseAdmin } from './db';
import { getClientIp } from './api-middleware';

export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  SIGNUP: 'SIGNUP',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  FLAG_SUBMITTED: 'FLAG_SUBMITTED',
  FLAG_CORRECT: 'FLAG_CORRECT',
  FLAG_INCORRECT: 'FLAG_INCORRECT',
  FIRST_BLOOD: 'FIRST_BLOOD',
  TEAM_CREATED: 'TEAM_CREATED',
  TEAM_JOINED: 'TEAM_JOINED',
  TEAM_LEFT: 'TEAM_LEFT',
  FRIEND_ADDED: 'FRIEND_ADDED',
  FRIEND_REMOVED: 'FRIEND_REMOVED',
  SESSION_INVALIDATED: 'SESSION_INVALIDATED',
  PIN_REGENERATED: 'PIN_REGENERATED',
};

export async function logAudit(action, userId, req = null, details = {}) {
  try {
    const ip = req ? getClientIp(req) : null;
    const userAgent = req?.headers?.['user-agent'] || null;

    const { error } = await supabaseAdmin
      .from('audit_log')
      .insert({
        action,
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        details: Object.keys(details).length > 0 ? details : null,
      });

    if (error) {
      console.error('[AUDIT] Failed to log audit event:', error.message);
    }
  } catch (err) {
    console.error('[AUDIT] Audit logging error:', err.message);
  }
}

export async function getUserAuditLog(userId, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AUDIT] Failed to fetch audit log:', error.message);
    return [];
  }

  return data || [];
}

export async function getRecentAuditLog(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .select('*, user:users(username)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AUDIT] Failed to fetch recent audit log:', error.message);
    return [];
  }

  return data || [];
}
