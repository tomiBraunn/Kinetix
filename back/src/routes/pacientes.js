const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { authMiddleware } = require('../middlewares/index');

router.use(authMiddleware);
router.post('/', pacienteController.create);
router.get('/', pacienteController.list);
router.get('/:id', pacienteController.get);
router.put('/:id', pacienteController.update);
router.delete('/:id', pacienteController.remove);

module.exports = router;
