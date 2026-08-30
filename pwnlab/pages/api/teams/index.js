import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { search = '' } = req.query;
      const searchLower = typeof search === 'string' ? search.toLowerCase().trim() : '';

      const [teamsRes, teamMembersRes, completionsRes] = await Promise.all([
        supabaseAdmin.from('teams').select('id, name, owner_id, created_at, owner:users(username)'),
        supabaseAdmin.from('team_members').select('team_id, user_id'),
        supabaseAdmin.from('challenge_completions').select('user_id, points_earned')
      ]);

      const teams = teamsRes.data || [];
      const teamMembers = teamMembersRes.data || [];
      const completions = completionsRes.data || [];

      const userPoints = {};
      for (const c of completions) {
        userPoints[c.user_id] = (userPoints[c.user_id] || 0) + (c.points_earned || 0);
      }

      const teamMap = {};
      for (const t of teams) {
        if (searchLower && !t.name.toLowerCase().includes(searchLower)) {
          continue;
        }
        teamMap[t.id] = {
          id: t.id,
          name: t.name,
          owner_id: t.owner_id,
          owner_username: t.owner?.username || 'operator',
          member_count: 0,
          team_points: 0
        };
      }

      let myTeamId = null;
      for (const tm of teamMembers) {
        if (tm.user_id === user.id) {
          myTeamId = tm.team_id;
        }
        if (teamMap[tm.team_id]) {
          teamMap[tm.team_id].member_count += 1;
          teamMap[tm.team_id].team_points += (userPoints[tm.user_id] || 0);
        }
      }

      const sortedTeams = Object.values(teamMap).sort((a, b) => b.team_points - a.team_points);

      return res.status(200).json({
        teams: sortedTeams,
        myTeamId,
      });
    } catch (error) {
      console.error('[API] Teams list error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 50) {
        return res.status(400).json({ error: 'Team name must be between 3 and 50 characters' });
      }

      const cleanName = name.trim();

      const { data: existingMembership } = await supabaseAdmin
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMembership) {
        return res.status(400).json({ error: 'You are already a member of a team' });
      }

      const { data: nameCollision } = await supabaseAdmin
        .from('teams')
        .select('id')
        .ilike('name', cleanName)
        .maybeSingle();

      if (nameCollision) {
        return res.status(400).json({ error: 'A team with this name already exists' });
      }

      const { data: newTeam, error: teamError } = await supabaseAdmin
        .from('teams')
        .insert({ name: cleanName, owner_id: user.id })
        .select('id, name')
        .single();

      if (teamError || !newTeam) {
        console.error('[API] Create team error');
        return res.status(500).json({ error: 'Failed to create team' });
      }

      await supabaseAdmin.from('team_members').insert({
        team_id: newTeam.id,
        user_id: user.id,
        role: 'LEADER'
      });

      return res.status(201).json({ success: true, team: newTeam });
    } catch (error) {
      console.error('[API] Create team error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
