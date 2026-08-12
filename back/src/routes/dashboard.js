const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/index');

router.use(authMiddleware);
router.get('/', dashboardController.resumen);

module.exports = router;
