import { supabaseAdmin } from '../../../lib/db';
import { requireAuth, sanitizeError } from '../../../lib/api-middleware';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('bio, specialties, current_streak, longest_streak, last_solve_at')
        .eq('user_id', user.id)
        .single();

      const meta = typeof profile?.bio === 'string' ? JSON.parse(profile.bio || '{}') : {};
      const settings = {
        bio: meta.bio || '',
        banner_url: meta.banner_url || null,
        email_notifications: meta.email_notifications !== false,
        public_profile: meta.public_profile !== false,
        show_discord_status: meta.show_discord_status !== false,
        specialties: profile?.specialties || [],
        current_streak: profile?.current_streak || 0,
        longest_streak: profile?.longest_streak || 0
      };

      return res.status(200).json({ settings });
    } catch (error) {
      console.error('[API] Get settings error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { bio, banner_url, email_notifications, public_profile, show_discord_status, specialties } = req.body;

      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('bio')
        .eq('user_id', user.id)
        .single();

      const meta = typeof currentProfile?.bio === 'string' ? JSON.parse(currentProfile.bio || '{}') : {};

      if (typeof bio === 'string') meta.bio = bio.substring(0, 500);
      if (typeof banner_url !== 'undefined') meta.banner_url = banner_url;
      if (typeof email_notifications === 'boolean') meta.email_notifications = email_notifications;
      if (typeof public_profile === 'boolean') meta.public_profile = public_profile;
      if (typeof show_discord_status === 'boolean') meta.show_discord_status = show_discord_status;

      const serialized = JSON.stringify(meta);

      const profileUpdates = { bio: serialized, updated_at: new Date().toISOString() };
      if (Array.isArray(specialties)) {
        profileUpdates.specialties = specialties;
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', user.id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API] Update settings error');
      return res.status(500).json({ error: sanitizeError(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
