const express = require('express');
const router = express.Router();

const { upload, uploadAnhBia } = require('../controllers/uploadController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.post('/anh-bia', requireAuth, requireRole('admin'), upload.single('anh'), uploadAnhBia);

module.exports = router;
