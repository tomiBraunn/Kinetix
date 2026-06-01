//node test.js

require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const PORT = process.env.TEST_PORT || 3099;
let passed = 0, failed = 0, token = null;

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: PORT, path, method, headers: { 'Content-Type': 'application/json' } };
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

function multipart(path, fieldName, token) {
  return new Promise((resolve) => {
    const boundary = '----testboundary';
    const body = Buffer.concat([
      Buffer.from('--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="' + fieldName + '"; filename="test.png"\r\n' +
        'Content-Type: image/png\r\n\r\n'),
      Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,120,156,99,248,207,192,0,0,3,1,1,0,201,254,146,239,0,0,0,0,73,69,78,68,174,66,96,130]),
      Buffer.from('\r\n--' + boundary + '--\r\n')
    ]);
    const opts = {
      hostname: 'localhost', port: PORT, path, method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length,
        'Authorization': 'Bearer ' + token
      }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : null }));
    });
    r.write(body);
    r.end();
  });
}

async function check(name, expectedStatus, fn) {
  try {
    const res = await fn();
    const ok = res.status === expectedStatus;
    console.log(`${ok ? '\u2713' : '\u2717'} ${name} (${res.status})`);
    if (!ok) { console.log(`  Expected ${expectedStatus}, got ${res.status}: ${JSON.stringify(res.body)}`); failed++; }
    else { passed++; }
    return res;
  } catch (e) {
    console.log(`\u2717 ${name} \u2014 ${e.message}`);
    failed++;
  }
}

const server = app.listen(PORT, async () => {
  console.log(`\n Kinetix Backend Tests\n`);

  // Auth
  await check('GET /health', 200, () => req('GET', '/health'));
  await check('POST register missing fields', 400, () => req('POST', '/api/auth/register', JSON.stringify({ email: 'only@test.com' })));

  const email = 'auto' + Date.now() + '@test.com';
  const reg = await check('POST register', 201, () => req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Auto', apellido: 'Test', email, password: 'abc123' })));
  if (reg && reg.body && reg.body.token) token = reg.body.token;

  await check('POST register duplicate', 409, () => req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Auto', apellido: 'Test', email, password: 'abc123' })));

  const log = await check('POST login', 200, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'abc123' })));
  if (log && log.body && log.body.token) token = log.body.token;

  await check('POST login wrong password', 401, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'wrong' })));
  await check('GET me with token', 200, () => req('GET', '/api/auth/me', null, token));
  await check('GET me no token', 401, () => req('GET', '/api/auth/me'));
  await check('GET me invalid token', 403, () => req('GET', '/api/auth/me', null, 'bad-token'));
  await check('POST refresh', 200, () => req('POST', '/api/auth/refresh', null, token));
  await check('POST google/callback missing id_token', 400, () => req('POST', '/api/auth/google/callback', JSON.stringify({})));
  await check('POST google/callback bad token', 401, () => req('POST', '/api/auth/google/callback', JSON.stringify({ id_token: 'fake' })));
  await check('POST github/callback missing code', 400, () => req('POST', '/api/auth/github/callback', JSON.stringify({})));
  await check('POST github/callback bad code', 401, () => req('POST', '/api/auth/github/callback', JSON.stringify({ code: 'fake' })));

  // Avatar
  await check('register returns avatar_url', 201, async () => {
    const r = await req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Avatar', apellido: 'Test', email: 'avatar' + Date.now() + '@test.com', password: 'abc123' }));
    return { status: r.status, body: r.body, pass: r.status === 201 && !!r.body.kinesiologo.avatar_url };
  });
  await check('login returns avatar_url', 200, async () => {
    const r = await req('POST', '/api/auth/login', JSON.stringify({ email, password: 'abc123' }));
    return { status: r.status, body: r.body, pass: r.status === 200 && !!r.body.kinesiologo.avatar_url };
  });
  await check('me returns avatar_url', 200, async () => {
    const r = await req('GET', '/api/auth/me', null, token);
    return { status: r.status, body: r.body, pass: r.status === 200 && !!r.body.avatar_url };
  });
  await check('avatar_url is signed URL', 201, async () => {
    const r = await req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Signed', apellido: 'Url', email: 'signed' + Date.now() + '@test.com', password: 'abc123' }));
    return { status: r.status, body: r.body, pass: r.status === 201 && r.body.kinesiologo.avatar_url && r.body.kinesiologo.avatar_url.includes('token=') };
  });

  // Upload avatar
  await check('POST upload/avatar no auth', 401, () => req('POST', '/api/upload/avatar'));
  await check('POST upload/avatar with file', 200, async () => {
    const r = await multipart('/api/upload/avatar', 'avatar', token);
    return { status: r.status, body: r.body, pass: r.status === 200 && !!r.body.url && r.body.url.includes('token=') };
  });

  // Upload paciente foto
  await check('POST upload/paciente-foto no auth', 401, () => req('POST', '/api/upload/paciente-foto'));
  await check('POST upload/paciente-foto with file', 200, async () => {
    const r = await multipart('/api/upload/paciente-foto', 'foto', token);
    return { status: r.status, body: r.body, pass: r.status === 200 && !!r.body.url && r.body.url.includes('token=') };
  });

  // Pacientes CRUD
  let pacienteId = null;
  await check('POST pacientes no auth', 401, () => req('POST', '/api/pacientes', JSON.stringify({ nombre: 'Ana', apellido: 'Lopez' })));
  const created = await check('POST pacientes create', 201, () => req('POST', '/api/pacientes', JSON.stringify({ nombre: 'Ana', apellido: 'Lopez', tipo_lesion: 'hombro' }), token));
  if (created && created.body && created.body.id) pacienteId = created.body.id;

  await check('POST pacientes missing fields', 400, () => req('POST', '/api/pacientes', JSON.stringify({}), token));
  await check('GET pacientes list', 200, () => req('GET', '/api/pacientes', null, token));
  await check('GET pacientes by id', 200, () => req('GET', '/api/pacientes/' + pacienteId, null, token).catch(() => ({ status: 0 })));
  await check('GET pacientes not found', 404, () => req('GET', '/api/pacientes/00000000-0000-0000-0000-000000000000', null, token));
  await check('PUT pacientes update', 200, () => req('PUT', '/api/pacientes/' + pacienteId, JSON.stringify({ observaciones: 'mejorando' }), token).catch(() => ({ status: 0 })));
  await check('DELETE pacientes', 204, async () => { if (!pacienteId) return { status: 0 }; return req('DELETE', '/api/pacientes/' + pacienteId, null, token); });
  await check('GET deleted pacientes', 404, async () => { if (!pacienteId) return { status: 0 }; return req('GET', '/api/pacientes/' + pacienteId, null, token); });

  console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total\n`);
  server.close();
  process.exit(failed > 0 ? 1 : 0);
});
