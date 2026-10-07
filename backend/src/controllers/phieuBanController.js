const { query, transaction } = require('../config/db');
const { tinhGiaSauGiam, getKhachById, mapHang } = require('./discountHelper');
const { phanTramHang, tienMoiDiem, diemThuongTheoTien } = require('./cauHinhHelper');
const { notify } = require('./thongBaoHelper');
const { writeAudit } = require('./auditLogHelper');
const { nhanVienId } = require('./caLamViecController');

async function listPhieuBan(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql =
      'SELECT pb.id, pb.ngay_ban, pb.trang_thai, nv.ho_ten AS ma_nhan_vien, ' +
      'COALESCE(kh.ho_ten, pb.ten_khach_le) AS ten_khach, ' +
      'COUNT(ctpb.id) AS so_dau, SUM(ctpb.thanh_tien) AS tong_tien ' +
      'FROM phieuban pb ' +
      'JOIN nhanvien nv ON nv.id = pb.ma_nhan_vien ' +
      'LEFT JOIN khachhang kh ON kh.id = pb.ma_khach_hang ' +
      'LEFT JOIN chitietphieuban ctpb ON ctpb.ma_phieu_ban = pb.id ';
    const params = [];
    if (tu_khoa) {
      sql += 'WHERE (kh.ho_ten LIKE ? OR pb.ten_khach_le LIKE ? OR pb.sdt_khach_le LIKE ?) ';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += 'GROUP BY pb.id, pb.trang_thai, nv.ho_ten, kh.ho_ten, pb.ten_khach_le, pb.sdt_khach_le ORDER BY pb.id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getPhieuBan(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT pb.*, kh.ho_ten, kh.hang_thanh_vien, nv.ho_ten AS nhan_vien FROM phieuban pb ' +
      'LEFT JOIN khachhang kh ON kh.id = pb.ma_khach_hang ' +
      'JOIN nhanvien nv ON nv.id = pb.ma_nhan_vien WHERE pb.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu bán.' });
    const [chiTiet] = await query(
      'SELECT ct.*, bs.ma_ban_sao AS ma_ban_sao_str, t.ten_truyen, sk.ten_su_kien ' +
      'FROM chitietphieuban ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'LEFT JOIN sukiengiamgia sk ON sk.id = ct.ma_su_kien WHERE ct.ma_phieu_ban = ?',
      [id]
    );
    return res.json({ ...rows[0], chi_tiet: chiTiet });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Tính thành tiền một mặt hàng bán, trả về số cần insert
// lockedS = { so_tien_giam, ma_su_kien, gia_goc, phan_tram_giam_hang } dùng khi đơn đặt trước
// đã cam kết toàn bộ giá (voucher + % theo hạng + giá gốc) lúc đặt (khóa giá)
async function tinhMatHang(conn, khach, item, suKienPick, lockedS) {
  const [bsRows] = await conn.query(
    'SELECT bs.*, t.ten_truyen, t.gia_ban FROM bansao bs JOIN truyen t ON t.id = bs.ma_truyen WHERE bs.id = ? FOR UPDATE',
    [item.ma_ban_sao]
  );
  if (bsRows.length === 0) throw Object.assign(new Error('Bản sao không tồn tại.'), { status: 404 });
  const bs = bsRows[0];
  if (bs.trang_thai !== 'san_sang' && bs.trang_thai !== 'dang_giu') {
    throw Object.assign(new Error(`Bản sao ${bs.ma_ban_sao} không sẵn sàng để bán.`), { status: 409 });
  }

  // Giá gốc + % giảm theo hạng: đơn đặt trước dùng ĐÚNG giá trị đã khóa lúc đặt
  const giaGoc = (lockedS && Number(lockedS.gia_goc) > 0) ? Number(lockedS.gia_goc) : Number(bs.gia_ban);
  let giamHang = 0;
  if (lockedS && lockedS.phan_tram_giam_hang !== undefined) {
    giamHang = Number(lockedS.phan_tram_giam_hang);
  } else if (khach) {
    giamHang = phanTramHang(khach.hang_thanh_vien);
  }

  // Giảm theo sự kiện: ưu tiên voucher đã cam kết (lock), rồi voucher nhân viên chọn tại quầy, rồi sự kiện tự áp
  let maSuKien = null;
  let soTienGiamSuKien = 0;
  if (lockedS && Number(lockedS.so_tien_giam) > 0) {
    maSuKien = lockedS.ma_su_kien || null;
    soTienGiamSuKien = Number(lockedS.so_tien_giam);
  } else if (suKienPick) {
    const [skRows] = await conn.query(
      'SELECT * FROM sukiengiamgia WHERE id = ? AND trang_thai = "hoat_dong" AND ngay_bat_dau <= NOW() AND ngay_ket_thuc >= NOW() ' +
      'AND (pham_vi = "toan_bo" OR (pham_vi = "the_loai" AND EXISTS (SELECT 1 FROM TruyenTheLoai ttl WHERE ttl.ma_truyen = ? AND ttl.ma_the_loai = sukiengiamgia.ma_the_loai)) OR (pham_vi = "truyen" AND ma_truyen = ?)) LIMIT 1',
      [suKienPick, bs.ma_truyen, bs.ma_truyen]
    );
    if (skRows.length > 0) {
      const sk = skRows[0];
      maSuKien = sk.id;
      soTienGiamSuKien = sk.kieu_giam === 'phan_tram' ? (giaGoc * Number(sk.gia_tri)) / 100 : Number(sk.gia_tri);
    }
  } else {
    const [suKiens] = await conn.query(
      'SELECT * FROM sukiengiamgia WHERE trang_thai = "hoat_dong" ' +
      'AND ngay_bat_dau <= NOW() AND ngay_ket_thuc >= NOW() ' +
      'AND (pham_vi = "toan_bo" OR (pham_vi = "the_loai" AND EXISTS (SELECT 1 FROM TruyenTheLoai ttl WHERE ttl.ma_truyen = ? AND ttl.ma_the_loai = sukiengiamgia.ma_the_loai)) OR (pham_vi = "truyen" AND ma_truyen = ?))',
      [bs.ma_truyen, bs.ma_truyen]
    );
    for (const sk of suKiens) {
      maSuKien = sk.id;
      soTienGiamSuKien += sk.kieu_giam === 'phan_tram' ? (giaGoc * Number(sk.gia_tri)) / 100 : Number(sk.gia_tri);
    }
  }

  let diemDaDung = 0;
  let thanhTien = giaGoc * (1 - giamHang / 100) - soTienGiamSuKien;
  if (thanhTien < 0) thanhTien = 0;
  if (khach && khach.hang_thanh_vien === 'vip' && item.diem_su_dung) {
    const tmd = tienMoiDiem();
    const diemCap = Math.min(Number(item.diem_su_dung), khach.diem_tich_luy);
    const tienMax = Math.floor(thanhTien / tmd);
    const diemDung = Math.min(diemCap, tienMax);
    diemDaDung = diemDung;
    thanhTien = Math.round((thanhTien - diemDung * tmd) * 100) / 100;
  }
  return {
    bs,
    gia_goc: Math.round(giaGoc * 100) / 100,
    phan_tram: giamHang,
    ma_su_kien: maSuKien,
    so_tien_giam_su_kien: Math.round(soTienGiamSuKien * 100) / 100,
    diem_da_dung: diemDaDung,
    thanh_tien: Math.round(thanhTien * 100) / 100,
  };
}

async function createPhieuBan(req, res) {
  const {
    ma_khach_hang, ten_khach_le, sdt_khach_le, ma_dat_truoc,
    chi_tiet, // [{ma_ban_sao, diem_su_dung?}]
  } = req.body;
  const phuongThuc = ['tien_mat', 'chuyen_khoan'].includes(req.body.phuong_thuc_thanh_toan) ? req.body.phuong_thuc_thanh_toan : 'tien_mat';
  if (!Array.isArray(chi_tiet) || chi_tiet.length === 0) {
    return res.status(400).json({ message: 'Thiếu chi tiết phiếu bán.' });
  }
  try {
    const nvId = await nhanVienId(req);
    if (!nvId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ nhân viên.' });
    const [caRows] = await query('SELECT id FROM calamviec WHERE ma_nhan_vien = ? AND trang_thai = "mo" ORDER BY id DESC LIMIT 1', [nvId]);
    if (caRows.length === 0) return res.status(400).json({ message: 'Chưa mở ca làm việc. Hãy mở ca tại màn hình Ca làm việc trước khi lập phiếu.' });

    const result = await transaction(async (conn) => {
      let maKhach = ma_khach_hang;
      let suKienDon = null;
      let diemDon = 0;
      let soTienGiamLock = 0;
      let heldList = [];
      let dt = null; // Đơn đặt trước (khóa cam kết) — dùng chung cho cả vòng chi tiết
      if (ma_dat_truoc) {
        const [dtRows] = await conn.query('SELECT id, trang_thai, loai, ma_khach_hang, ma_su_kien, diem_su_dung, so_tien_giam, gia_goc, phan_tram_giam_hang FROM dattruoc WHERE id = ?', [ma_dat_truoc]);
        dt = dtRows[0];
        if (!dt) throw Object.assign(new Error('Không tìm thấy đơn đặt trước.'), { status: 404 });
        if (dt.trang_thai !== 'cho_nhan') throw Object.assign(new Error('Đơn đặt trước không còn ở trạng thái chờ nhận.'), { status: 400 });
        if (dt.loai !== 'mua') throw Object.assign(new Error('Đơn đặt trước này là đơn thuê, không phải mua.'), { status: 400 });
        if (!maKhach) maKhach = dt.ma_khach_hang;
        suKienDon = dt.ma_su_kien;
        diemDon = Number(dt.diem_su_dung) || 0;
        soTienGiamLock = Number(dt.so_tien_giam || 0);

        const [cdt] = await conn.query(
          'SELECT cdt.ma_ban_sao, bs.ma_truyen, bs.tap FROM chitietdattruoc cdt ' +
          'JOIN bansao bs ON bs.id = cdt.ma_ban_sao WHERE cdt.ma_dat_truoc = ?',
          [ma_dat_truoc]
        );
        heldList = cdt;
        const heldIds = new Set(cdt.map((c) => c.ma_ban_sao));
        for (const item of chi_tiet) {
          if (!heldIds.has(item.ma_ban_sao)) {
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
      if (!maKhach && !ten_khach_le) throw Object.assign(new Error('Thiếu khách hàng hoặc thông tin khách vãng lai.'), { status: 400 });

      const khach = await getKhachById(maKhach);
      let tongDiemDung = 0;
      let diemConLai = khach ? Number(khach.diem_tich_luy) : 0;
      let diemDonConLai = diemDon;

      const [r1] = await conn.query(
        'INSERT INTO phieuban (ma_khach_hang, ten_khach_le, sdt_khach_le, ma_nhan_vien, ma_dat_truoc, phuong_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, ?)',
        [maKhach || null, ten_khach_le || null, sdt_khach_le || null, nvId, ma_dat_truoc || null, phuongThuc]
      );

      const usedBansao = new Set();
      let tongThanhTien = 0;
      for (const item of chi_tiet) {
        // Voucher nhân viên chọn tại quầy (không ưu tiên nếu đơn đặt trước đã cam kết mã khác)
        const suKienPick = !suKienDon ? (req.body.ma_su_kien || null) : null;
        const lockedS = ma_dat_truoc ? { so_tien_giam: soTienGiamLock, ma_su_kien: suKienDon, gia_goc: Number(dt.gia_goc || 0), phan_tram_giam_hang: Number(dt.phan_tram_giam_hang || 0) } : null;
        // Đơn đặt trước: điểm tiêu theo cam kết khóa lúc đặt, KHÔNG áp nhánh tiêu điểm vãng lai tự do
        const itemTinh = ma_dat_truoc ? { ...item, diem_su_dung: undefined } : item;
        const mh = await tinhMatHang(conn, khach ? { ...khach, diem_tich_luy: diemConLai } : null, itemTinh, suKienPick, lockedS);
        let maSuKien = suKienDon || mh.ma_su_kien;

        // Cho đơn đặt trước: chốt đúng điểm đã cam kết lúc đặt (không vượt số điểm còn lại của khách);
        // hạng VIP lúc đặt đã thể hiện qua diem_su_dung khóa > 0 nên không cần xét hạng hiện tại
        let diemDung = mh.diem_da_dung;
        if (ma_dat_truoc && diemDonConLai > 0 && khach) {
          const cap = Math.min(diemDonConLai, diemConLai, Math.floor(mh.thanh_tien / tienMoiDiem()));
          diemDung = Math.max(0, cap);
          mh.thanh_tien = Math.round((mh.thanh_tien - diemDung * tienMoiDiem()) * 100) / 100;
        }
        diemDonConLai -= diemDung;
        diemConLai -= diemDung;
        await conn.query(
          'INSERT INTO chitietphieuban (ma_phieu_ban, ma_ban_sao, ma_su_kien, gia_goc, phan_tram_giam_hang, so_tien_giam_su_kien, diem_da_dung, thanh_tien) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [r1.insertId, item.ma_ban_sao, maSuKien, mh.gia_goc, mh.phan_tram, mh.so_tien_giam_su_kien, diemDung, mh.thanh_tien]
        );
        await conn.query('UPDATE bansao SET trang_thai = "da_ban" WHERE id = ?', [item.ma_ban_sao]);
        await conn.query('UPDATE truyen SET luot_mua = luot_mua + 1 WHERE id = ?', [mh.bs.ma_truyen]);
        tongDiemDung += diemDung;
        tongThanhTien += mh.thanh_tien;
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
        if (maKhach) {
          await notify(conn, maKhach, 'Đơn mua đã hoàn tất', 'Nhân viên đã xác nhận và lập phiếu bán cho đơn đặt trước của bạn.', 'dat_truoc', ma_dat_truoc);
        }
      }

      // B5: cập nhật điểm (trừ điểm đã dùng) + tích điểm theo tổng tiền thực thanh toán + xét hạng theo TỔNG điểm tích lũy
      if (khach) {
        if (tongDiemDung > 0) {
          await conn.query('UPDATE khachhang SET diem_tich_luy = diem_tich_luy - ? WHERE id = ?', [tongDiemDung, khach.id]);
          await conn.query(
            'INSERT INTO lichsudiem (ma_khach_hang, so_diem, ly_do) VALUES (?, ?, ?)',
            [khach.id, -tongDiemDung, 'Quy đổi điểm VIP khi mua hàng']
          );
        }
        const diemThuong = diemThuongTheoTien(tongThanhTien);
        if (diemThuong > 0) {
          await conn.query('UPDATE khachhang SET diem_tich_luy = diem_tich_luy + ?, tong_diem_tich_luy = tong_diem_tich_luy + ? WHERE id = ?', [diemThuong, diemThuong, khach.id]);
          await conn.query(
            'INSERT INTO lichsudiem (ma_khach_hang, so_diem, ly_do) VALUES (?, ?, ?)',
            [khach.id, diemThuong, `Tích điểm khi mua sách (+${diemThuong})`]
          );
        }
        const [updated] = await conn.query('SELECT tong_diem_tich_luy FROM khachhang WHERE id = ?', [khach.id]);
        await conn.query('UPDATE khachhang SET hang_thanh_vien = ? WHERE id = ?', [mapHang(updated[0].tong_diem_tich_luy), khach.id]);
      }
      return r1.insertId;
    });
    return res.status(201).json({ message: 'Lập phiếu bán thành công.', id: result });
  } catch (err) {
    // Chỉ trả message cho lỗi nghiệp vụ và ghi status; log hệ thống (DB) không trả chi tiết.
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
}

// Hủy / thoái phiếu bán: trả bản sao về kho, hoàn điểm đã dùng + thu hồi điểm đã tích, ghi nhật ký
async function huyPhieuBan(req, res) {
  const { id } = req.params;
  const lyDo = req.body.ly_do;
  if (!lyDo || !String(lyDo).trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do hủy phiếu.' });
  }
  try {
    const result = await transaction(async (conn) => {
      const [pbRows] = await conn.query(
        'SELECT pb.*, kh.ho_ten AS ho_ten_khach FROM phieuban pb LEFT JOIN khachhang kh ON kh.id = pb.ma_khach_hang WHERE pb.id = ?',
        [id]
      );
      if (pbRows.length === 0) throw Object.assign(new Error('Không tìm thấy phiếu bán.'), { status: 404 });
      if (String(pbRows[0].trang_thai) === 'da_huy') throw Object.assign(new Error('Phiếu bán này đã bị hủy.'), { status: 400 });
      const [ctsRows] = await conn.query(
        'SELECT ct.id, ct.ma_ban_sao, ct.diem_da_dung, ct.thanh_tien, bs.ma_truyen FROM chitietphieuban ct ' +
        'JOIN bansao bs ON bs.id = ct.ma_ban_sao WHERE ct.ma_phieu_ban = ?',
        [id]
      );
      if (ctsRows.length === 0) throw Object.assign(new Error('Phiếu bán không có chi tiết.'), { status: 404 });

      let diemHoan = 0;
      let diemThuongHoanTac = 0;
      for (const c of ctsRows) {
        diemHoan += Number(c.diem_da_dung || 0);
        diemThuongHoanTac += diemThuongTheoTien(c.thanh_tien);
        await conn.query('UPDATE bansao SET trang_thai = "san_sang" WHERE id = ?', [c.ma_ban_sao]);
        await conn.query('UPDATE truyen SET luot_mua = GREATEST(0, luot_mua - 1) WHERE id = ?', [c.ma_truyen]);
      }
      await conn.query('UPDATE phieuban SET trang_thai = "da_huy" WHERE id = ?', [id]);

      const maKhach = pbRows[0].ma_khach_hang;
      if (maKhach) {
        const [khRows] = await conn.query('SELECT id, diem_tich_luy, tong_diem_tich_luy FROM khachhang WHERE id = ?', [maKhach]);
        if (khRows.length > 0) {
          // Trả lại điểm đã dùng + thu hồi điểm đã tích; hạng xét theo tổng điểm tích lũy
          if (diemHoan > 0) {
            await conn.query('UPDATE khachhang SET diem_tich_luy = diem_tich_luy + ? WHERE id = ?', [diemHoan, maKhach]);
            await conn.query('INSERT INTO lichsudiem (ma_khach_hang, so_diem, ly_do) VALUES (?, ?, ?)', [maKhach, diemHoan, `Hoàn lại điểm đã dùng khi hủy phiếu bán #${id}`]);
          }
          if (diemThuongHoanTac > 0) {
            await conn.query(
              'UPDATE khachhang SET diem_tich_luy = GREATEST(0, diem_tich_luy - ?), tong_diem_tich_luy = GREATEST(0, tong_diem_tich_luy - ?) WHERE id = ?',
              [diemThuongHoanTac, diemThuongHoanTac, maKhach]
            );
            await conn.query('INSERT INTO lichsudiem (ma_khach_hang, so_diem, ly_do) VALUES (?, ?, ?)', [maKhach, -diemThuongHoanTac, `Hoàn tác điểm khi hủy phiếu bán #${id}`]);
          }
          const [kh2] = await conn.query('SELECT tong_diem_tich_luy FROM khachhang WHERE id = ?', [maKhach]);
          await conn.query('UPDATE khachhang SET hang_thanh_vien = ? WHERE id = ?', [mapHang(kh2[0].tong_diem_tich_luy), maKhach]);
        }
      }

      await writeAudit(conn, req, 'huy_phieu_ban', 'phieu_ban', Number(id), String(lyDo).trim());
      await conn.query(
        'INSERT INTO thongbaoadmin (tieu_de, noi_dung, loai, ma_tham_chieu) VALUES (?, ?, "huy_phieu", ?)',
        [`Hủy phiếu bán #${id}`, `Lý do: ${String(lyDo).trim()}. Bản sao trả về kho, điểm đã dùng được hoàn lại và điểm tích lũy được thu hồi.`, id]
      );
      if (maKhach) {
        await notify(conn, maKhach, 'Phiếu bán đã bị hủy', `Phiếu bán #${id} của bạn đã bị quầy hủy bỏ. Mọi điểm liên quan sẽ được hoàn tác.`, 'dat_truoc', id);
      }
      return { so_dau: ctsRows.length, diem_hoan: diemHoan };
    });
    return res.json({ message: 'Đã hủy phiếu bán.', id: Number(id), so_dau: result.so_dau, diem_hoan: result.diem_hoan });
  } catch (err) {
    // Chỉ trả message cho lỗi nghiệp vụ và ghi status; log hệ thống (DB) không trả chi tiết.
    if (err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
}

module.exports = { listPhieuBan, getPhieuBan, createPhieuBan, huyPhieuBan };
