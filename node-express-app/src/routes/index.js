exports.authRoutes = (app) => {
    const authController = require('../controllers/index');

    app.post('/register', authController.register);
    app.post('/login', authController.login);
};