const express = require('express');
const router = express.Router();

const { listByTruyen, createDanhGia } = require('../controllers/danhGiaController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/truyen/:id', listByTruyen);
router.post('/', requireAuth, requireRole('customer'), createDanhGia);

module.exports = router;