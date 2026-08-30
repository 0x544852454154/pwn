import { createServerClient } from '@supabase/ssr';
import { parseCookies } from './cookies';

export function getSupabaseServerClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookies = parseCookies(req.headers.cookie || '');
          return Object.entries(cookies).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            const cookieParts = [`${name}=${value}`];
            if (options?.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`);
            if (options?.path) cookieParts.push(`Path=${options.path}`);
            if (options?.domain) cookieParts.push(`Domain=${options.domain}`);
            if (options?.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
            if (options?.secure) cookieParts.push('Secure');
            if (options?.httpOnly) cookieParts.push('HttpOnly');
            res.setHeader('Set-Cookie', cookieParts.join('; '));
          }
        },
      },
    }
  );
}
