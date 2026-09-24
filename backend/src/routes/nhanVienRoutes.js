const express = require('express');
const router = express.Router();

const nhanVien = require('../controllers/nhanVienController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin'), nhanVien.listNhanVien);
router.post('/', requireAuth, requireRole('admin'), nhanVien.createNhanVien);
router.put('/:id', requireAuth, requireRole('admin'), nhanVien.updateNhanVien);
router.patch('/:id/toggle-khoa', requireAuth, requireRole('admin'), nhanVien.toggleKhoaNhanVien);
router.patch('/:id/reset-mat-khau', requireAuth, requireRole('admin'), nhanVien.resetMatKhauNhanVien);

module.exports = router;