const express = require('express');
const router = express.Router();
const passport = require('../utils/passport');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/index');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authController.refresh);
router.post('/google/callback', authController.googleCallback);
router.post('/github/callback', authController.githubCallback);

// Redirect flow (full-page navigation, no popups, no COOP issues).
router.get('/google/redirect', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
  authController.googleRedirectCallback
);

module.exports = router;
