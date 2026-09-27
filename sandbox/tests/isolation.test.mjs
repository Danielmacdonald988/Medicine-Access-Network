import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import handler from '../api/index.mjs';

function request(path='/', method='GET', auth='') {
  const headers={}; let body='';
  const res={statusCode:200,setHeader(k,v){headers[k]=v;},end(value){body=value?.toString()||'';}};
  handler({url:path,method,headers:{authorization:auth}},res);
  return {status:res.statusCode,headers,body};
}
test('hosted sandbox fails closed without a strong separate password', () => {
  const saved={...process.env};
  try { process.env.VERCEL='1'; delete process.env.SANDBOX_PASSWORD;
    assert.equal(request().status,503);
    process.env.SANDBOX_PASSWORD='short'; assert.equal(request().status,503);
    process.env.SANDBOX_PASSWORD='test-only-password-at-least-20';
    assert.equal(request().status,401);
    assert.equal(request('/style.css').status,401);
    assert.equal(request('/api/index').status,401);
    const auth='Basic '+Buffer.from('reviewer:'+process.env.SANDBOX_PASSWORD).toString('base64');
    assert.equal(request('/','GET',auth).status,200);
    assert.equal(request('/','GET','Basic nonsense').status,401);
    assert.equal(request('/api/contact-requests','POST',auth).status,405);
  } finally { process.env=saved; }
});
test('no production endpoints, static asset bypass, indexing or network access', () => {
  const saved={...process.env};
  try { delete process.env.VERCEL; delete process.env.SANDBOX_PASSWORD;
    assert.equal(request('/api/stripe/checkout','POST').status,405);
    assert.equal(request('/api/facilitators').status,404);
    assert.equal(request('/ui/index.html').status,404);
    assert.equal(request('/../package.json').status,404);
    assert.match(request().headers['Content-Security-Policy'],/connect-src 'none'/);
    assert.match(request().headers['Content-Security-Policy'],/form-action 'none'/);
    assert.match(request().headers['X-Robots-Tag'],/noindex/);
    assert.match(request('/robots.txt').body,/Disallow: \//);
    const js=readFileSync(new URL('../ui/app.js',import.meta.url),'utf8');
    assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)\b/);
    assert.match(request().body,/Fictional profiles/);
  } finally { process.env=saved; }
});
