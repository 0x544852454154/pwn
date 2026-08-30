import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const challengeId = parseInt(id);

    if (isNaN(challengeId) || challengeId <= 0) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const { data: machines, error } = await supabaseAdmin
      .from('machines')
      .select('id, name, target_ip, ports, status, created_at')
      .eq('challenge_id', challengeId)
      .order('id', { ascending: true });

    if (error) throw error;

    const machinesWithInstances = await Promise.all(
      (machines || []).map(async (m) => {
        const { data: instance } = await supabaseAdmin
          .from('machine_instances')
          .select('id, instance_id, status, target_ip')
          .eq('machine_id', m.id)
          .eq('user_id', user.id)
          .eq('status', 'RUNNING')
          .maybeSingle();

        return {
          ...m,
          instance: instance || null,
          status: instance ? 'RUNNING' : m.status
        };
      })
    );

    return res.status(200).json({ machines: machinesWithInstances });
  } catch (error) {
    console.error('[API] Machines list error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
