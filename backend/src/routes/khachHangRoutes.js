const express = require('express');
const router = express.Router();

const khachHang = require('../controllers/khachHangController');
const me = require('../controllers/khachHangMeController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Cổng thông tin khách hàng (app di động / dành cho customer)
router.get('/me', requireAuth, requireRole('admin', 'staff', 'customer'), me.getMe);
router.get('/me/dat-truoc', requireAuth, requireRole('customer'), me.myDatTruoc);
router.get('/me/thue', requireAuth, requireRole('customer'), me.myRentals);
router.get('/me/thong-bao', requireAuth, requireRole('customer'), me.myNotifications);
  router.get('/me/danh-gia', requireAuth, requireRole('customer'), me.myDanhGia);
router.put('/me/thong-bao/:id/read', requireAuth, requireRole('customer'), me.markRead);

// Nhân viên có danh sách khách hàng chỉ khi là phiếu bán/thuê sách.
// Các thao tác nhạy cảm (xóa, khóa, đặt lại mật khẩu, xem chi tiết) chỉ dành cho admin.
router.get('/', requireAuth, requireRole('admin', 'staff'), khachHang.listKhachHang);
router.get('/tim', requireAuth, requireRole('admin', 'staff'), khachHang.timKhach);
router.get('/lich-su', requireAuth, requireRole('admin', 'staff'), khachHang.lichSuKhach);
router.post('/tao-tai-quay', requireAuth, requireRole('admin', 'staff'), khachHang.taoNhanhAtQuay);
router.get('/:id', requireAuth, requireRole('admin'), khachHang.getKhachHang);
router.patch('/:id/toggle-khoa', requireAuth, requireRole('admin'), khachHang.toggleKhoaKhachHang);
router.patch('/:id/reset-mat-khau', requireAuth, requireRole('admin'), khachHang.resetMatKhauKhachHang);

module.exports = router;
