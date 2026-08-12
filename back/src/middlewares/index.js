const supabase = require('../utils/supabase');

// Valida el access token de Supabase Auth (GoTrue) y deja req.userId = id de auth.users.
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(403).json({ error: 'Failed to authenticate token' });
  }

  req.userId = data.user.id;
  next();
};

module.exports = { authMiddleware };