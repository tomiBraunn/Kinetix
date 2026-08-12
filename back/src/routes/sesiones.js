const express = require('express')
const router = express.Router()
const sesionController = require('../controllers/sesionController')
const { authMiddleware } = require('../middlewares/index')

router.use(authMiddleware)
router.post('/', sesionController.create)
router.put('/:id/finalizar', sesionController.finalizar)

module.exports = router
