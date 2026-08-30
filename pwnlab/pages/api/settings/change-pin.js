import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN required' });
    }

    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be exactly 6 digits' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('pin_hash')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPin, userData.pin_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    const newPinHash = await bcrypt.hash(newPin, 10);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ pin_hash: newPinHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) throw updateError;

    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'PIN_CHANGED',
      resource_type: 'user',
      resource_id: user.id,
      details: 'User changed their PIN'
    });

    return res.status(200).json({ success: true, message: 'PIN updated successfully' });
  } catch (error) {
    console.error('[API] Change PIN error');
    return res.status(500).json({ error: sanitizeError(error) });
  }
}
