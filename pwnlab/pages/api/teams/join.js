import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { teamId } = req.body;
    const targetTeamId = parseInt(teamId);

    if (isNaN(targetTeamId) || targetTeamId <= 0) {
      return res.status(400).json({ error: 'Valid Team ID required' });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', targetTeamId)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const { data: existingMembership } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of a team' });
    }

    await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: targetTeamId,
        user_id: user.id,
        role: 'MEMBER'
      });

    await supabaseAdmin
      .from('activity_log')
      .insert({
        user_id: user.id,
        action: 'TEAM_JOINED',
        details: `Joined team: ${team.name}`
      });

    return res.status(200).json({ success: true, message: `Joined team ${team.name}` });
  } catch (error) {
    console.error('[API] Join team error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
