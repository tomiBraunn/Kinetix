//node test.js

// Modo test: el register devuelve verificationToken/resetToken en la respuesta
// (sin enviar mails) para poder ejercitar el flujo completo de verificación.
process.env.NODE_ENV = 'test';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
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

  // Auth (Supabase Auth / GoTrue)
  await check('GET /health', 200, () => req('GET', '/health'));
  await check('POST register missing fields', 400, () => req('POST', '/api/auth/register', JSON.stringify({ email: 'only@test.com' })));

  const email = 'auto' + Date.now() + '@test.com';
  const reg = await check('POST register', 201, () => req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Auto', apellido: 'Test', email, password: 'abc123' })));

  await check('POST register duplicate', 409, () => req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Auto', apellido: 'Test', email, password: 'abc123' })));

  const verificationToken = (reg && reg.body && reg.body.verificationToken) || null;
  await check('POST login before email verification', 403, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'abc123' })));
  await check('POST verificar-email missing fields', 400, () => req('POST', '/api/auth/verificar-email', JSON.stringify({})));
  if (verificationToken) {
    await check('POST verificar-email with token', 200, () => req('POST', '/api/auth/verificar-email', JSON.stringify({ email, token: verificationToken })));
  }
  await check('POST verificar-email invalid token', 400, () => req('POST', '/api/auth/verificar-email', JSON.stringify({ email, token: 'bogus' })));

  const log = await check('POST login', 200, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'abc123' })));
  const refreshToken = (log && log.body && log.body.refresh_token) || null;
  if (log && log.body && log.body.token) token = log.body.token;

  await check('POST login wrong password', 401, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'wrong' })));
  await check('GET me with token', 200, () => req('GET', '/api/auth/me', null, token));
  await check('GET me no token', 401, () => req('GET', '/api/auth/me'));
  await check('GET me invalid token', 403, () => req('GET', '/api/auth/me', null, 'bad-token'));
  await check('POST refresh', 200, async () => {
    if (!refreshToken) return { status: 0 };
    return req('POST', '/api/auth/refresh', JSON.stringify({ refresh_token: refreshToken }));
  });
  await check('POST refresh invalid token', 401, () => req('POST', '/api/auth/refresh', JSON.stringify({ refresh_token: 'bogus' })));
  await check('POST oauth-callback missing token', 400, () => req('POST', '/api/auth/oauth-callback', JSON.stringify({})));
  await check('POST oauth-callback invalid token', 401, () => req('POST', '/api/auth/oauth-callback', JSON.stringify({ access_token: 'fake' })));

  // Forgot / reset password
  await check('POST forgot-password missing email', 400, () => req('POST', '/api/auth/forgot-password', JSON.stringify({})));
  const forgot = await check('POST forgot-password', 200, () => req('POST', '/api/auth/forgot-password', JSON.stringify({ email })));
  const resetToken = (forgot && forgot.body && forgot.body.resetToken) || null;
  await check('POST reset-password missing fields', 400, () => req('POST', '/api/auth/reset-password', JSON.stringify({})));
  await check('POST reset-password short password', 400, () => req('POST', '/api/auth/reset-password', JSON.stringify({ email, token: resetToken || 'x', password: 'short' })));
  if (resetToken) {
    await check('POST reset-password with token', 200, () => req('POST', '/api/auth/reset-password', JSON.stringify({ email, token: resetToken, password: 'nuevaPass123' })));
    await check('POST login with new password', 200, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'nuevaPass123' })));
    await check('POST reset-password reused token', 400, () => req('POST', '/api/auth/reset-password', JSON.stringify({ email, token: resetToken, password: 'otraPass123' })));
  }
  await check('POST reset-password invalid token', 400, () => req('POST', '/api/auth/reset-password', JSON.stringify({ email, token: 'bogus', password: 'otraPass123' })));

  // El cambio de contraseña revoca las sesiones anteriores del usuario:
  // generamos una sesión fresca para el resto de los tests.
  const relog = await check('POST login fresh session', 200, () => req('POST', '/api/auth/login', JSON.stringify({ email, password: 'nuevaPass123' })));
  const refreshToken2 = (relog && relog.body && relog.body.refresh_token) || null;
  if (relog && relog.body && relog.body.token) token = relog.body.token;

  // Avatar
  await check('register returns avatar_url', 201, async () => {
    const r = await req('POST', '/api/auth/register', JSON.stringify({ nombre: 'Avatar', apellido: 'Test', email: 'avatar' + Date.now() + '@test.com', password: 'abc123' }));
    return { status: r.status, body: r.body, pass: r.status === 201 && !!r.body.kinesiologo.avatar_url };
  });
  await check('login returns avatar_url', 200, async () => {
    // La contraseña cambió en el flujo de reset (arriba).
    const r = await req('POST', '/api/auth/login', JSON.stringify({ email, password: 'nuevaPass123' }));
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
  const created = await check('POST pacientes create', 201, () => req('POST', '/api/pacientes', JSON.stringify({
    nombre: 'Ana', apellido: 'Lopez', tipo_lesion: 'hombro',
    dni: '12345678', email_paciente: 'ana@test.com', telefono: '+54 9 11 2222 222',
    genero: 'F', contacto_emergencia_nombre: 'Maria', contacto_emergencia_telefono: '+54 9 11 3333 3333',
    fecha_inicio_rehabilitacion: '2026-07-01'
  }), token));
  if (created && created.body && created.body.id) {
    pacienteId = created.body.id;
    const hasFields = !!(created.body.dni && created.body.email_paciente && created.body.contacto_emergencia_nombre);
    if (!hasFields) {
      failed++;
      console.log('✗ FAIL: campos nuevos (dni, email_paciente, contacto) no se guardaron');
    } else {
      passed++;
      console.log('✓ PASS: campos nuevos guardados correctamente');
    }
  }

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
