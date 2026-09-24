const { query, transaction } = require('../config/db');
const bcrypt = require('bcryptjs');
const { writeAudit } = require('./auditLogHelper');

async function listKhachHang(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql =
      'SELECT kh.id, kh.ma_tai_khoan, kh.ho_ten, kh.dia_chi, kh.ngay_sinh, kh.anh_dai_dien, ' +
      'kh.diem_tich_luy, kh.tong_diem_tich_luy, kh.hang_thanh_vien, tk.email, tk.so_dien_thoai, tk.trang_thai AS trang_thai_tk, ' +
      '(SELECT COUNT(*) FROM phieutra pr ' +
      'JOIN chitietphieuthue ct ON ct.id = pr.ma_chi_tiet_phieu_thue ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE pt.ma_khach_hang = kh.id AND pr.tinh_trang_nhan IN ("hu_nhe","hu_nang_mat")) AS so_lan_vi_pham ' +
      'FROM khachhang kh JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan ';
    const params = [];
    if (tu_khoa) {
      sql += 'WHERE kh.ho_ten LIKE ? OR tk.so_dien_thoai LIKE ?';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += ' ORDER BY kh.id';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getKhachHang(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT kh.*, tk.email, tk.so_dien_thoai, tk.trang_thai AS trang_thai_tk ' +
      'FROM khachhang kh JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan WHERE kh.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
    const [datTruoc] = await query(
      'SELECT id, loai, ngay_dat, han_nhan, trang_thai FROM dattruoc WHERE ma_khach_hang = ? ORDER BY id DESC LIMIT 20',
      [id]
    );
    const [lichSuThue] = await query(
      'SELECT ct.ma_phieu_thue AS ma_phieu, t.ten_truyen, bs.ma_ban_sao AS ma_ban_sao_str, ' +
      'ct.ngay_hen_tra, ct.trang_thai ' +
      'FROM chitietphieuthue ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE pt.ma_khach_hang = ? ORDER BY ct.id DESC LIMIT 20',
      [id]
    );
    const [lichSuMua] = await query(
      'SELECT ct.ma_phieu_ban AS ma_phieu, t.ten_truyen, bs.ma_ban_sao AS ma_ban_sao_str, ct.thanh_tien ' +
      'FROM chitietphieuban ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuban pb ON pb.id = ct.ma_phieu_ban ' +
      'WHERE pb.ma_khach_hang = ? ORDER BY ct.id DESC LIMIT 20',
      [id]
    );
    return res.json({ ...rows[0], lich_su_dat_truoc: datTruoc, lich_su_thue: lichSuThue, lich_su_mua: lichSuMua });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function toggleKhoaKhachHang(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT ma_tai_khoan FROM khachhang WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
    const [tk] = await query('SELECT trang_thai FROM taikhoan WHERE id = ?', [rows[0].ma_tai_khoan]);
    const trangMoi = tk[0].trang_thai === 'khoa' ? 'hoat_dong' : 'khoa';
    await query('UPDATE taikhoan SET trang_thai = ? WHERE id = ?', [trangMoi, rows[0].ma_tai_khoan]);
    await writeAudit(null, req, trangMoi === 'khoa' ? 'khoa_khach_hang' : 'mo_khoa_khach_hang', 'khach_hang', Number(id));
    return res.json({ message: trangMoi === 'khoa' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Tìm nhanh theo SĐT (POS): profile + cảnh báo sách quá hạn
async function timKhach(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Thiếu số điện thoại.' });
  try {
    const so = String(q).replace(/[^0-9]/g, '').slice(-10);
    if (!so) return res.status(400).json({ message: 'Số điện thoại không hợp lệ.' });
    const [rows] = await query(
      'SELECT kh.id, kh.ho_ten, kh.diem_tich_luy, kh.hang_thanh_vien, tk.so_dien_thoai, tk.email, tk.trang_thai ' +
      'FROM khachhang kh JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan WHERE tk.so_dien_thoai LIKE ? LIMIT 1',
      [`%${so}`]
    );
    if (rows.length === 0) return res.json(null);
    if (rows[0].trang_thai === 'khoa') return res.status(403).json({ message: 'Tài khoản khách đang bị khóa.' });
    const [quaHan] = await query(
      'SELECT ct.id, t.ten_truyen, ct.ngay_hen_tra, DATEDIFF(NOW(), ct.ngay_hen_tra) AS so_ngay_tre ' +
      'FROM chitietphieuthue ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE pt.ma_khach_hang = ? AND ct.trang_thai = "dang_thue" AND ct.ngay_hen_tra < NOW() ORDER BY ct.ngay_hen_tra',
      [rows[0].id]
    );
    return res.json({ ...rows[0], sach_qua_han: quaHan });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Lịch sử khách tại quầy theo SĐT (thuê / trả / mua / đặt trước)
async function lichSuKhach(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Thiếu số điện thoại.' });
  try {
    const so = String(q).replace(/[^0-9]/g, '').slice(-10);
    const [khRows] = await query(
      'SELECT kh.id, kh.ho_ten, kh.diem_tich_luy, kh.hang_thanh_vien, tk.so_dien_thoai FROM khachhang kh ' +
      'JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan WHERE tk.so_dien_thoai LIKE ? LIMIT 1',
      [`%${so}`]
    );
    if (khRows.length === 0) return res.json({ khach: null, thue: [], tra: [], mua: [] });
    const maKhach = khRows[0].id;
    const [thue] = await query(
      'SELECT ct.id, t.ten_truyen, bs.ma_ban_sao, pt.ngay_thue, ct.ngay_hen_tra, ct.don_gia, ct.tien_coc, ct.trang_thai ' +
      'FROM chitietphieuthue ct JOIN bansao bs ON bs.id = ct.ma_ban_sao JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE ct.ma_phieu_thue IN (SELECT id FROM phieuthue WHERE ma_khach_hang = ?) ORDER BY ct.id DESC LIMIT 30',
      [maKhach]
    );
    const [tra] = await query(
      'SELECT pr.ngay_tra, pr.tinh_trang_nhan, pr.phi_phat_sinh, t.ten_truyen, bs.ma_ban_sao, ct2.ngay_hen_tra, ct2.tien_coc ' +
      'FROM phieutra pr JOIN chitietphieuthue ct2 ON ct2.id = pr.ma_chi_tiet_phieu_thue ' +
      'JOIN bansao bs ON bs.id = ct2.ma_ban_sao JOIN truyen t ON t.id = bs.ma_truyen ' +
      'WHERE ct2.ma_phieu_thue IN (SELECT id FROM phieuthue WHERE ma_khach_hang = ?) ORDER BY pr.ngay_tra DESC LIMIT 30',
      [maKhach]
    );
    const [mua] = await query(
      'SELECT pb.ngay_ban, t.ten_truyen, bs.ma_ban_sao, ct.gia_goc, ct.so_tien_giam_su_kien, ct.thanh_tien ' +
      'FROM chitietphieuban ct JOIN bansao bs ON bs.id = ct.ma_ban_sao JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuban pb ON pb.id = ct.ma_phieu_ban ' +
      'WHERE ct.ma_phieu_ban IN (SELECT id FROM phieuban WHERE ma_khach_hang = ?) ORDER BY ct.id DESC LIMIT 30',
      [maKhach]
    );
    return res.json({ khach: khRows[0], thue, tra, mua });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Tạo tài khoản khách nhanh tại quầy (SĐT bắt buộc, mật khẩu mặc định 123456)
async function taoNhanhAtQuay(req, res) {
  const { so_dien_thoai, ho_ten, email } = req.body;
  if (!so_dien_thoai) return res.status(400).json({ message: 'Số điện thoại là bắt buộc.' });
  try {
    const so = String(so_dien_thoai).replace(/[^0-9]/g, '').slice(-10);
    if (so.length < 9) return res.status(400).json({ message: 'Số điện thoại không hợp lệ.' });
    const [ex] = await query('SELECT id FROM taikhoan WHERE so_dien_thoai = ?', [so]);
    if (ex.length > 0) return res.status(409).json({ message: 'Số điện thoại đã có tài khoản.' });
    const hash = await bcrypt.hash('123456', 10);
    const id = await transaction(async (conn) => {
      const [r1] = await conn.query(
        'INSERT INTO taikhoan (email, so_dien_thoai, mat_khau, vai_tro) VALUES (?, ?, ?, "customer")',
        [email || null, so, hash]
      );
      const [r2] = await conn.query(
        'INSERT INTO khachhang (ma_tai_khoan, ho_ten) VALUES (?, ?)',
        [r1.insertId, ho_ten || `Khách ${so.slice(-4)}`]
      );
      return r2.insertId;
    });
    return res.status(201).json({ message: 'Tạo tài khoản khách thành công.', id, ma_thanh_vien: so });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function resetMatKhauKhachHang(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT ma_tai_khoan FROM khachhang WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
    const hash = await bcrypt.hash('123456', 10);
    await query('UPDATE taikhoan SET mat_khau = ? WHERE id = ?', [hash, rows[0].ma_tai_khoan]);
    await writeAudit(null, req, 'reset_mat_khau', 'khach_hang', Number(id));
    return res.json({ message: 'Đã đặt lại mật khẩu về mặc định 123456.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listKhachHang, getKhachHang, toggleKhoaKhachHang, timKhach, lichSuKhach, taoNhanhAtQuay, resetMatKhauKhachHang };