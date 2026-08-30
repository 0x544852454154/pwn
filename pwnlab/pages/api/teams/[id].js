import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const teamId = parseInt(id);

  if (isNaN(teamId) || teamId <= 0) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }

  if (req.method === 'GET') {
    try {
      const [teamRes, membersRes, completionsRes] = await Promise.all([
        supabaseAdmin.from('teams').select('id, name, owner_id, created_at, owner:users(username)').eq('id', teamId).single(),
        supabaseAdmin.from('team_members').select('role, joined_at, user:users(id, username)').eq('team_id', teamId),
        supabaseAdmin.from('challenge_completions').select('user_id, points_earned')
      ]);

      if (teamRes.error || !teamRes.data) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const team = teamRes.data;
      const members = membersRes.data || [];
      const completions = completionsRes.data || [];

      const userPoints = {};
      for (const c of completions) {
        userPoints[c.user_id] = (userPoints[c.user_id] || 0) + (c.points_earned || 0);
      }

      const formattedMembers = members.map(m => ({
        id: m.user?.id,
        username: m.user?.username || 'operator',
        role: m.role || 'MEMBER',
        joined_at: m.joined_at,
        points: userPoints[m.user?.id] || 0
      })).sort((a, b) => b.points - a.points);

      const totalPoints = formattedMembers.reduce((sum, m) => sum + m.points, 0);
      const isMember = formattedMembers.some(m => m.id === user.id);

      return res.status(200).json({
        team: {
          id: team.id,
          name: team.name,
          owner_id: team.owner_id,
          owner_username: team.owner?.username || 'operator',
          created_at: team.created_at,
          members: formattedMembers,
          totalPoints,
          isMember,
        },
      });
    } catch (error) {
      console.error('[API] Team detail error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
