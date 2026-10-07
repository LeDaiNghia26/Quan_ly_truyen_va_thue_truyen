const { query } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

async function listSuKien(req, res) {
  const { tu_khoa, tu_ngay, den_ngay } = req.query;
  try {
    let sql = 'SELECT * FROM sukiengiamgia ';
    const params = [];
    const conds = [];
    if (tu_khoa) conds.push('ten_su_kien LIKE ?');
    if (tu_ngay) conds.push('ngay_bat_dau >= ?');
    if (den_ngay) conds.push('ngay_ket_thuc <= ?');
    if (tu_khoa) params.push(`%${tu_khoa}%`);
    if (tu_ngay) params.push(tu_ngay);
    if (den_ngay) params.push(den_ngay);
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getSuKien(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT * FROM sukiengiamgia WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy chương trình.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createSuKien(req, res) {
  const {
    ten_su_kien, kieu_giam, gia_tri, pham_vi,
    ma_the_loai, ma_truyen, ngay_bat_dau, ngay_ket_thuc,
  } = req.body;
  if (!ten_su_kien || !kieu_giam || !gia_tri || !pham_vi || !ngay_bat_dau || !ngay_ket_thuc) {
    return res.status(400).json({ message: 'Thiếu thông tin chương trình giảm giá.' });
  }
  try {
    const [qtvRows] = await query('SELECT id FROM quantrivien WHERE ma_tai_khoan = ?', [req.user.id]);
    if (qtvRows.length === 0) return res.status(403).json({ message: 'Không tìm thấy hồ sơ quản trị viên.' });
    if (pham_vi === 'the_loai' && !ma_the_loai) {
      return res.status(400).json({ message: 'Phạm vi theo thể loại cần chọn thể loại.' });
    }
    if (pham_vi === 'truyen' && !ma_truyen) {
      return res.status(400).json({ message: 'Phạm vi theo truyện cần chọn truyện.' });
    }
    const [r] = await query(
      'INSERT INTO sukiengiamgia (ten_su_kien, kieu_giam, gia_tri, pham_vi, ma_the_loai, ma_truyen, ngay_bat_dau, ngay_ket_thuc, ma_quan_tri_vien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ten_su_kien, kieu_giam, gia_tri, pham_vi, ma_the_loai || null, ma_truyen || null, ngay_bat_dau, ngay_ket_thuc, qtvRows[0].id]
    );
    await writeAudit(null, req, 'tao_su_kien', 'su_kien', r.insertId, ten_su_kien);
    return res.status(201).json({ message: 'Tạo chương trình thành công.', id: r.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateSuKien(req, res) {
  const { id } = req.params;
  const fields = ['ten_su_kien', 'kieu_giam', 'gia_tri', 'pham_vi', 'ma_the_loai', 'ma_truyen', 'ngay_bat_dau', 'ngay_ket_thuc'];
  try {
    const sets = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = ?`); params.push(req.body[f]); }
    }
    if (sets.length === 0) return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
    params.push(id);
    await query(`UPDATE sukiengiamgia SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeAudit(null, req, 'sua_su_kien', 'su_kien', Number(id), sets.join(', '));
    return res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function endSuKien(req, res) {
  const { id } = req.params;
  const { trang_thai } = req.body;
  try {
    const state = trang_thai === 'huy' ? 'huy' : 'ket_thuc';
    await query('UPDATE sukiengiamgia SET trang_thai = ? WHERE id = ?', [state, id]);
    await writeAudit(null, req, state === 'huy' ? 'huy_su_kien' : 'ket_thuc_su_kien', 'su_kien', Number(id));
    return res.json({ message: state === 'huy' ? 'Đã hủy chương trình.' : 'Đã kết thúc chương trình.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Danh sách sự kiện đang diễn ra (công khai cho app khách hàng)
async function listCongKhai(req, res) {
  try {
    const [rows] = await query(
      'SELECT * FROM sukiengiamgia WHERE trang_thai = "hoat_dong" AND ngay_bat_dau <= NOW() AND ngay_ket_thuc >= NOW() ORDER BY ngay_bat_dau'
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function toggleSuKien(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT trang_thai FROM sukiengiamgia WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy chương trình.' });
    const moi = rows[0].trang_thai === 'hoat_dong' ? 'ket_thuc' : 'hoat_dong';
    await query('UPDATE sukiengiamgia SET trang_thai = ? WHERE id = ?', [moi, id]);
    await writeAudit(null, req, moi === 'hoat_dong' ? 'bat_su_kien' : 'tam_dung_su_kien', 'su_kien', Number(id));
    return res.json({ message: moi === 'hoat_dong' ? 'Đã bật chương trình.' : 'Đã tạm dừng chương trình.', trang_thai: moi });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listSuKien, getSuKien, createSuKien, updateSuKien, endSuKien, toggleSuKien, listCongKhai };
