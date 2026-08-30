function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    const key = name.trim();
    if (key) {
      cookies[key] = decodeURIComponent(rest.join('=').trim());
    }
  });
  return cookies;
}

function getCookie(req, name) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[name] || null;
}

module.exports = { getCookie, parseCookies };
