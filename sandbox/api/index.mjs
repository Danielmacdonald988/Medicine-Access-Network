import { readFileSync } from 'node:fs';
import { createHash, timingSafeEqual } from 'node:crypto';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/facilitators', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
const digest = (value) => createHash('sha256').update(value).digest();

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'");
  // Hosted deployments fail closed until a separate sandbox password is configured.
  // Local access is confined to loopback by server.mjs.
  const password = process.env.SANDBOX_PASSWORD;
  if (process.env.VERCEL && (!password || password.length < 20)) {
    res.statusCode = 503;
    return res.end('Sandbox locked. Configure a unique SANDBOX_PASSWORD of at least 20 characters.');
  }
  if (password) {
    const expected = 'Basic ' + Buffer.from('reviewer:' + password).toString('base64');
    const actual = String(req.headers.authorization || '');
    if (!timingSafeEqual(digest(expected), digest(actual))) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="Facilitator sandbox", charset="UTF-8"');
      return res.end('Private sandbox. Sign in with your sandbox credentials.');
    }
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return res.end('Sandbox forms are simulated in your browser. No submissions are accepted.');
  }
  const path = new URL(req.url, 'http://sandbox.invalid').pathname;
  if (path === '/robots.txt') {
    res.setHeader('Content-Type', 'text/plain');
    return res.end('User-agent: *\nDisallow: /\n');
  }
  const asset = assets.get(path);
  if (!asset) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  res.setHeader('Content-Type', asset[1]);
  const body = readFileSync(new URL('../ui/' + asset[0], import.meta.url));
  res.statusCode = 200;
  return res.end(req.method === 'HEAD' ? undefined : body);
}
