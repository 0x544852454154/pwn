import { supabaseAdmin } from '../../../../lib/db';
import { requireAuth, sanitizeError } from '../../../../lib/api-middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { id } = req.query;
    const machineId = parseInt(id);

    if (isNaN(machineId) || machineId <= 0) {
      return res.status(400).json({ error: 'Invalid machine ID' });
    }

    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('machine_instances')
      .select('id, machine:machines(name)')
      .eq('machine_id', machineId)
      .eq('user_id', user.id)
      .eq('status', 'RUNNING')
      .maybeSingle();

    if (fetchError || !instance) {
      return res.status(404).json({ error: 'No running instance found' });
    }

    await supabaseAdmin
      .from('machine_instances')
      .update({ status: 'STOPPED' })
      .eq('id', instance.id);

    await supabaseAdmin
      .from('activity_log')
      .insert({
        user_id: user.id,
        action: 'MACHINE_STOPPED',
        details: `Stopped machine: ${instance.machine?.name || 'Unknown'}`
      });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Stop machine error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
