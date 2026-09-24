const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/cauHinhController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff', 'customer'), ctrl.getCauHinh);
router.put('/hang-thanh-vien/:id', requireAuth, requireRole('admin'), ctrl.updateHang);
router.put('/quy-doi-diem/:id', requireAuth, requireRole('admin'), ctrl.updateQuyDoi);

module.exports = router;
