const express = require('express');
const router = express.Router();
const passport = require('../utils/passport');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/index');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verificar-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/oauth-callback', authController.oauthCallback);
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authController.refresh);

// Login con Google vía redirect (passport), sin usar supabase.auth.signInWithOAuth
// del lado del cliente. Ver el comentario de googleCallback en authController.js.
router.get('/google/redirect', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', (req, res, next) => {
  // Callback manual (en vez de failureRedirect) para poder loguear por qué
  // falló el intercambio con Google — si no, el error se pierde en silencio.
  passport.authenticate('google', { session: false }, (err, profile) => {
    if (err || !profile) {
      console.error('[google-auth] passport callback falló:', err || 'sin profile (usuario canceló o Google no devolvió perfil)');
      return res.redirect(`${authController.frontendUrl()}/login?error=google_auth_failed`);
    }
    req.user = profile;
    authController.googleCallback(req, res);
  })(req, res, next);
});

module.exports = router;