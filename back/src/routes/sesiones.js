const express = require('express')
const multer = require('multer')
const router = express.Router()
const sesionController = require('../controllers/sesionController')
const { authMiddleware } = require('../middlewares/index')

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/webm', 'video/mp4']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se aceptan videos webm o mp4'), false)
    }
  }
})

router.use(authMiddleware)
router.get('/', sesionController.listar)
router.get('/:id', sesionController.detalle)
router.post('/', sesionController.create)
router.put('/:id/finalizar', sesionController.finalizar)
router.post('/:id/eventos', sesionController.eventos)
router.post('/:id/metricas', sesionController.metricas)
router.post('/:id/videos', videoUpload.fields([
  { name: 'crudo', maxCount: 1 },
  { name: 'landmarks', maxCount: 1 },
  { name: 'gameplay', maxCount: 1 },
]), sesionController.videos)
router.get('/:id/metricas', sesionController.metricasCrudas)
router.get('/:id/videos', sesionController.videosDeSesion)

module.exports = router
