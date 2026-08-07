const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken, verifyToken } = require('../utils/jwt');
const kinesiologoModel = require('../models/kinesiologo');
const { uploadAvatar } = require('../utils/avatar');

async function register(req, res) {
  try {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'nombre, apellido, email and password are required' });
    }

    const existing = await kinesiologoModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await hashPassword(password);
    const kinesiologo = await kinesiologoModel.create({
      nombre,
      apellido,
      email,
      password_hash
    });

    const avatar_url = await uploadAvatar(nombre, apellido, kinesiologo.id);
    await kinesiologoModel.update(kinesiologo.id, { avatar_url });
    kinesiologo.avatar_url = avatar_url;

    const token = generateToken({ id: kinesiologo.id, email: kinesiologo.email });

    res.status(201).json({
      token,
      kinesiologo: {
        id: kinesiologo.id,
        nombre: kinesiologo.nombre,
        apellido: kinesiologo.apellido,
        email: kinesiologo.email,
        avatar_url: kinesiologo.avatar_url
      }
    });
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

    const kinesiologo = await kinesiologoModel.findByEmail(email);
    if (!kinesiologo) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!kinesiologo.password_hash) {
      return res.status(401).json({ error: 'This account uses OAuth authentication' });
    }

    const valid = await comparePassword(password, kinesiologo.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: kinesiologo.id, email: kinesiologo.email });

    res.json({
      token,
      kinesiologo: {
        id: kinesiologo.id,
        nombre: kinesiologo.nombre,
        apellido: kinesiologo.apellido,
        email: kinesiologo.email,
        avatar_url: kinesiologo.avatar_url
      }
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
      id: kinesiologo.id,
      nombre: kinesiologo.nombre,
      apellido: kinesiologo.apellido,
      email: kinesiologo.email,
      avatar_url: kinesiologo.avatar_url,
      created_at: kinesiologo.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function refresh(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const kinesiologo = await kinesiologoModel.findById(decoded.id);
    if (!kinesiologo) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = generateToken({ id: kinesiologo.id, email: kinesiologo.email });

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function googleCallback(req, res) {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ error: 'id_token is required' });
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    const payload = await response.json();

    if (payload.error_description) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const nombre = payload.given_name || '';
    const apellido = payload.family_name || '';

    let kinesiologo = await kinesiologoModel.findByGoogleId(googleId);

    if (!kinesiologo) {
      kinesiologo = await kinesiologoModel.create({
        google_id: googleId,
        email,
        nombre,
        apellido
      });
      const avatar_url = payload.picture || await uploadAvatar(nombre, apellido, kinesiologo.id);
      await kinesiologoModel.update(kinesiologo.id, { avatar_url });
      kinesiologo.avatar_url = avatar_url;
    } else if (!kinesiologo.avatar_url) {
      const avatar_url = payload.picture || await uploadAvatar(nombre, apellido, kinesiologo.id);
      await kinesiologoModel.update(kinesiologo.id, { avatar_url });
      kinesiologo.avatar_url = avatar_url;
    }

    const token = generateToken({ id: kinesiologo.id, email: kinesiologo.email });
    res.json({
      token,
      kinesiologo: {
        id: kinesiologo.id,
        nombre: kinesiologo.nombre,
        apellido: kinesiologo.apellido,
        email: kinesiologo.email,
        avatar_url: kinesiologo.avatar_url
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Redirect-based flow (more reliable than the popup/id_token flow).
// Passport middleware populates req.user with the Google profile.
async function googleRedirectCallback(req, res) {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }

    const profile = req.user;
    const googleId = profile.id;
    const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
    const nombre = profile.name && profile.name.givenName ? profile.name.givenName : (profile.displayName || '').split(' ')[0] || '';
    const apellido = profile.name && profile.name.familyName ? profile.name.familyName : (profile.displayName || '').split(' ').slice(1).join(' ') || '';
    const picture = (profile.photos && profile.photos[0] && profile.photos[0].value) || null;

    let kinesiologo = await kinesiologoModel.findByGoogleId(googleId);

    if (!kinesiologo) {
      // No hay cuenta con este google_id. Puede ser que el email ya exista
      // (registrado con contraseña): en ese caso vinculamos el google_id a esa
      // cuenta en lugar de crear una nueva (chocaría con el email único).
      const existing = email ? await kinesiologoModel.findByEmail(email) : null;
      if (existing) {
        const updates = { google_id: googleId };
        if (!existing.avatar_url) {
          updates.avatar_url = picture || await uploadAvatar(nombre, apellido, existing.id);
        }
        await kinesiologoModel.update(existing.id, updates);
        kinesiologo = { ...existing, ...updates };
      } else {
        kinesiologo = await kinesiologoModel.create({
          google_id: googleId,
          email,
          nombre,
          apellido
        });
        const avatar_url = picture || await uploadAvatar(nombre, apellido, kinesiologo.id);
        await kinesiologoModel.update(kinesiologo.id, { avatar_url });
        kinesiologo.avatar_url = avatar_url;
      }
    } else if (!kinesiologo.avatar_url) {
      const avatar_url = picture || await uploadAvatar(nombre, apellido, kinesiologo.id);
      await kinesiologoModel.update(kinesiologo.id, { avatar_url });
      kinesiologo.avatar_url = avatar_url;
    }

    const token = generateToken({ id: kinesiologo.id, email: kinesiologo.email });
    const user = {
      id: kinesiologo.id,
      nombre: kinesiologo.nombre,
      apellido: kinesiologo.apellido,
      email: kinesiologo.email,
      avatar_url: kinesiologo.avatar_url
    };

    // Hand the JWT back to the SPA via query string. The frontend will read it,
    // store it, and clean the URL.
    const params = new URLSearchParams({ token, user: JSON.stringify(user) });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?${params.toString()}`);
  } catch (error) {
    console.error('googleRedirectCallback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
  }
}

async function githubCallback(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ error: 'GitHub OAuth not configured on server' });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(401).json({ error: tokenData.error_description || 'GitHub OAuth error' });
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const githubUser = await userResponse.json();

    if (!userResponse.ok) {
      return res.status(401).json({ error: 'Failed to fetch GitHub user' });
    }

    const githubId = String(githubUser.id);
    const email = githubUser.email || `${githubUser.login}@github.com`;
    const nameParts = (githubUser.name || githubUser.login || '').split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    let kinesiologo = await kinesiologoModel.findByGithubId(githubId);

    if (!kinesiologo) {
      kinesiologo = await kinesiologoModel.create({
        github_id: githubId,
        email,
        nombre,
        apellido
      });
      const avatar_url = githubUser.avatar_url || await uploadAvatar(nombre, apellido, kinesiologo.id);
      await kinesiologoModel.update(kinesiologo.id, { avatar_url });
      kinesiologo.avatar_url = avatar_url;
    } else if (!kinesiologo.avatar_url) {
      const avatar_url = githubUser.avatar_url || await uploadAvatar(nombre, apellido, kinesiologo.id);
      await kinesiologoModel.update(kinesiologo.id, { avatar_url });
      kinesiologo.avatar_url = avatar_url;
    }

    const token = generateToken({ id: kinesiologo.id, email: kinesiologo.email });
    res.json({
      token,
      kinesiologo: {
        id: kinesiologo.id,
        nombre: kinesiologo.nombre,
        apellido: kinesiologo.apellido,
        email: kinesiologo.email,
        avatar_url: kinesiologo.avatar_url
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { register, login, me, refresh, googleCallback, googleRedirectCallback, githubCallback };
