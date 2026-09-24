const { query, transaction } = require('../config/db');
const { getKhachById } = require('./discountHelper');
const { tienMoiDiem, phanTramHang } = require('./cauHinhHelper');
const { notify } = require('./thongBaoHelper');
const { writeAudit } = require('./auditLogHelper');

// Chuẩn hóa giờ hẹn lấy: nếu khung giờ có dạng "14:00-16:00" thì dùng giờ KẾT THÚC làm mốc giữ sách
function chuanHanNhan(hanNhan, khungGio) {
  const s = String(hanNhan || '');
  if (s.length < 10) return hanNhan;
  const datePart = s.slice(0, 10);
  if (/[T\s]\d{1,2}:\d{2}/.test(s.slice(10))) return s.slice(0, 16).replace('T', ' ');
  const m = String(khungGio || '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (m && Number(m[3]) <= 23) {
    return `${datePart} ${String(m[3]).padStart(2, '0')}:${String(m[4]).padStart(2, '0')}:00`;
  }
  return `${datePart} 23:59:00`;
}

async function listDatTruoc(req, res) {
  const { ma_khach_hang, trang_thai } = req.query;
  try {
    let sql =
      'SELECT dt.*, kh.ho_ten, GROUP_CONCAT(t.ten_truyen SEPARATOR ", ") AS danh_sach_truyen ' +
      'FROM dattruoc dt ' +
      'JOIN khachhang kh ON kh.id = dt.ma_khach_hang ' +
      'LEFT JOIN chitietdattruoc cdt ON cdt.ma_dat_truoc = dt.id ' +
      'LEFT JOIN bansao bs ON bs.id = cdt.ma_ban_sao ' +
      'LEFT JOIN truyen t ON t.id = bs.ma_truyen ';
    const params = [];
    const conds = [];
    if (ma_khach_hang) conds.push('dt.ma_khach_hang = ?');
    if (trang_thai) conds.push('dt.trang_thai = ?');
    if (ma_khach_hang) params.push(ma_khach_hang);
    if (trang_thai) params.push(trang_thai);
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' GROUP BY dt.id, kh.ho_ten ORDER BY dt.id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getDatTruoc(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT dt.*, kh.ho_ten, kh.diem_tich_luy, kh.hang_thanh_vien, sk.ten_su_kien FROM dattruoc dt ' +
      'JOIN khachhang kh ON kh.id = dt.ma_khach_hang ' +
      'LEFT JOIN sukiengiamgia sk ON sk.id = dt.ma_su_kien WHERE dt.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn đặt trước.' });
    const [chiTiet] = await query(
      'SELECT bs.id AS ma_ban_sao, bs.ma_ban_sao AS ma_ban_sao_str, t.id AS ma_truyen, t.ten_truyen, t.gia_thue, t.gia_ban, t.tien_coc ' +
      'FROM chitietdattruoc cdt ' +
      'JOIN bansao bs ON bs.id = cdt.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen WHERE cdt.ma_dat_truoc = ?',
      [id]
    );
    const [ds] = await query(
      'SELECT GROUP_CONCAT(t.ten_truyen SEPARATOR ", ") AS danh_sach_truyen ' +
      'FROM chitietdattruoc cdt JOIN bansao bs ON bs.id = cdt.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen WHERE cdt.ma_dat_truoc = ?',
      [id]
    );
    return res.json({ ...rows[0], danh_sach_truyen: ds[0]?.danh_sach_truyen || '', chi_tiet: chiTiet });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createDatTruoc(req, res) {
  const { ma_truyen, loai, han_nhan, khung_gio, ma_su_kien, diem_su_dung } = req.body;
  if (!ma_truyen || !loai || !han_nhan) {
    return res.status(400).json({ message: 'Thiếu thông tin đặt trước.' });
  }
  if (!['thue', 'mua'].includes(loai)) return res.status(400).json({ message: 'Loại đặt trước không hợp lệ.' });
  try {
    const [khRows] = await query('SELECT id FROM khachhang WHERE ma_tai_khoan = ?', [req.user.id]);
    if (khRows.length === 0) return res.status(403).json({ message: 'Không tìm thấy hồ sơ khách hàng.' });
    const maKhach = khRows[0].id;
    const khach = await getKhachById(maKhach);

    const [truyenRows] = await query('SELECT * FROM truyen WHERE id = ? AND trang_thai = "hoat_dong"', [ma_truyen]);
    if (truyenRows.length === 0) return res.status(404).json({ message: 'Truyện không khả dụng.' });

    // Kiểm tra sự kiện giảm giá được chọn có áp dụng cho truyện này
    let suKien = null;
    if (ma_su_kien) {
      const [skRows] = await query(
        'SELECT * FROM sukiengiamgia WHERE id = ? AND trang_thai = "hoat_dong" AND ngay_bat_dau <= NOW() AND ngay_ket_thuc >= NOW() ' +
        'AND (pham_vi = "toan_bo" OR (pham_vi = "the_loai" AND EXISTS (SELECT 1 FROM TruyenTheLoai ttl WHERE ttl.ma_truyen = ? AND ttl.ma_the_loai = sukiengiamgia.ma_the_loai)) OR (pham_vi = "truyen" AND ma_truyen = ?)) LIMIT 1',
        [ma_su_kien, truyenRows[0].id, truyenRows[0].id]
      );
      if (skRows.length === 0) return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho truyện này.' });
      suKien = skRows[0];
    }

    const result = await transaction(async (conn) => {
      const [bsRows] = await conn.query(
        'SELECT id FROM bansao WHERE ma_truyen = ? AND trang_thai = "san_sang" ORDER BY id LIMIT 1 FOR UPDATE',
        [ma_truyen]
      );
      if (bsRows.length === 0) throw Object.assign(new Error('Truyện hiện không còn bản nào sẵn sàng.'), { status: 409 });

      // ===== KHÓA TOÀN BỘ CAM KẾT TẠI THỜI ĐIỂM ĐẶT =====
      // Giá gốc, % giảm hạng, cọc, điểm tiêu, giảm sự kiện đều cố định lúc đặt;
      // POS lập phiếu phải dùng đúng các giá trị này (không tính lại theo cấu hình hiện tại).
      const truyen = truyenRows[0];
      const giaGocLock = Math.round((loai === 'thue' ? Number(truyen.gia_thue) : Number(truyen.gia_ban)) * 100) / 100;
      const giamHangLock = loai === 'mua' && khach ? Math.round(phanTramHang(khach.hang_thanh_vien) * 100) / 100 : 0;
      const tienCocLock = Math.round((Number(truyen.tien_coc) || Number(truyen.gia_ban) || 0) * 100) / 100;
      const baseGiam = loai === 'thue' ? Number(truyen.gia_thue) : Number(truyen.gia_ban);
      const giamVoucherLock = suKien
        ? (suKien.kieu_giam === 'phan_tram' ? (baseGiam * Number(suKien.gia_tri)) / 100 : Number(suKien.gia_tri))
        : 0;

      // Khóa điểm được tiêu: chỉ mua + VIP lúc đặt; cap theo điểm hiện có và số tiền thực được giảm
      let diemDung = 0;
      if (loai === 'mua' && khach && khach.hang_thanh_vien === 'vip' && Number(diem_su_dung) > 0) {
        const tienSauHang = Math.max(0, giaGocLock - (giaGocLock * giamHangLock) / 100);
        const cap = Math.min(Number(diem_su_dung), khach.diem_tich_luy, Math.floor(Math.max(0, tienSauHang - giamVoucherLock) / tienMoiDiem()));
        diemDung = Math.max(0, cap);
      }

      const [r1] = await conn.query(
        'INSERT INTO dattruoc (ma_khach_hang, loai, han_nhan, khung_gio, ma_su_kien, diem_su_dung, so_tien_giam, gia_goc, phan_tram_giam_hang, tien_coc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [maKhach, loai, chuanHanNhan(han_nhan, khung_gio), khung_gio || null, ma_su_kien || null, diemDung, Math.round(giamVoucherLock * 100) / 100, giaGocLock, giamHangLock, tienCocLock]
      );
      await conn.query(
        'INSERT INTO chitietdattruoc (ma_dat_truoc, ma_ban_sao) VALUES (?, ?)',
        [r1.insertId, bsRows[0].id]
      );
      await conn.query('UPDATE bansao SET trang_thai = "dang_giu" WHERE id = ?', [bsRows[0].id]);

      // Thông báo cho khách
      await conn.query(
        'INSERT INTO thongbao (ma_khach_hang, tieu_de, noi_dung, loai, ma_tham_chieu) VALUES (?, ?, ?, "dat_truoc", ?)',
        [maKhach, 'Đặt trước thành công', `Đơn đặt trước ${loai === 'thue' ? 'thuê' : 'mua'} "${truyen.ten_truyen}" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.`, r1.insertId]
      );
      return { id: r1.insertId, ma_ban_sao: bsRows[0].id, gia_goc: giaGocLock, phan_tram_giam_hang: giamHangLock, giam_voucher: Math.round(giamVoucherLock * 100) / 100, diem_da_dung: diemDung, tien_coc: tienCocLock };
    });

    // Tính tiền cam kết phải trả tại quầy từ CHÍNH các giá trị đã khóa
    const giamDiem = result.diem_da_dung * tienMoiDiem();
    let thanhTien = 0;
    if (loai === 'thue') {
      thanhTien = Math.max(0, result.gia_goc - result.giam_voucher);
    } else {
      const giaSauHang = result.gia_goc - (result.gia_goc * result.phan_tram_giam_hang) / 100;
      thanhTien = Math.max(0, Math.round((giaSauHang - result.giam_voucher - giamDiem) * 100) / 100);
    }

    return res.status(201).json({
      message: 'Đặt trước thành công.',
      id: result.id,
      ma_ban_sao: result.ma_ban_sao,
      chi_tiet: {
        loai,
        gia_goc: result.gia_goc,
        phan_tram_giam_hang: result.phan_tram_giam_hang,
        tien_coc: result.tien_coc,
        giam_voucher: result.giam_voucher,
        diem_da_dung: result.diem_da_dung,
        giam_diem_vip: Math.round(giamDiem * 100) / 100,
        thanh_tien: thanhTien,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function cancelDatTruoc(req, res) {
  const { id } = req.params;
  const isNhanSu = req.user && ['admin', 'staff'].includes(req.user.role);
  const lyDo = String((req.body.ly_do || '').trim());
  if (isNhanSu && !lyDo) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do hủy đơn đặt trước.' });
  }
  try {
    await transaction(async (conn) => {
      const [rows] = await conn.query('SELECT id, trang_thai FROM dattruoc WHERE id = ?', [id]);
      if (rows.length === 0) throw Object.assign(new Error('Không tìm thấy đơn đặt trước.'), { status: 404 });
      if (rows[0].trang_thai !== 'cho_nhan') {
        throw Object.assign(new Error('Đơn đặt trước này không còn ở trạng thái chờ nhận.'), { status: 400 });
      }
      const [cdt] = await conn.query('SELECT ma_ban_sao FROM chitietdattruoc WHERE ma_dat_truoc = ?', [id]);
      for (const row of cdt) {
        await conn.query('UPDATE bansao SET trang_thai = "san_sang" WHERE id = ?', [row.ma_ban_sao]);
      }
      await conn.query('UPDATE dattruoc SET trang_thai = "da_huy" WHERE id = ?', [id]);
      if (isNhanSu) {
        await writeAudit(conn, req, 'huy_dat_truoc', 'dat_truoc', Number(id), lyDo);
      }
    });
    return res.json({ message: 'Đã hủy đơn đặt trước.' });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Tự động hủy các đơn quá hạn giữ sách 2 giờ kể từ giờ hẹn lấy (gọi định kỳ hoặc khi mở hệ thống)
async function autoExpireDatTruocAll() {
  const [rows] = await query(
    'SELECT id, ma_khach_hang FROM dattruoc WHERE trang_thai = "cho_nhan" AND (han_nhan + INTERVAL 2 HOUR) < NOW()'
  );
  for (const row of rows) {
    const [cdt] = await query('SELECT ma_ban_sao FROM chitietdattruoc WHERE ma_dat_truoc = ?', [row.id]);
    await transaction(async (conn) => {
      for (const c of cdt) {
        await conn.query('UPDATE bansao SET trang_thai = "san_sang" WHERE id = ?', [c.ma_ban_sao]);
      }
      await conn.query('UPDATE dattruoc SET trang_thai = "qua_han" WHERE id = ?', [row.id]);
      if (row.ma_khach_hang) {
        await notify(
          conn,
          row.ma_khach_hang,
          'Đơn đặt trước hết hạn',
          `Đơn đặt trước #${row.id} của bạn đã quá hạn giữ sách (2 giờ kể từ giờ hẹn lấy) và bị hủy tự động. Bạn có thể đặt lại bất cứ lúc nào!`,
          'dat_truoc',
          row.id
        );
      }
    });
  }
  return rows.length;
}

async function autoExpireDatTruoc(req, res) {
  try {
    const n = await autoExpireDatTruocAll();
    return res.json({ message: `Đã xử lý ${n} đơn quá hạn.` });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listDatTruoc, getDatTruoc, createDatTruoc, cancelDatTruoc, autoExpireDatTruoc, autoExpireDatTruocAll };