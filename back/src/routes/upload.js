const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middlewares/index');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF and WebP images are allowed'), false);
    }
  }
});

router.post('/avatar', authMiddleware, upload.single('avatar'), uploadController.avatar);
router.post('/paciente-foto', authMiddleware, upload.single('foto'), uploadController.pacienteFoto);

module.exports = router;
