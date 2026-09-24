const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const { getKhachByAccountId } = require('./authController');
const { notify } = require('./thongBaoHelper');

const TIEN_COC_RESET = 2000;

async function myKhach(req) {
  const maKhach = await getKhachByAccountId(req.user.id);
  if (!maKhach) throw Object.assign(new Error('Không tìm thấy hồ sơ khách hàng.'), { status: 403 });
  return maKhach;
}

async function getMe(req, res) {
  try {
    const maKhach = await myKhach(req);
    const [rows] = await query(
      'SELECT kh.id AS ma_khach_hang, kh.ho_ten, kh.dia_chi, kh.ngay_sinh, kh.anh_dai_dien, kh.diem_tich_luy, kh.tong_diem_tich_luy, kh.hang_thanh_vien, ' +
      'tk.email, tk.so_dien_thoai, tk.mat_khau ' +
      'FROM khachhang kh JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan WHERE kh.id = ?',
      [maKhach]
    );
    const [soThich] = await query(
      'SELECT khst.ma_the_loai, tl.ten_the_loai FROM khachhangsothich khst ' +
      'JOIN theloai tl ON tl.id = khst.ma_the_loai WHERE khst.ma_khach_hang = ?',
      [maKhach]
    );
    const [lichSuDiem] = await query(
      'SELECT id, so_diem, ly_do, ngay_tao FROM lichsudiem WHERE ma_khach_hang = ? ORDER BY ngay_tao DESC, id DESC LIMIT 50',
      [maKhach]
    );
    const [choDongBong] = await query('SELECT id, han_nhan, loai FROM dattruoc WHERE ma_khach_hang = ? AND trang_thai = "cho_nhan" ORDER BY id', [maKhach]);
    const { mat_khau, ...info } = rows[0];
    const matKhauMacDinh = await bcrypt.compare('123456', mat_khau).catch(() => false);
    return res.json({ ...info, mat_khau_mac_dinh: matKhauMacDinh, so_thich: soThich, lich_su_diem: lichSuDiem, don_dang_cho: choDongBong });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function myDatTruoc(req, res) {
  try {
    const maKhach = await myKhach(req);
    const [rows] = await query(
      'SELECT dt.id, dt.loai, dt.ngay_dat, dt.han_nhan, dt.khung_gio, dt.ma_su_kien, dt.diem_su_dung, dt.trang_thai, ' +
      'sk.ten_su_kien, GROUP_CONCAT(t.ten_truyen SEPARATOR ", ") AS danh_sach_truyen ' +
      'FROM dattruoc dt ' +
      'LEFT JOIN sukiengiamgia sk ON sk.id = dt.ma_su_kien ' +
      'LEFT JOIN chitietdattruoc cdt ON cdt.ma_dat_truoc = dt.id ' +
      'LEFT JOIN bansao bs ON bs.id = cdt.ma_ban_sao ' +
      'LEFT JOIN truyen t ON t.id = bs.ma_truyen ' +
      'WHERE dt.ma_khach_hang = ? GROUP BY dt.id, sk.ten_su_kien ORDER BY dt.id DESC',
      [maKhach]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Tính phí phạt trễ hạn ước tính (giống backend quầy: 2000đ/ngày)
function soNgayTre(ngayHen) {
  const hen = new Date(ngayHen + 'T23:59:59');
  const now = new Date();
  const diff = Math.floor((now - hen) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

async function myRentals(req, res) {
  try {
    const maKhach = await myKhach(req);
    // Đang thuê: các dòng chưa trả
    const [dangThue] = await query(
      'SELECT ct.id, ct.ngay_hen_tra, ct.don_gia, ct.tien_coc, ct.tinh_trang_giao, ct.trang_thai, ' +
      'bs.ma_ban_sao AS ma_ban_sao_str, t.id AS ma_truyen, t.ten_truyen, t.anh_bia, pht.ngay_thue ' +
      'FROM chitietphieuthue ct ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pht ON pht.id = ct.ma_phieu_thue ' +
      'WHERE pht.ma_khach_hang = ? AND ct.trang_thai = "dang_thue" ORDER BY ct.ngay_hen_tra',
      [maKhach]
    );
    // Tổng cọc đang giữ & số ngày trễ
    let tongCoc = 0;
    const dangThueView = dangThue.map((r) => {
      tongCoc += Number(r.tien_coc || 0);
      const tre = soNgayTre(String(r.ngay_hen_tra).slice(0, 10));
      return { ...r, so_ngay_tre: tre, phi_tre_uoc_tinh: tre * TIEN_COC_RESET };
    });

    // Lịch sử: các lần trả
    const [lichSuTra] = await query(
      'SELECT pr.id, pr.ngay_tra, pr.tinh_trang_nhan, pr.phi_phat_sinh, pr.ghi_chu, ' +
      'bs.ma_ban_sao AS ma_ban_sao_str, t.id AS ma_truyen, t.ten_truyen, ct.ngay_hen_tra, ct.tien_coc, pht.ngay_thue ' +
      'FROM phieutra pr ' +
      'JOIN chitietphieuthue ct ON ct.id = pr.ma_chi_tiet_phieu_thue ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pht ON pht.id = ct.ma_phieu_thue ' +
      'WHERE pht.ma_khach_hang = ? ORDER BY pr.ngay_tra DESC LIMIT 100',
      [maKhach]
    );
    // Lịch sử: phiếu bán
    const [lichSuMua] = await query(
      'SELECT pb.id, pb.ngay_ban, t.id AS ma_truyen, t.ten_truyen, bs.ma_ban_sao AS ma_ban_sao_str, ct.gia_goc, ct.diem_da_dung, ct.thanh_tien, sk.ten_su_kien ' +
      'FROM phieuban pb ' +
      'JOIN chitietphieuban ct ON ct.ma_phieu_ban = pb.id ' +
      'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'LEFT JOIN sukiengiamgia sk ON sk.id = ct.ma_su_kien ' +
      'WHERE pb.ma_khach_hang = ? ORDER BY pb.ngay_ban DESC LIMIT 100',
      [maKhach]
    );
    return res.json({ dang_thue: dangThueView, tong_coc_dang_giu: tongCoc, lich_su_tra: lichSuTra, lich_su_mua: lichSuMua });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Tự sinh thông báo quá hạn/sắp đến hạn trả khi khách mở trung tâm thông báo
async function sinhThongBaoTreHan(conn, maKhach) {
  const [rows] = await query(
    'SELECT ct.id, t.ten_truyen, ct.ngay_hen_tra FROM chitietphieuthue ct ' +
    'JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
    'JOIN truyen t ON t.id = bs.ma_truyen ' +
    'JOIN phieuthue pht ON pht.id = ct.ma_phieu_thue ' +
    'WHERE pht.ma_khach_hang = ? AND ct.trang_thai = "dang_thue"',
    [maKhach]
  );
  for (const r of rows) {
    const hen = new Date(String(r.ngay_hen_tra).slice(0, 10) + 'T23:59:59');
    const diff = Math.floor((Date.now() - hen) / (1000 * 60 * 60 * 24));
    if (diff > 0) {
      await notify(conn, maKhach, 'Trả sách quá hạn', `Truyện "${r.ten_truyen}" đã quá hạn ${diff} ngày. Vui lòng mang trả để tránh phát sinh thêm phí phạt!`, 'tra_sach', r.id);
    }
  }
}

async function myNotifications(req, res) {
  try {
    const maKhach = await myKhach(req);
    await sinhThongBaoTreHan(null, maKhach);
    const [rows] = await query(
      'SELECT id, tieu_de, noi_dung, loai, da_doc, ngay_tao FROM thongbao WHERE ma_khach_hang = ? ORDER BY ngay_tao DESC, id DESC LIMIT 50',
      [maKhach]
    );
    const [chuaDoc] = await query('SELECT COUNT(*) AS n FROM thongbao WHERE ma_khach_hang = ? AND da_doc = 0', [maKhach]);
    return res.json({ thong_bao: rows, so_chua_doc: chuaDoc[0].n });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Đánh giá của chính tài khoản (để app điền sẵn khi mở màn đánh giá)
async function myDanhGia(req, res) {
  try {
    const maKhach = await myKhach(req);
    const [rows] = await query(
      'SELECT dg.ma_truyen, t.ten_truyen, dg.so_sao, dg.noi_dung, dg.ngay_danh_gia FROM danhgia dg ' +
      'JOIN truyen t ON t.id = dg.ma_truyen WHERE dg.ma_khach_hang = ? ORDER BY dg.ngay_danh_gia DESC',
      [maKhach]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function markRead(req, res) {
  const { id } = req.params;
  try {
    const maKhach = await myKhach(req);
    await query('UPDATE thongbao SET da_doc = 1 WHERE id = ? AND ma_khach_hang = ?', [id, maKhach]);
    return res.json({ message: 'Đã đánh dấu đã đọc.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { getMe, myDatTruoc, myRentals, myNotifications, myDanhGia, markRead, myKhach };