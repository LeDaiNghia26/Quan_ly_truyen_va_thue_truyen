const bcrypt = require('bcryptjs');

const { query, transaction } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

async function listNhanVien(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql =
      'SELECT nv.id, nv.ma_tai_khoan, nv.ho_ten, nv.chuc_vu, tk.email, tk.so_dien_thoai, tk.trang_thai ' +
      'FROM nhanvien nv JOIN taikhoan tk ON tk.id = nv.ma_tai_khoan ';
    const params = [];
    if (tu_khoa) {
      sql += 'WHERE nv.ho_ten LIKE ? OR nv.chuc_vu LIKE ?';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += ' ORDER BY nv.id';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createNhanVien(req, res) {
  const { ho_ten, chuc_vu, email, so_dien_thoai, mat_khau } = req.body;
  if (!ho_ten || !email || !mat_khau) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
  }
  try {
    const [existing] = await query('SELECT id FROM taikhoan WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email đã tồn tại.' });
    const hash = await bcrypt.hash(mat_khau, 10);
    const id = await transaction(async (conn) => {
      const [r1] = await conn.query(
        'INSERT INTO taikhoan (email, so_dien_thoai, mat_khau, vai_tro) VALUES (?, ?, ?, "staff")',
        [email, so_dien_thoai || null, hash]
      );
      await conn.query('INSERT INTO nhanvien (ma_tai_khoan, ho_ten, chuc_vu) VALUES (?, ?, ?)', [
        r1.insertId, ho_ten, chuc_vu || null,
      ]);
      return r1.insertId;
    });
    await writeAudit(null, req, 'tao_nhan_vien', 'nhan_vien', id, `${ho_ten} (${email})`);
    return res.status(201).json({ message: 'Thêm nhân viên thành công.', id });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateNhanVien(req, res) {
  const { id } = req.params;
  const { ho_ten, chuc_vu, email, so_dien_thoai } = req.body;
  try {
    const [rows] = await query('SELECT ma_tai_khoan FROM nhanvien WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    if (ho_ten !== undefined) await query('UPDATE nhanvien SET ho_ten = ? WHERE id = ?', [ho_ten, id]);
    if (chuc_vu !== undefined) await query('UPDATE nhanvien SET chuc_vu = ? WHERE id = ?', [chuc_vu, id]);
    if (email !== undefined) await query('UPDATE taikhoan SET email = ? WHERE id = ?', [email, rows[0].ma_tai_khoan]);
    if (so_dien_thoai !== undefined) await query('UPDATE taikhoan SET so_dien_thoai = ? WHERE id = ?', [so_dien_thoai, rows[0].ma_tai_khoan]);
    await writeAudit(null, req, 'sua_nhan_vien', 'nhan_vien', Number(id), `${ho_ten || ''} ${chuc_vu || ''}`.trim() || null);
    return res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function toggleKhoaNhanVien(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT ma_tai_khoan FROM nhanvien WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    const [tk] = await query('SELECT trang_thai FROM taikhoan WHERE id = ?', [rows[0].ma_tai_khoan]);
    const trangMoi = tk[0].trang_thai === 'khoa' ? 'hoat_dong' : 'khoa';
    await query('UPDATE taikhoan SET trang_thai = ? WHERE id = ?', [trangMoi, rows[0].ma_tai_khoan]);
    await writeAudit(null, req, trangMoi === 'khoa' ? 'khoa_nhan_vien' : 'mo_khoa_nhan_vien', 'nhan_vien', Number(id));
    return res.json({ message: trangMoi === 'khoa' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function resetMatKhauNhanVien(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT ma_tai_khoan FROM nhanvien WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    const hash = await bcrypt.hash('123456', 10);
    await query('UPDATE taikhoan SET mat_khau = ? WHERE id = ?', [hash, rows[0].ma_tai_khoan]);
    await writeAudit(null, req, 'reset_mat_khau', 'nhan_vien', Number(id));
    return res.json({ message: 'Đã đặt lại mật khẩu về mặc định 123456.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listNhanVien, createNhanVien, updateNhanVien, toggleKhoaNhanVien, resetMatKhauNhanVien };
