//node test.js

require('dotenv').config();
const app = require('./src/app');
const http = require('http');

const PORT = process.env.TEST_PORT || 3099;

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost', port: PORT, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : null }));
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(body);
    r.end();
  });
}

let passed = 0, failed = 0;
let token = null;

async function check(name, expectedStatus, fn) {
  try {
    const res = await fn();
    const ok = res.status === expectedStatus;
    console.log(`${ok ? '✓' : '✗'} ${name} (${res.status})`);
    if (!ok) {
      console.log(`  Expected ${expectedStatus}, got ${res.status}: ${JSON.stringify(res.body)}`);
      failed++;
    } else {
      passed++;
    }
    return res;
  } catch (e) {
    console.log(`✗ ${name} — ${e.message}`);
    failed++;
  }
}

const server = app.listen(PORT, async () => {
  console.log(`\n Kinetix Backend Tests\n`);

  await check('GET /health', 200, () => req('GET', '/health'));

  await check('POST register missing fields', 400, () =>
    req('POST', '/api/auth/register', JSON.stringify({ email: 'only@test.com' })));

  const email = 'auto' + Date.now() + '@test.com';

  const reg = await check('POST register', 201, () =>
    req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Auto', apellido: 'Test', email, password: 'abc123' })));

  if (reg && reg.body && reg.body.token) token = reg.body.token;

  await check('POST register duplicate', 409, () =>
    req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Auto', apellido: 'Test', email, password: 'abc123' })));

  const log = await check('POST login', 200, () =>
    req('POST', '/api/auth/login', JSON.stringify({ email, password: 'abc123' })));

  if (log && log.body && log.body.token) token = log.body.token;

  await check('POST login wrong password', 401, () =>
    req('POST', '/api/auth/login', JSON.stringify({ email, password: 'wrong' })));

  await check('GET me with token', 200, () =>
    req('GET', '/api/auth/me', null, token));

  await check('GET me no token', 401, () =>
    req('GET', '/api/auth/me'));

  await check('GET me invalid token', 403, () =>
    req('GET', '/api/auth/me', null, 'bad-token'));

  await check('POST refresh', 200, () =>
    req('POST', '/api/auth/refresh', null, token));

  await check('POST google/callback missing id_token', 400, () =>
    req('POST', '/api/auth/google/callback', JSON.stringify({})));

  await check('POST google/callback bad token', 401, () =>
    req('POST', '/api/auth/google/callback', JSON.stringify({ id_token: 'fake' })));

  await check('POST github/callback missing code', 400, () =>
    req('POST', '/api/auth/github/callback', JSON.stringify({})));

  await check('POST github/callback bad code', 401, () =>
    req('POST', '/api/auth/github/callback', JSON.stringify({ code: 'fake' })));

  console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  server.close();
  process.exit(failed > 0 ? 1 : 0);
});
