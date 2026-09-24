const express = require('express');
const router = express.Router();

const pnk = require('../controllers/phieuNhapKhoController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin'), pnk.listPhieuNhapKho);
router.get('/:id', requireAuth, requireRole('admin'), pnk.getPhieuNhapKho);
router.post('/', requireAuth, requireRole('admin'), pnk.createPhieuNhapKho);

module.exports = router;