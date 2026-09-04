// Dev reverse-proxy: the browser calls THIS app's own origin (http://localhost:3001/api/*),
// and we forward server-side to the real API. That makes the auth cookies FIRST-PARTY for
// localhost, so SameSite=Lax cookies are sent normally — no CORS, no cross-site/third-party
// cookie problems. This is the recommended way to develop a front-end locally against a
// deployed API that uses httpOnly cookies.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REMOTE = (process.env.REMOTE_API_ORIGIN || 'https://api.shayegandesign.com').replace(
  /\/+$/,
  '',
);

async function proxy(req, ctx) {
  const segments = (await ctx?.params)?.path ?? [];
  const path = segments.join('/'); // e.g. "v1/auth/login" or "v1/profile"
  const search = new URL(req.url).search;
  const target = `${REMOTE}/api/${path}${search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('referer');
  // Present the forwarded call as same-origin to the API, so its CSRF guard passes
  headers.set('origin', REMOTE);

  // Ensure Cookie header from browser is explicitly preserved and passed to backend
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  const remoteRes = await fetch(target, { method: req.method, headers, body, redirect: 'manual' });

  const buf = Buffer.from(await remoteRes.arrayBuffer());
  const outHeaders = new Headers(remoteRes.headers);
  outHeaders.delete('content-encoding'); // body is already decompressed by fetch
  outHeaders.delete('content-length');
  outHeaders.delete('transfer-encoding');
  outHeaders.delete('set-cookie');

  const res = new Response(buf, { status: remoteRes.status, headers: outHeaders });

  // Re-emit Set-Cookie stripped of `Secure` and `Domain`, so the cookies are stored
  // first-party for http://localhost (any browser).
  let setCookies = [];
  if (typeof remoteRes.headers.getSetCookie === 'function') {
    setCookies = remoteRes.headers.getSetCookie();
  }
  if ((!setCookies || setCookies.length === 0) && remoteRes.headers.raw) {
    try {
      const raw = remoteRes.headers.raw();
      if (raw && raw['set-cookie']) {
        setCookies = raw['set-cookie'];
      }
    } catch { /* ignore */ }
  }
  if (!setCookies || setCookies.length === 0) {
    const rawVal = remoteRes.headers.get('set-cookie');
    if (rawVal) {
      setCookies = rawVal.split(/,(?=\s*[\w\.\-]+=)/g);
    }
  }

  for (const cookie of setCookies) {
    res.headers.append(
      'set-cookie',
      cookie.replace(/;\s*Secure/gi, '').replace(/;\s*Domain=[^;]*/gi, ''),
    );
  }
  return res;
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as OPTIONS,
  proxy as HEAD,
};
