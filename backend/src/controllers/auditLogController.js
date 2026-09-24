const { query } = require('../config/db');

// Danh sách nhật ký (chỉ admin). Hỗ trợ lọc từ khóa, hành động, khoảng thời gian.
async function listAuditLog(req, res) {
  try {
    const { hanh_dong, tu_ngay, den_ngay, q, limit } = req.query;
    let sql =
      'SELECT al.id, al.ma_tai_khoan, al.vai_tro, al.hanh_dong, al.doi_tuong, al.id_doi_tuong, al.ly_do, al.ngay_tao, ' +
      'COALESCE(nv.ho_ten, qt.ho_ten, tk.email) AS nguoi_thuc_hien ' +
      'FROM auditlog al ' +
      'LEFT JOIN taikhoan tk ON tk.id = al.ma_tai_khoan ' +
      'LEFT JOIN nhanvien nv ON nv.ma_tai_khoan = al.ma_tai_khoan ' +
      'LEFT JOIN quantrivien qt ON qt.ma_tai_khoan = al.ma_tai_khoan WHERE 1=1 ';
    const params = [];
    if (hanh_dong) {
      sql += 'AND al.hanh_dong = ? ';
      params.push(hanh_dong);
    }
    if (tu_ngay) {
      sql += 'AND al.ngay_tao >= ? ';
      params.push(tu_ngay);
    }
    if (den_ngay) {
      sql += 'AND al.ngay_tao <= CONCAT(?, " 23:59:59") ';
      params.push(den_ngay);
    }
    if (q) {
      sql += 'AND (al.hanh_dong LIKE ? OR al.ly_do LIKE ? OR COALESCE(nv.ho_ten, qt.ho_ten, tk.email) LIKE ? OR al.doi_tuong LIKE ?) ';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    const lim = Math.min(parseInt(limit, 10) || 200, 500);
    sql += 'ORDER BY al.id DESC LIMIT ' + lim;
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listAuditLog };