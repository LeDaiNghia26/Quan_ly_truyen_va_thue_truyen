const { query } = require('../config/db');
const { getKhachByAccountId } = require('./authController');

async function khachId(req) {
  return getKhachByAccountId(req.user.id);
}

async function listYeuThich(req, res) {
  try {
    const maKhach = await khachId(req);
    if (!maKhach) return res.status(403).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    const [rows] = await query(
      'SELECT yt.id AS id_yeu_thich, t.id, t.id AS ma_truyen, t.ten_truyen, t.tac_gia, t.gia_thue, t.gia_ban, t.anh_bia, ' +
      '(SELECT GROUP_CONCAT(tl2.ten_the_loai SEPARATOR ", ") FROM TruyenTheLoai ttl JOIN TheLoai tl2 ON tl2.id = ttl.ma_the_loai WHERE ttl.ma_truyen = t.id) AS the_loai_ten, yt.ngay_them ' +
      'FROM yeuthich yt JOIN truyen t ON t.id = yt.ma_truyen WHERE yt.ma_khach_hang = ? ORDER BY yt.ngay_them DESC',
      [maKhach]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function toggleYeuThich(req, res) {
  const { ma_truyen } = req.body;
  if (!ma_truyen) return res.status(400).json({ message: 'Thiếu mã truyện.' });
  try {
    const maKhach = await khachId(req);
    if (!maKhach) return res.status(403).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    const [existing] = await query('SELECT id FROM yeuthich WHERE ma_khach_hang = ? AND ma_truyen = ?', [maKhach, ma_truyen]);
    if (existing.length > 0) {
      await query('DELETE FROM yeuthich WHERE id = ?', [existing[0].id]);
      return res.json({ yeu_thich: false, message: 'Đã bỏ yêu thích.' });
    }
    await query('INSERT INTO yeuthich (ma_khach_hang, ma_truyen) VALUES (?, ?)', [maKhach, ma_truyen]);
    return res.json({ yeu_thich: true, message: 'Đã thêm vào danh sách yêu thích.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listYeuThich, toggleYeuThich };
