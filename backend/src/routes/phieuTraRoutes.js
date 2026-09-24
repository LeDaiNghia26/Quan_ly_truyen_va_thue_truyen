const express = require('express');
const router = express.Router();

const ptr = require('../controllers/phieuTraController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), ptr.listPhieuTra);
router.get('/dang-thue', requireAuth, requireRole('admin', 'staff'), ptr.dangThue);
router.post('/', requireAuth, requireRole('staff', 'admin'), ptr.createPhieuTra);
router.post('/bao-mat', requireAuth, requireRole('staff', 'admin'), ptr.baoMatTruyen);

module.exports = router;