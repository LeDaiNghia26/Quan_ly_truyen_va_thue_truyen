const { query } = require('../config/db');
const { getKhachByAccountId } = require('./authController');

async function listByTruyen(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT dg.id, dg.so_sao, dg.noi_dung, dg.ngay_danh_gia, kh.ho_ten FROM danhgia dg ' +
      'JOIN khachhang kh ON kh.id = dg.ma_khach_hang WHERE dg.ma_truyen = ? ORDER BY dg.ngay_danh_gia DESC',
      [id]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Khách hàng có thể đánh giá truyện đã từng thuê/mua
async function createDanhGia(req, res) {
  const { ma_truyen, so_sao, noi_dung } = req.body;
  if (!ma_truyen || !so_sao || Number(so_sao) < 1 || Number(so_sao) > 5) {
    return res.status(400).json({ message: 'Đánh giá cần sao từ 1 đến 5.' });
  }
  try {
    const maKhach = await getKhachByAccountId(req.user.id);
    if (!maKhach) return res.status(403).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    const [tungGD] = await query(
      'SELECT 1 FROM chitietphieuthue ct JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao WHERE pt.ma_khach_hang = ? AND bs.ma_truyen = ? LIMIT 1',
      [maKhach, ma_truyen]
    );
    const [tungMua] = await query(
      'SELECT 1 FROM chitietphieuban ct JOIN phieuban pb ON pb.id = ct.ma_phieu_ban ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao WHERE pb.ma_khach_hang = ? AND bs.ma_truyen = ? LIMIT 1',
      [maKhach, ma_truyen]
    );
    if (tungGD.length === 0 && tungMua.length === 0) {
      return res.status(403).json({ message: 'Chỉ khách đã thuê/mua truyện mới có thể đánh giá.' });
    }
    await query(
      'INSERT INTO danhgia (ma_khach_hang, ma_truyen, so_sao, noi_dung) VALUES (?, ?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE so_sao = VALUES(so_sao), noi_dung = VALUES(noi_dung), ngay_danh_gia = NOW()',
      [maKhach, ma_truyen, Number(so_sao), noi_dung || null]
    );
    return res.json({ message: 'Đã ghi nhận đánh giá.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listByTruyen, createDanhGia };