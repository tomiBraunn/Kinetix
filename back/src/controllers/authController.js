// Auth con Supabase Auth (GoTrue). El backend actúa como proxy: la webapp le
// manda credenciales/tokens y acá se habla con la API admin de GoTrue.
// La tabla kinesiologos guarda el perfil; para cuentas de email/password,
// kinesiologos.id == auth.users.id.

const supabase = require('../utils/supabase');
const kinesiologoModel = require('../models/kinesiologo');
const { uploadAvatar } = require('../utils/avatar');
const mailer = require('../utils/mailer');

const isTest = process.env.NODE_ENV === 'test';

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

// Redime un token de un link de GoTrue (signup / recovery / magiclink)
// pegándole al mismo endpoint que usa el link del mail. El endpoint responde
// 303 con un Location: si el token es válido trae #access_token=... en el
// fragment; si no, error= en la query. Se usa tanto para verificar email /
// resetear contraseña (solo importa si fue ok) como para el login con Google
// (además hace falta el access_token para armar la sesión).
async function redeemAuthLink(token, type) {
  const url =
    `${process.env.SUPABASE_URL}/auth/v1/verify` +
    `?token=${encodeURIComponent(token)}` +
    `&type=${type}` +
    `&redirect_to=${encodeURIComponent(frontendUrl())}`;
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY },
  });
  const location = res.headers.get('location') || '';
  const ok =
    (res.status === 200 || res.status === 302 || res.status === 303) &&
    !location.includes('error=') &&
    (location.includes('access_token') || location.includes('code=') || location === '');
  if (!ok) return null;

  const params = new URLSearchParams(location.split('#')[1] || '');
  return { accessToken: params.get('access_token'), refreshToken: params.get('refresh_token') };
}

// POST directo a GoTrue (token grant). El SDK cambia el rol de las queries a
// anon cuando se loguea una sesión, rompiendo el acceso por service_role — por
// eso login/refresh van por fetch crudo.
async function gotrueToken(grantType, payload) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

// Busca un usuario de GoTrue por email (getUserByEmail no existe en esta
// versión del SDK; listUsers con perPage alto alcanza para esta escala).
async function findAuthUserByEmail(email) {
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (data?.users || []).find((u) => u.email === email) || null;
}

function toUserPayload(k) {
  return {
    id: k.id,
    nombre: k.nombre,
    apellido: k.apellido,
    email: k.email,
    avatar_url: k.avatar_url,
    email_verificado: k.email_verificado,
  };
}

// Re-apunta los datos de un kinesiologo viejo (id aleatorio) al id de auth.users.
// Los pacientes referencian por FK kinesiologo_id: se mueven antes de cambiar el id.
async function relinkKinesiologo(oldId, newId) {
  await supabase.from('pacientes').update({ kinesiologo_id: newId }).eq('kinesiologo_id', oldId);
  await supabase.from('kinesiologos').update({ id: newId }).eq('id', oldId);
}

// Se asegura de que exista la fila de perfil (kinesiologos) para un user de
// GoTrue (login por OAuth o login de un usuario migrado). Devuelve la fila.
async function syncKinesiologo(authUser, { avatarUrl } = {}) {
  let row = await kinesiologoModel.findById(authUser.id);

  if (!row) {
    // Puede existir la fila con otro id (mismo email, cuenta pre-migración).
    row = await kinesiologoModel.findByEmail(authUser.email);
    if (row && row.id !== authUser.id) {
      await relinkKinesiologo(row.id, authUser.id);
      row = await kinesiologoModel.findById(authUser.id);
    } else if (!row) {
      const meta = authUser.user_metadata || {};
      const nombre = meta.nombre || (meta.full_name || '').split(' ')[0] || '';
      const apellido = meta.apellido || (meta.full_name || '').split(' ').slice(1).join(' ') || '';
      row = await kinesiologoModel.create({
        id: authUser.id,
        email: authUser.email,
        nombre,
        apellido,
        email_verificado: true,
      });
    }
  }

  if (!row.avatar_url) {
    const picture = avatarUrl || (authUser.user_metadata && authUser.user_metadata.avatar_url);
    const avatar_url = picture || (await uploadAvatar(row.nombre, row.apellido, row.id));
    await kinesiologoModel.update(row.id, { avatar_url });
    row.avatar_url = avatar_url;
  }

  return row;
}

async function register(req, res) {
  try {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'nombre, apellido, email and password are required' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { nombre, apellido },
    });
    const authUser = data?.user;

    if (error || !authUser) {
      if (error?.message && /already registered|already been registered/i.test(error.message)) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw error || new Error('No se pudo crear el usuario');
    }

    const kinesiologo = await kinesiologoModel.create({
      id: authUser.id,
      nombre,
      apellido,
      email,
      email_verificado: false,
    });

    const avatar_url = await uploadAvatar(nombre, apellido, kinesiologo.id);
    await kinesiologoModel.update(kinesiologo.id, { avatar_url });
    kinesiologo.avatar_url = avatar_url;

    // En modo test no confiamos en el mail: generamos el link de confirmación
    // (sin enviarlo) y lo exponemos para que el test complete el flujo.
    let verificationToken = null;
    if (isTest) {
      const link = await supabase.auth.admin.generateLink({ type: 'signup', email });
      verificationToken = link?.data?.properties?.hashed_token || null;
    }

    res.status(201).json({
      message: 'Revisá tu email para verificar la cuenta.',
      kinesiologo: toUserPayload(kinesiologo),
      ...(isTest && verificationToken ? { verificationToken } : {}),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: 'email and token are required' });
    }

    const session = await redeemAuthLink(token, 'signup');
    if (!session) {
      return res.status(400).json({ error: 'El link de verificación es inválido o expiró.' });
    }

    const kinesiologo = await kinesiologoModel.findByEmail(email);
    if (kinesiologo) {
      await kinesiologoModel.update(kinesiologo.id, { email_verificado: true });
    }

    res.json({ message: 'Email verificado. Ya podés iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    let resetToken = null;

    if (await findAuthUserByEmail(email)) {
      if (isTest) {
        const link = await supabase.auth.admin.generateLink({ type: 'recovery', email });
        resetToken = link?.data?.properties?.hashed_token || null;
      } else {
        await supabase.auth.admin.resetPasswordForEmail(email, {
          redirectTo: `${frontendUrl()}/restablecer-password`,
        });
      }
    }

    // Siempre respondemos lo mismo para no revelar qué emails existen.
    res.json({
      message: 'Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña.',
      ...(isTest && resetToken ? { resetToken } : {}),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: 'email, token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const session = await redeemAuthLink(token, 'recovery');
    if (!session) {
      return res.status(400).json({ error: 'El link es inválido o expiró. Pedí uno nuevo.' });
    }

    const authUser = await findAuthUserByEmail(email);
    if (!authUser) {
      return res.status(400).json({ error: 'No se encontró la cuenta asociada a ese email.' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, { password });
    if (updateError) {
      return res.status(400).json({ error: 'No se pudo actualizar la contraseña. Probá de nuevo.' });
    }

    res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { status, body } = await gotrueToken('password', { email, password });
    if (status !== 200) {
      if (body.error_code === 'email_not_confirmed') {
        return res.status(403).json({ error: 'Debés verificar tu cuenta. Revisá el email que te enviamos al registrarte.' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const authUser = body.user;
    let kinesiologo = await kinesiologoModel.findById(authUser.id);
    if (!kinesiologo) {
      kinesiologo = await syncKinesiologo(authUser);
    }

    res.json({
      token: body.access_token,
      refresh_token: body.refresh_token,
      kinesiologo: toUserPayload(kinesiologo),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Callback del flow de redirect con passport (GoogleStrategy en utils/passport.js).
// req.user es el profile crudo de Google (sin sesión de GoTrue todavía), así
// que hay que: 1) asegurar el usuario en Supabase Auth, 2) generar un magic
// link y redimirlo con redeemAuthLink para conseguir un access_token real de
// GoTrue (mismo mecanismo que usan verifyEmail/resetPassword), 3) mandar al
// usuario de vuelta al frontend con la sesión en la URL.
async function googleCallback(req, res) {
  try {
    const profile = req.user;
    const email = profile?.emails?.[0]?.value;
    if (!email) {
      return res.redirect(`${frontendUrl()}/login?error=google_no_email`);
    }

    let authUser = await findAuthUserByEmail(email);
    const isNewUser = !authUser;
    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          nombre: profile.name?.givenName || '',
          apellido: profile.name?.familyName || '',
          avatar_url: profile.photos?.[0]?.value || null,
        },
      });
      if (error || !data?.user) throw error || new Error('No se pudo crear el usuario de Google');
      authUser = data.user;
    }

    const link = await supabase.auth.admin.generateLink({ type: 'magiclink', email });
    const hashedToken = link?.data?.properties?.hashed_token;
    if (link?.error || !hashedToken) throw link?.error || new Error('No se pudo generar la sesión de Google');

    const session = await redeemAuthLink(hashedToken, 'magiclink');
    if (!session?.accessToken) {
      return res.redirect(`${frontendUrl()}/login?error=google_session_failed`);
    }

    const kinesiologo = await syncKinesiologo(authUser, { avatarUrl: profile.photos?.[0]?.value });
    if (isNewUser) {
      // No await: un mail que falla no debe tirar abajo un login que ya funcionó.
      mailer.sendWelcomeEmail(email, kinesiologo.nombre).catch((err) => {
        console.error('[google-auth] mail de bienvenida falló:', err);
      });
    }
    const userParam = encodeURIComponent(JSON.stringify(toUserPayload(kinesiologo)));

    res.redirect(`${frontendUrl()}/auth/callback?token=${session.accessToken}&user=${userParam}`);
  } catch (error) {
    console.error('[google-auth] googleCallback falló:', error);
    res.redirect(`${frontendUrl()}/login?error=${encodeURIComponent(error.message || 'google_auth_failed')}`);
  }
}

// Recibe la sesión de GoTrue luego de un OAuth (Google/GitHub) hecho desde el
// frontend (PKCE). Valida el access token y sincroniza el perfil.
async function oauthCallback(req, res) {
  try {
    const { access_token, refresh_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const kinesiologo = await syncKinesiologo(data.user);

    res.json({
      token: access_token,
      refresh_token: refresh_token || null,
      kinesiologo: toUserPayload(kinesiologo),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function me(req, res) {
  try {
    const kinesiologo = await kinesiologoModel.findById(req.userId);
    if (!kinesiologo) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...toUserPayload(kinesiologo),
      created_at: kinesiologo.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function refresh(req, res) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token is required' });
    }

    const { status, body } = await gotrueToken('refresh_token', { refresh_token });
    if (status !== 200 || !body.access_token) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    res.json({
      token: body.access_token,
      refresh_token: body.refresh_token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  login,
  oauthCallback,
  googleCallback,
  me,
  refresh,
  frontendUrl,
};