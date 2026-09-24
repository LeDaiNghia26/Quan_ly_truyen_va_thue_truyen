const { query, transaction } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

// Lấy id hồ sơ nhân viên gắn với tài khoản đang đăng nhập (staff). Admin không có.
// Nếu người dùng là admin: tự động tạo hồ sơ nhanvien ngầm định để admin mở/chốt ca được
// như nhân viên và đi qua được gating POS (tránh lệch két khi admin đứng quầy).
async function nhanVienId(req) {
  const [rows] = await query('SELECT id FROM nhanvien WHERE ma_tai_khoan = ?', [req.user.id]);
  if (rows.length > 0) return rows[0].id;
  if (req.user.role === 'admin') {
    await query(
      'INSERT INTO nhanvien (ma_tai_khoan, ho_ten, chuc_vu) VALUES (?, ?, ?)',
      [req.user.id, 'Tài khoản Quản trị', 'Quản trị viên']
    );
    const [after] = await query('SELECT id FROM nhanvien WHERE ma_tai_khoan = ?', [req.user.id]);
    return after.length > 0 ? after[0].id : null;
  }
  return null;
}

// Tính tổng tiền thu/chi TRONG CA (dòng tiền vào/rời két + chuyển khoản):
// - Tiền mặt: dùng để đối soát két khi chốt ca.
// - Chuyển khoản: chỉ thông tin, không nằm trong két.
// Lưu ý: tiền cọc là khoản CHƯA phải của quán nên chỉ góp vào dòng tiền thu, không tính là doanh thu.
async function tinhTienMat(nvId, from, to) {
  const [thuThue] = await query(
    'SELECT ' +
      'COALESCE(SUM(CASE WHEN pt.phuong_thuc_thanh_toan = "tien_mat" THEN ct.don_gia + ct.tien_coc END), 0) AS tm, ' +
      'COALESCE(SUM(CASE WHEN pt.phuong_thuc_thanh_toan = "chuyen_khoan" THEN ct.don_gia + ct.tien_coc END), 0) AS ck ' +
      'FROM phieuthue pt JOIN chitietphieuthue ct ON ct.ma_phieu_thue = pt.id ' +
      'WHERE pt.ma_nhan_vien = ? AND pt.trang_thai <> "da_huy" ' +
      'AND pt.ngay_thue >= ? AND pt.ngay_thue <= ?',
    [nvId, from, to]
  );
  const [thuBan] = await query(
    'SELECT ' +
      'COALESCE(SUM(CASE WHEN pb.phuong_thuc_thanh_toan = "tien_mat" THEN ct.thanh_tien END), 0) AS tm, ' +
      'COALESCE(SUM(CASE WHEN pb.phuong_thuc_thanh_toan = "chuyen_khoan" THEN ct.thanh_tien END), 0) AS ck ' +
      'FROM phieuban pb JOIN chitietphieuban ct ON ct.ma_phieu_ban = pb.id ' +
      'WHERE pb.ma_nhan_vien = ? AND pb.trang_thai <> "da_huy" ' +
      'AND pb.ngay_ban >= ? AND pb.ngay_ban <= ?',
    [nvId, from, to]
  );
  const [thuTra] = await query(
    'SELECT ' +
      'COALESCE(SUM(CASE WHEN pr.phuong_thuc_thanh_toan = "tien_mat" THEN pr.so_tien_khach_tra_them END), 0) AS tm, ' +
      'COALESCE(SUM(CASE WHEN pr.phuong_thuc_thanh_toan = "chuyen_khoan" THEN pr.so_tien_khach_tra_them END), 0) AS ck ' +
      'FROM phieutra pr JOIN chitietphieuthue ct ON ct.id = pr.ma_chi_tiet_phieu_thue ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE pt.ma_nhan_vien = ? AND pr.ngay_tra >= ? AND pr.ngay_tra <= ?',
    [nvId, from, to]
  );
  const [chiTra] = await query(
    'SELECT ' +
      'COALESCE(SUM(CASE WHEN pr.phuong_thuc_thanh_toan = "tien_mat" THEN pr.so_tien_hoan_coc END), 0) AS tm, ' +
      'COALESCE(SUM(CASE WHEN pr.phuong_thuc_thanh_toan = "chuyen_khoan" THEN pr.so_tien_hoan_coc END), 0) AS ck ' +
      'FROM phieutra pr JOIN chitietphieuthue ct ON ct.id = pr.ma_chi_tiet_phieu_thue ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE pt.ma_nhan_vien = ? AND pr.ngay_tra >= ? AND pr.ngay_tra <= ?',
    [nvId, from, to]
  );
  const so = (v) => Number(v) || 0;
  const hang = (v) => Math.round(v * 100) / 100;
  return {
    tong_tien_mat_thu: hang(so(thuThue[0].tm) + so(thuBan[0].tm) + so(thuTra[0].tm)),
    tong_tien_mat_chi: hang(so(chiTra[0].tm)),
    tong_tien_chuyen_khoan_thu: hang(so(thuThue[0].ck) + so(thuBan[0].ck) + so(thuTra[0].ck)),
    tong_tien_chuyen_khoan_chi: hang(so(chiTra[0].ck)),
  };
}

// API: danh sách ca (admin thấy tất cả, staff chỉ thấy ca của mình)
async function listCaLamViec(req, res) {
  try {
    const nvId = await nhanVienId(req);
    if (req.user.role === 'staff' && !nvId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    let sql =
      'SELECT cl.id, cl.ma_nhan_vien, cl.thoi_gian_mo, cl.tien_mat_dau_ca, cl.thoi_gian_chot, ' +
      'cl.tien_mat_thuc_te, cl.tong_tien_mat_thu, cl.tong_tien_mat_chi, cl.tien_mat_ky_vong, cl.chenh_lech, cl.ghi_chu, cl.trang_thai, nv.ho_ten ' +
      'FROM calamviec cl JOIN nhanvien nv ON nv.id = cl.ma_nhan_vien ';
    const params = [];
    if (req.user.role === 'staff') {
      sql += 'WHERE cl.ma_nhan_vien = ? ';
      params.push(nvId);
    }
    sql += 'ORDER BY cl.id DESC LIMIT 100';
    const [rows] = await query(sql, params);
    for (const c of rows) {
      if (c.trang_thai === 'mo') {
        const totals = await tinhTienMat(c.ma_nhan_vien, c.thoi_gian_mo, new Date());
        c.tong_tien_mat_thu = totals.tong_tien_mat_thu;
        c.tong_tien_mat_chi = totals.tong_tien_mat_chi;
        c.tien_mat_ky_vong = Math.round((Number(c.tien_mat_dau_ca) + totals.tong_tien_mat_thu - totals.tong_tien_mat_chi) * 100) / 100;
      }
    }
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// API: ca đang mở của nhân viên hiện tại (admin -> null)
async function caHienTai(req, res) {
  try {
    const nvId = await nhanVienId(req);
    if (!nvId) return res.json(null);
    const [rows] = await query(
      'SELECT * FROM calamviec WHERE ma_nhan_vien = ? AND trang_thai = "mo" ORDER BY id DESC LIMIT 1',
      [nvId]
    );
    if (rows.length === 0) return res.json(null);
    const totals = await tinhTienMat(nvId, rows[0].thoi_gian_mo, new Date());
    const kyVong = Number(rows[0].tien_mat_dau_ca) + totals.tong_tien_mat_thu - totals.tong_tien_mat_chi;
    return res.json({ ...rows[0], ...totals, tien_mat_ky_vong: Math.round(kyVong * 100) / 100 });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// API: chi tiết ca + dự kiến đối soát
async function getCaLamViec(req, res) {
  try {
    const { id } = req.params;
    const nvId = await nhanVienId(req);
    const [rows] = await query(
      'SELECT cl.*, nv.ho_ten FROM calamviec cl JOIN nhanvien nv ON nv.id = cl.ma_nhan_vien WHERE cl.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy ca làm việc.' });
    const ca = rows[0];
    if (req.user.role === 'staff' && ca.ma_nhan_vien !== nvId) {
      return res.status(403).json({ message: 'Không có quyền truy cập ca của nhân viên khác.' });
    }
    if (ca.trang_thai === 'mo') {
      const totals = await tinhTienMat(ca.ma_nhan_vien, ca.thoi_gian_mo, new Date());
      ca.tong_tien_mat_thu = totals.tong_tien_mat_thu;
      ca.tong_tien_mat_chi = totals.tong_tien_mat_chi;
      ca.tien_mat_ky_vong = Math.round((Number(ca.tien_mat_dau_ca) + totals.tong_tien_mat_thu - totals.tong_tien_mat_chi) * 100) / 100;
    }
    return res.json(ca);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// API: mở ca mới
async function moCaLamViec(req, res) {
  const { tien_mat_dau_ca } = req.body;
  const dauCa = Number(tien_mat_dau_ca);
  if (Number.isNaN(dauCa) || dauCa < 0) {
    return res.status(400).json({ message: 'Số tiền mặt đầu ca không hợp lệ.' });
  }
  try {
    const nvId = await nhanVienId(req);
    if (!nvId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    const [opened] = await query(
      'SELECT id FROM calamviec WHERE ma_nhan_vien = ? AND trang_thai = "mo" ORDER BY id DESC LIMIT 1',
      [nvId]
    );
    if (opened.length > 0) {
      return res.status(400).json({ message: 'Đã có ca đang mở. Hãy chốt ca hiện tại trước khi mở ca mới.' });
    }
    const [r] = await query('INSERT INTO calamviec (ma_nhan_vien, tien_mat_dau_ca) VALUES (?, ?)', [nvId, dauCa]);
    await writeAudit(null, req, 'mo_ca', 'ca_lam_viec', r.insertId, `Tiền mặt đầu ca: ${dauCa}`);
    return res.status(201).json({ message: 'Mở ca làm việc thành công.', id: r.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// API: chốt ca (nhân viên chỉ chốt ca của mình; admin chốt cưỡng chế bất kỳ ca đang mở)
async function chotCaLamViec(req, res) {
  const { id } = req.params;
  const { tien_mat_thuc_te, ghi_chu } = req.body;
  const thucTe = Number(tien_mat_thuc_te);
  if (Number.isNaN(thucTe) || thucTe < 0) {
    return res.status(400).json({ message: 'Số tiền mặt thực tế không hợp lệ.' });
  }
  try {
    const nvId = await nhanVienId(req);
    if (req.user.role === 'staff' && !nvId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });

    const result = await transaction(async (conn) => {
      const [rows] = await conn.query('SELECT * FROM calamviec WHERE id = ? FOR UPDATE', [id]);
      if (rows.length === 0) throw Object.assign(new Error('Không tìm thấy ca làm việc.'), { status: 404 });
      const ca = rows[0];
      if (ca.trang_thai === 'da_chot') throw Object.assign(new Error('Ca này đã được chốt rồi.'), { status: 400 });
      if (req.user.role === 'staff' && ca.ma_nhan_vien !== nvId) {
        throw Object.assign(new Error('Bạn không thể chốt ca của nhân viên khác.'), { status: 403 });
      }
      const totals = await tinhTienMat(ca.ma_nhan_vien, ca.thoi_gian_mo, new Date());
      const kyVong = Math.round((Number(ca.tien_mat_dau_ca) + totals.tong_tien_mat_thu - totals.tong_tien_mat_chi) * 100) / 100;
      const chenhLech = Math.round((thucTe - kyVong) * 100) / 100;
      await conn.query(
        'UPDATE calamviec SET thoi_gian_chot = NOW(), tien_mat_thuc_te = ?, tong_tien_mat_thu = ?, tong_tien_mat_chi = ?, ' +
        'tong_tien_chuyen_khoan_thu = ?, tong_tien_chuyen_khoan_chi = ?, tien_mat_ky_vong = ?, chenh_lech = ?, ghi_chu = ?, trang_thai = "da_chot" WHERE id = ?',
        [thucTe, totals.tong_tien_mat_thu, totals.tong_tien_mat_chi, totals.tong_tien_chuyen_khoan_thu, totals.tong_tien_chuyen_khoan_chi, kyVong, chenhLech, ghi_chu || null, id]
      );
      return { ...totals, tien_mat_ky_vong: kyVong, chenh_lech: chenhLech, thoi_gian_chot: new Date() };
    });
    await writeAudit(null, req, 'chot_ca', 'ca_lam_viec', Number(id), ghi_chu || `Chênh lệch ${result.chenh_lech}`);
    return res.json({ message: 'Chốt ca thành công.', id: Number(id), ...result });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message, error: err.message });
  }
}

module.exports = { listCaLamViec, caHienTai, getCaLamViec, moCaLamViec, chotCaLamViec, nhanVienId, tinhTienMat };