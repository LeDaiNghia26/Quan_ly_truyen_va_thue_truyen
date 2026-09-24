const { query, transaction } = require('../config/db');
const { notify } = require('./thongBaoHelper');
const { diemThuongTheoTien, mapHang } = require('./cauHinhHelper');
const { writeAudit } = require('./auditLogHelper');
const { nhanVienId } = require('./caLamViecController');

async function listPhieuThue(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql =
      'SELECT pt.id, pt.ngay_thue, pt.ma_dat_truoc, pt.trang_thai, nv.ho_ten AS ma_nhan_vien, ' +
      'COALESCE(kh.ho_ten, pt.ten_khach_le) AS ten_khach, ' +
      'COALESCE(kh.diem_tich_luy, NULL) AS diem_tich_luy, ' +
      'COUNT(ctpt.id) AS so_dau, ' +
      'SUM(ctpt.don_gia) AS tong_tien, ' +
      'SUM(CASE WHEN ctpt.trang_thai = "dang_thue" THEN 1 ELSE 0 END) AS dang_thue, ' +
      'SUM(CASE WHEN ctpt.trang_thai = "da_tra" THEN 1 ELSE 0 END) AS da_tra ' +
      'FROM phieuthue pt ' +
      'JOIN nhanvien nv ON nv.id = pt.ma_nhan_vien ' +
      'LEFT JOIN khachhang kh ON kh.id = pt.ma_khach_hang ' +
      'LEFT JOIN chitietphieuthue ctpt ON ctpt.ma_phieu_thue = pt.id ';
    const params = [];
    if (tu_khoa) {
      sql += 'WHERE (kh.ho_ten LIKE ? OR pt.ten_khach_le LIKE ? OR pt.sdt_khach_le LIKE ?) ';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += 'GROUP BY pt.id, pt.trang_thai, nv.ho_ten, kh.ho_ten, pt.ten_khach_le, pt.sdt_khach_le, kh.diem_tich_luy ORDER BY pt.id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getPhieuThue(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT pt.*, kh.ho_ten, nv.ho_ten AS nhan_vien FROM phieuthue pt ' +
      'LEFT JOIN khachhang kh ON kh.id = pt.ma_khach_hang ' +
      'JOIN nhanvien nv ON nv.id = pt.ma_nhan_vien WHERE pt.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu thuê.' });
    const [chiTiet] = await query(
      'SELECT ct.id, ct.ma_ban_sao, bs.ma_ban_sao AS ma_ban_sao_str, t.ten_truyen, ct.don_gia, ct.tien_coc, ' +
      'sk.ten_su_kien, sk.kieu_giam, sk.gia_tri, ' +
      'ct.ngay_hen_tra, ct.tinh_trang_giao, ct.trang_thai, ' +
      'CASE WHEN ct.trang_thai = "da_tra" THEN pr.id ELSE NULL END AS ma_phieu_tra ' +
      'FROM chitietphieuthue ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'LEFT JOIN sukiengiamgia sk ON sk.id = ct.ma_su_kien ' +
      'LEFT JOIN phieutra pr ON pr.ma_chi_tiet_phieu_thue = ct.id WHERE ct.ma_phieu_thue = ?',
      [id]
    );
    return res.json({ ...rows[0], chi_tiet: chiTiet });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Lập phiếu thuê
async function createPhieuThue(req, res) {
  const {
    ma_khach_hang, ten_khach_le, sdt_khach_le, ma_dat_truoc,
    chi_tiet, // [{ma_ban_sao, ngay_hen_tra, tinh_trang_giao, ma_su_kien?}]
  } = req.body;
  const phuongThuc = ['tien_mat', 'chuyen_khoan'].includes(req.body.phuong_thuc_thanh_toan) ? req.body.phuong_thuc_thanh_toan : 'tien_mat';
  if (!Array.isArray(chi_tiet) || chi_tiet.length === 0) {
    return res.status(400).json({ message: 'Thiếu chi tiết phiếu thuê.' });
  }
  try {
    const nvId = await nhanVienId(req);
    if (!nvId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    const [caRows] = await query('SELECT id FROM calamviec WHERE ma_nhan_vien = ? AND trang_thai = "mo" ORDER BY id DESC LIMIT 1', [nvId]);
    if (caRows.length === 0) return res.status(400).json({ message: 'Chưa mở ca làm việc. Hãy mở ca tại màn hình Ca làm việc trước khi lập phiếu.' });

    const result = await transaction(async (conn) => {
      const dtRows = ma_dat_truoc ? await conn.query('SELECT id, trang_thai, loai, ma_khach_hang, ma_su_kien, so_tien_giam, gia_goc, tien_coc FROM dattruoc WHERE id = ?', [ma_dat_truoc]) : [null];
      if (ma_dat_truoc && !dtRows[0][0]) throw Object.assign(new Error('Không tìm thấy đơn đặt trước.'), { status: 404 });
      if (ma_dat_truoc && dtRows[0][0].trang_thai !== 'cho_nhan') {
        throw Object.assign(new Error('Đơn đặt trước không còn ở trạng thái chờ nhận.'), { status: 400 });
      }
      if (ma_dat_truoc && dtRows[0][0].loai !== 'thue') {
        throw Object.assign(new Error('Đơn đặt trước này là đơn mua, không phải thuê.'), { status: 400 });
      }
      let suKienDon = ma_dat_truoc ? dtRows[0][0].ma_su_kien : null;
      const soTienGiamLock = ma_dat_truoc ? Number(dtRows[0][0].so_tien_giam || 0) : 0;
      // Nếu không truyền khách hàng thì lấy từ đơn đặt trước
      let maKhach = ma_khach_hang;
      if (ma_dat_truoc && !maKhach) maKhach = dtRows[0][0].ma_khach_hang;
      if (!maKhach && !ten_khach_le) throw Object.assign(new Error('Thiếu khách hàng hoặc thông tin khách vãng lai.'), { status: 400 });

      // Nếu phiếu thuê từ đơn đặt trước: bản sao phải đúng đơn đã giữ, HOẶC nhân viên được phép đổi
      // sang bản khác cùng đầu truyện + cùng tập và đang "san_sang"
      let heldList = [];
      if (ma_dat_truoc) {
        const [cdt] = await conn.query(
          'SELECT cdt.ma_ban_sao, bs.ma_truyen, bs.tap FROM chitietdattruoc cdt ' +
          'JOIN bansao bs ON bs.id = cdt.ma_ban_sao WHERE cdt.ma_dat_truoc = ?',
          [ma_dat_truoc]
        );
        heldList = cdt;
        const heldIds = new Set(cdt.map((c) => c.ma_ban_sao));
        for (const item of chi_tiet) {
          const isHeld = heldIds.has(item.ma_ban_sao);
          if (!isHeld) {
            const [alt] = await conn.query(
              'SELECT id FROM bansao WHERE id = ? AND trang_thai = "san_sang" AND (ma_truyen, tap) IN (SELECT ma_truyen, tap FROM chitietdattruoc cdt JOIN bansao bb ON bb.id = cdt.ma_ban_sao WHERE cdt.ma_dat_truoc = ?)',
              [item.ma_ban_sao, ma_dat_truoc]
            );
            if (alt.length === 0) {
              throw Object.assign(new Error(`Bản sao ${item.ma_ban_sao} không thuộc đơn đặt trước (chỉ đổi được bản khác cùng truyện/tập và đang sẵn sàng).`), { status: 400 });
            }
          }
        }
      }

      const [r1] = await conn.query(
        'INSERT INTO phieuthue (ma_khach_hang, ten_khach_le, sdt_khach_le, ma_nhan_vien, ma_dat_truoc, phuong_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, ?)',
        [maKhach || null, ten_khach_le || null, sdt_khach_le || null, nvId, ma_dat_truoc || null, phuongThuc]
      );

      let tongGiaThue = 0;
      const usedBansao = new Set();
      for (const item of chi_tiet) {
        const [bs] = await conn.query('SELECT bs.*, t.gia_thue, t.tien_coc, t.ten_truyen FROM bansao bs JOIN truyen t ON t.id = bs.ma_truyen WHERE bs.id = ? FOR UPDATE', [item.ma_ban_sao]);
        if (bs.length === 0) throw Object.assign(new Error('Bản sao không tồn tại.'), { status: 404 });
        if (bs[0].trang_thai !== 'san_sang' && bs[0].trang_thai !== 'dang_giu') {
          throw Object.assign(new Error(`Bản sao ${bs[0].ma_ban_sao} không sẵn sàng để thuê.`), { status: 409 });
        }
        // Voucher: đơn đặt trước dùng ĐÚNG giá trị đã cam kết lúc đặt (giá gốc khóa + giảm khóa, không phụ thuộc cấu hình/sự kiện hiện tại)
        let maSuKien = suKienDon || item.ma_su_kien || null;
        let donGia = Number(item.don_gia || bs[0].gia_thue);
        if (ma_dat_truoc) {
          const giaGocLock = Number(dtRows[0][0].gia_goc || bs[0].gia_thue);
          donGia = Math.max(0, Math.round((giaGocLock - soTienGiamLock) * 100) / 100);
        } else if (maSuKien) {
          const [skRows] = await conn.query(
            'SELECT * FROM sukiengiamgia WHERE id = ? AND trang_thai = "hoat_dong" AND ngay_bat_dau <= NOW() AND ngay_ket_thuc >= NOW() ' +
            'AND (pham_vi = "toan_bo" OR (pham_vi = "the_loai" AND EXISTS (SELECT 1 FROM TruyenTheLoai ttl WHERE ttl.ma_truyen = ? AND ttl.ma_the_loai = sukiengiamgia.ma_the_loai)) OR (pham_vi = "truyen" AND ma_truyen = ?)) LIMIT 1',
            [maSuKien, bs[0].ma_truyen, bs[0].ma_truyen]
          );
          if (skRows.length === 0) {
            if (!suKienDon) throw Object.assign(new Error('Mã giảm giá không áp dụng cho truyện này.'), { status: 400 });
          } else {
            const sk = skRows[0];
            donGia = sk.kieu_giam === 'phan_tram'
              ? Math.round(donGia * (100 - Number(sk.gia_tri)) / 100 * 100) / 100
              : Math.max(0, donGia - Number(sk.gia_tri));
          }
        }
        // Đơn đặt trước: cọc dùng ĐÚNG giá trị khóa lúc đặt (không theo cấu hình hiện tại)
        const tienCocGhi = ma_dat_truoc
          ? Number(dtRows[0][0].tien_coc || 0)
          : Number(item.tien_coc ?? (bs[0].tien_coc ?? bs[0].gia_ban) ?? 0);
        await conn.query(
          'INSERT INTO chitietphieuthue (ma_phieu_thue, ma_ban_sao, ma_su_kien, don_gia, tien_coc, ngay_hen_tra, tinh_trang_giao) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [r1.insertId, item.ma_ban_sao, maSuKien, donGia, tienCocGhi, item.ngay_hen_tra, item.tinh_trang_giao || 'moi']
        );
        await conn.query('UPDATE bansao SET trang_thai = "dang_cho_thue" WHERE id = ?', [item.ma_ban_sao]);
        await conn.query('UPDATE truyen SET luot_thue = luot_thue + 1 WHERE id = ?', [bs[0].ma_truyen]);
        tongGiaThue += donGia;
        usedBansao.add(item.ma_ban_sao);
      }

      // Nếu nhân viên đổi bản sao: trả về kho các bản đã giữ trong đơn nhưng không được dùng
      if (ma_dat_truoc) {
        for (const c of heldList) {
          if (!usedBansao.has(c.ma_ban_sao)) {
            await conn.query('UPDATE bansao SET trang_thai = "san_sang" WHERE id = ?', [c.ma_ban_sao]);
          }
        }
      }

      if (ma_dat_truoc) {
        await conn.query('UPDATE dattruoc SET trang_thai = "da_xac_nhan" WHERE id = ?', [ma_dat_truoc]);
        if (dtRows[0][0] && dtRows[0][0].ma_khach_hang) {
          await notify(conn, dtRows[0][0].ma_khach_hang, 'Sách đã sẵn sàng', 'Nhân viên đã xác nhận đơn đặt trước. Vui lòng đến quầy lấy sách!', 'dat_truoc', ma_dat_truoc);
        }
      }

      // B5: tích điểm theo tổng tiền thuê thực phát sinh cho khách có tài khoản
      if (maKhach) {
        const [khRows] = await conn.query('SELECT id, tong_diem_tich_luy FROM khachhang WHERE id = ?', [maKhach]);
        if (khRows.length > 0) {
          const earned = diemThuongTheoTien(tongGiaThue);
          if (earned > 0) {
            await conn.query('UPDATE khachhang SET diem_tich_luy = diem_tich_luy + ?, tong_diem_tich_luy = tong_diem_tich_luy + ? WHERE id = ?', [earned, earned, maKhach]);
            await conn.query('INSERT INTO lichsudiem (ma_khach_hang, so_diem, ly_do) VALUES (?, ?, ?)', [maKhach, earned, `Tích điểm khi thuê sách (+${earned})`]);
          }
          const hangMoi = mapHang(khRows[0].tong_diem_tich_luy + earned);
          await conn.query('UPDATE khachhang SET hang_thanh_vien = ? WHERE id = ?', [hangMoi, maKhach]);
        }
      }
      return r1.insertId;
    });
    return res.status(201).json({ message: 'Lập phiếu thuê thành công.', id: result });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// Hủy / thoái phiếu thuê (chỉ khi CHƯA phát sinh phiếu trả): trả bản sao, thu hồi điểm, ghi nhật ký
async function huyPhieuThue(req, res) {
  const { id } = req.params;
  const lyDo = req.body.ly_do;
  if (!lyDo || !String(lyDo).trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do hủy phiếu.' });
  }
  try {
    const result = await transaction(async (conn) => {
      const [ptRows] = await conn.query(
        'SELECT pt.*, kh.ho_ten AS ho_ten_khach FROM phieuthue pt LEFT JOIN khachhang kh ON kh.id = pt.ma_khach_hang WHERE pt.id = ?',
        [id]
      );
      if (ptRows.length === 0) throw Object.assign(new Error('Không tìm thấy phiếu thuê.'), { status: 404 });
      if (String(ptRows[0].trang_thai) === 'da_huy') throw Object.assign(new Error('Phiếu thuê này đã bị hủy.'), { status: 400 });
      const [ctsRows] = await conn.query('SELECT id, ma_ban_sao, don_gia, trang_thai FROM chitietphieuthue WHERE ma_phieu_thue = ?', [id]);
      if (ctsRows.length === 0) throw Object.assign(new Error('Phiếu thuê không có chi tiết.'), { status: 404 });
      const ctIds = ctsRows.map((c) => c.id);
      const [traRows] = await conn.query('SELECT COUNT(*) AS n FROM phieutra WHERE ma_chi_tiet_phieu_thue IN (?)', [ctIds]);
      if (Number(traRows[0].n) > 0) {
        throw Object.assign(new Error('Phiếu thuê đã phát sinh phiếu trả, không thể hủy.'), { status: 400 });
      }

      let tongGiaThue = 0;
      for (const c of ctsRows) {
        tongGiaThue += Number(c.don_gia || 0);
        const [bsInfo] = await conn.query('SELECT ma_truyen FROM bansao WHERE id = ?', [c.ma_ban_sao]);
        await conn.query('UPDATE bansao SET trang_thai = "san_sang" WHERE id = ?', [c.ma_ban_sao]);
        if (bsInfo.length > 0) {
          await conn.query('UPDATE truyen SET luot_thue = GREATEST(0, luot_thue - 1) WHERE id = ?', [bsInfo[0].ma_truyen]);
        }
      }
      await conn.query('UPDATE phieuthue SET trang_thai = "da_huy" WHERE id = ?', [id]);

      // Thu hồi điểm đã tích từ phiếu thuê này
      const maKhach = ptRows[0].ma_khach_hang;
      if (maKhach) {
        const [khRows] = await conn.query('SELECT id, diem_tich_luy, tong_diem_tich_luy FROM khachhang WHERE id = ?', [maKhach]);
        if (khRows.length > 0) {
          const earned = diemThuongTheoTien(tongGiaThue);
          if (earned > 0) {
            await conn.query(
              'UPDATE khachhang SET diem_tich_luy = GREATEST(0, diem_tich_luy - ?), tong_diem_tich_luy = GREATEST(0, tong_diem_tich_luy - ?) WHERE id = ?',
              [earned, earned, maKhach]
            );
            await conn.query(
              'INSERT INTO lichsudiem (ma_khach_hang, so_diem, ly_do) VALUES (?, ?, ?)',
              [maKhach, -earned, `Hoàn tác điểm khi hủy phiếu thuê #${id}`]
            );
          }
          const [kh2] = await conn.query('SELECT tong_diem_tich_luy FROM khachhang WHERE id = ?', [maKhach]);
          await conn.query('UPDATE khachhang SET hang_thanh_vien = ? WHERE id = ?', [mapHang(kh2[0].tong_diem_tich_luy), maKhach]);
        }
      }

      // Nhật ký quản trị + thông báo khách
      await writeAudit(conn, req, 'huy_phieu_thue', 'phieu_thue', Number(id), String(lyDo).trim());
      await conn.query(
        'INSERT INTO thongbaoadmin (tieu_de, noi_dung, loai, ma_tham_chieu) VALUES (?, ?, "huy_phieu", ?)',
        [`Hủy phiếu thuê #${id}`, `Lý do: ${String(lyDo).trim()}. Tất cả bản sao được trả về trạng thái sẵn sàng và điểm tích lũy của khách được hoàn tác.`, id]
      );
      if (maKhach) {
        await notify(conn, maKhach, 'Phiếu thuê đã bị hủy', `Phiếu thuê #${id} đã được quầy hủy bỏ. Điểm đã tích trên phiếu này sẽ được hoàn tác.`, 'tra_sach', id);
      }
      return { so_dau: ctsRows.length };
    });
    return res.json({ message: 'Đã hủy phiếu thuê.', id: Number(id), so_dau: result.so_dau });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { listPhieuThue, getPhieuThue, createPhieuThue, huyPhieuThue };