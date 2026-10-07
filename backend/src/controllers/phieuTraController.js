const { query, transaction } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');
const { nhanVienId } = require('./caLamViecController');

// Kiểm tra nhân viên đang có ca mở: nếu chưa thì chặn (dùng cho lập phiếu trả / báo mất)
async function kiemTraCaMo(req) {
  const nvId = await nhanVienId(req);
  if (!nvId) return { err: { status: 403, message: 'Không tìm thấy hồ sơ nhân viên.' } };
  const [caRows] = await query('SELECT id FROM calamviec WHERE ma_nhan_vien = ? AND trang_thai = "mo" ORDER BY id DESC LIMIT 1', [nvId]);
  if (caRows.length === 0) return { err: { status: 400, message: 'Chưa mở ca làm việc. Hãy mở ca tại màn hình Ca làm việc trước khi lập phiếu.' } };
  return { nvId };
}

async function listPhieuTra(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql =
      'SELECT pr.id, pr.ngay_tra, pr.tinh_trang_nhan, pr.phi_phat_sinh, pr.so_tien_hoan_coc, pr.so_tien_khach_tra_them, pr.ghi_chu, ' +
      'ctpt.id AS ma_chi_tiet_phieu_thue, bs.ma_ban_sao AS ma_ban_sao_str, t.ten_truyen, ' +
      'COALESCE(kh.ho_ten, pt.ten_khach_le) AS ten_khach, pt.id AS ma_phieu_thue ' +
      'FROM phieutra pr ' +
      'JOIN chitietphieuthue ctpt ON ctpt.id = pr.ma_chi_tiet_phieu_thue ' +
      'JOIN bansao bs ON bs.id = ctpt.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pt ON pt.id = ctpt.ma_phieu_thue ' +
      'LEFT JOIN khachhang kh ON kh.id = pt.ma_khach_hang ';
    const params = [];
    if (tu_khoa) {
      sql += 'WHERE (kh.ho_ten LIKE ? OR pt.ten_khach_le LIKE ? OR bs.ma_ban_sao LIKE ?) ';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += 'ORDER BY pr.id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Danh sách dòng đang thuê (màn hình Nhận trả / quét mã bản sao)
async function dangThue(req, res) {
  const { ma_ban_sao, sdt, tu_khoa } = req.query;
  try {
    let sql =
      'SELECT ct.id AS ma_chi_tiet_phieu_thue, pt.ngay_thue, ct.ngay_hen_tra, ct.don_gia, ct.tien_coc, ' +
      'ct.trang_thai AS trang_thai_ct, ' +
      'bs.ma_ban_sao, bs.vi_tri_ke, t.ten_truyen, t.tac_gia, t.gia_ban, ' +
      'pt.id AS ma_phieu_thue, ' +
      'COALESCE(kh.ho_ten, pt.ten_khach_le) AS ten_khach, COALESCE(kh.diem_tich_luy, 0) AS diem_tich_luy, ' +
      'COALESCE(tk.so_dien_thoai, "") AS so_dien_thoai, ' +
      'DATEDIFF(NOW(), ct.ngay_hen_tra) AS so_ngay_tre ' +
      'FROM chitietphieuthue ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'LEFT JOIN khachhang kh ON kh.id = pt.ma_khach_hang ' +
      'LEFT JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan ';
    const conds = ["ct.trang_thai = 'dang_thue'", "pt.trang_thai != 'da_huy'"];
    const params = [];
    if (ma_ban_sao) conds.push('bs.ma_ban_sao = ?');
    if (sdt) conds.push('tk.so_dien_thoai LIKE ?');
    if (tu_khoa) conds.push('(bs.ma_ban_sao LIKE ? OR COALESCE(kh.ho_ten, pt.ten_khach_le) LIKE ? OR tk.so_dien_thoai LIKE ?)');
    sql += ' WHERE ' + conds.join(' AND ');
    if (ma_ban_sao) params.push(ma_ban_sao);
    if (sdt) params.push(`%${String(sdt).replace(/[^0-9]/g, '').slice(-10)}`);
    if (tu_khoa) params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    sql += ' ORDER BY ct.ngay_hen_tra';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Lập phiếu trả (có thể trả từng phần)
async function createPhieuTra(req, res) {
  const { ma_chi_tiet_phieu_thue, tinh_trang_nhan, phi_phat_sinh, ghi_chu } = req.body;
  const phuongThuc = ['tien_mat', 'chuyen_khoan'].includes(req.body.phuong_thuc_thanh_toan) ? req.body.phuong_thuc_thanh_toan : 'tien_mat';
  if (!ma_chi_tiet_phieu_thue || !tinh_trang_nhan) {
    return res.status(400).json({ message: 'Thiếu thông tin phiếu trả.' });
  }
  if (!['tot', 'tre_han', 'hu_nhe', 'hu_nang_mat'].includes(tinh_trang_nhan)) {
    return res.status(400).json({ message: 'Tình trạng nhận không hợp lệ.' });
  }
  if (
    tinh_trang_nhan === 'hu_nhe' &&
    phi_phat_sinh !== undefined && phi_phat_sinh !== null && phi_phat_sinh !== '' &&
    (!Number.isFinite(Number(phi_phat_sinh)) || Number(phi_phat_sinh) < 0)
  ) {
    return res.status(400).json({ message: 'Phí sửa chữa phải là số không âm.' });
  }
  try {
    const { err, nvId } = await kiemTraCaMo(req);
    if (err) return res.status(err.status).json({ message: err.message });
    const result = await transaction(async (conn) => {
      void nvId;
      const [ctRows] = await conn.query(
        'SELECT ct.id, ct.ma_ban_sao, ct.ngay_hen_tra, ct.trang_thai, ct.tien_coc, bs.ma_truyen, bs.ma_ban_sao AS ma_bs, tr.gia_ban, tr.ten_truyen ' +
        'FROM chitietphieuthue ct JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
        'JOIN truyen tr ON tr.id = bs.ma_truyen WHERE ct.id = ? FOR UPDATE',
        [ma_chi_tiet_phieu_thue]
      );
      if (ctRows.length === 0) throw Object.assign(new Error('Không tìm thấy dòng thuê.'), { status: 404 });
      if (ctRows[0].trang_thai !== 'dang_thue') {
        throw Object.assign(new Error('Dòng thuê này không còn ở trạng thái đang thuê.'), { status: 400 });
      }

      // Tính phí phát sinh
      let phi = 0;
      let tinhTrangBanSao = 'san_sang';
      if (tinh_trang_nhan === 'hu_nhe') {
        // Chấp nhận phí sửa chữa tự nhập (VD: % giá bán hoặc số tiền); mặc định 20000
        phi += phi_phat_sinh !== undefined && phi_phat_sinh !== null && phi_phat_sinh !== ''
          ? Math.max(0, Number(phi_phat_sinh))
          : 20000;
        tinhTrangBanSao = 'bao_tri';
      } else if (tinh_trang_nhan === 'hu_nang_mat') {
        phi += Number(ctRows[0].gia_ban);
        tinhTrangBanSao = 'ngung_luu_hanh';
      }

      // Phí trễ hạn: 2000đ/ngày trễ (số ngày trọn đã quá hẹn)
      const [ngRows] = await conn.query('SELECT DATEDIFF(NOW(), ?) AS so_ngay', [ctRows[0].ngay_hen_tra]);
      const soNgayTre = Math.max(0, Number(ngRows[0].so_ngay));
      if (soNgayTre > 0) phi += soNgayTre * 2000;

      // A4: Ghi rõ tiền hoàn cọc / tiền khách trả thêm = max(0, cọc - phí) / max(0, phí - cọc)
      const tienCoc = Number(ctRows[0].tien_coc || 0);
      const soTienHoanCoc = Math.max(0, Math.round((tienCoc - phi) * 100) / 100);
      const soTienKhachTraThem = Math.max(0, Math.round((phi - tienCoc) * 100) / 100);

      const [r] = await conn.query(
        'INSERT INTO phieutra (ma_chi_tiet_phieu_thue, tinh_trang_nhan, phi_phat_sinh, so_tien_hoan_coc, so_tien_khach_tra_them, ghi_chu, phuong_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ma_chi_tiet_phieu_thue, tinh_trang_nhan, phi, soTienHoanCoc, soTienKhachTraThem, ghi_chu || null, phuongThuc]
      );
      await conn.query('UPDATE chitietphieuthue SET trang_thai = "da_tra" WHERE id = ?', [ma_chi_tiet_phieu_thue]);
      await conn.query('UPDATE bansao SET trang_thai = ?, tinh_trang_hien_tai = ? WHERE id = ?', [
        tinhTrangBanSao,
        tinh_trang_nhan === 'hu_nhe' || tinh_trang_nhan === 'hu_nang_mat' ? 'hu_hong' : 'tot',
        ctRows[0].ma_ban_sao,
      ]);
      return { id: r.insertId, phi_phat_sinh: phi, so_ngay_tre: soNgayTre, so_tien_hoan_coc: soTienHoanCoc, so_tien_khach_tra_them: soTienKhachTraThem };
    });
    return res.status(201).json({
      message: 'Lập phiếu trả thành công.',
      id: result.id,
      phi_phat_sinh: result.phi_phat_sinh,
      so_ngay_tre: result.so_ngay_tre,
      so_tien_hoan_coc: result.so_tien_hoan_coc,
      so_tien_khach_tra_them: result.so_tien_khach_tra_them,
    });
  } catch (err) {
    // Chỉ trả message cho lỗi nghiệp vụ và ghi status; log hệ thống (DB) không trả chi tiết.
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
}

// Báo mất truyện
async function baoMatTruyen(req, res) {
  const { ma_chi_tiet_phieu_thue, ghi_chu } = req.body;
  const lyDo = String((ghi_chu || '').trim());
  const phuongThuc = ['tien_mat', 'chuyen_khoan'].includes(req.body.phuong_thuc_thanh_toan) ? req.body.phuong_thuc_thanh_toan : 'tien_mat';
  if (!ma_chi_tiet_phieu_thue) return res.status(400).json({ message: 'Thiếu thông tin.' });
  if (!lyDo) return res.status(400).json({ message: 'Vui lòng nhập lý do báo mất (VD: khách xác nhận làm mất, điều tra xác nhận...).' });
  try {
    const { err } = await kiemTraCaMo(req);
    if (err) return res.status(err.status).json({ message: err.message });
    const result = await transaction(async (conn) => {
      const [ctRows] = await conn.query(
        'SELECT ct.*, bs.ma_truyen, bs.ma_ban_sao AS ma_bs, tr.gia_ban FROM chitietphieuthue ct ' +
        'JOIN bansao bs ON bs.id = ct.ma_ban_sao JOIN truyen tr ON tr.id = bs.ma_truyen WHERE ct.id = ? FOR UPDATE',
        [ma_chi_tiet_phieu_thue]
      );
      if (ctRows.length === 0) throw Object.assign(new Error('Không tìm thấy dòng thuê.'), { status: 404 });
      if (ctRows[0].trang_thai !== 'dang_thue') {
        throw Object.assign(new Error('Dòng thuê này không còn ở trạng thái đang thuê.'), { status: 400 });
      }
      const phi = Number(ctRows[0].gia_ban);
      const tienCoc = Number(ctRows[0].tien_coc || 0);
      // BÙ TRỪ cọc với tiền bồi thường: khách chỉ đóng thêm phần thiếu, cửa hàng chỉ trả lại phần thừa
      const soTienHoanCoc = Math.max(0, Math.round((tienCoc - phi) * 100) / 100);
      const soTienKhachTraThem = Math.max(0, Math.round((phi - tienCoc) * 100) / 100);
      const [r] = await conn.query(
        'INSERT INTO phieutra (ma_chi_tiet_phieu_thue, tinh_trang_nhan, phi_phat_sinh, so_tien_hoan_coc, so_tien_khach_tra_them, ghi_chu, phuong_thuc_thanh_toan) VALUES (?, "hu_nang_mat", ?, ?, ?, ?, ?)',
        [ma_chi_tiet_phieu_thue, phi, soTienHoanCoc, soTienKhachTraThem, lyDo, phuongThuc]
      );
      await conn.query('UPDATE chitietphieuthue SET trang_thai = "mat" WHERE id = ?', [ma_chi_tiet_phieu_thue]);
      await conn.query('UPDATE bansao SET trang_thai = "ngung_luu_hanh", tinh_trang_hien_tai = "hu_hong" WHERE id = ?', [ctRows[0].ma_ban_sao]);
      await writeAudit(conn, req, 'bao_mat', 'chitiet_phieu_thue', ma_chi_tiet_phieu_thue, lyDo);
      return { id: r.insertId, phi, so_tien_hoan_coc: soTienHoanCoc, so_tien_khach_tra_them: soTienKhachTraThem };
    });
    return res.status(201).json({
      message: 'Đã ghi nhận báo mất.',
      id: result.id,
      phi_boi_thuong: result.phi,
      so_tien_hoan_coc: result.so_tien_hoan_coc,
      so_tien_khach_tra_them: result.so_tien_khach_tra_them,
    });
  } catch (err) {
    // Chỉ trả message cho lỗi nghiệp vụ và ghi status; log hệ thống (DB) không trả chi tiết.
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
}

module.exports = { listPhieuTra, dangThue, createPhieuTra, baoMatTruyen };
