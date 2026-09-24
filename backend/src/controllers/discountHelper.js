const { query } = require('../config/db');
const { phanTramHang, mapHang } = require('./cauHinhHelper');

// Tính giá sau giảm cho một đầu truyện với khách hàng (maKhachHang có thể null)
async function tinhGiaSauGiam(truyen, khach) {
  const giaGoc = Number(truyen.gia_ban);
  let giamHang = 0;
  let soTienGiamSuKien = 0;

  // Giảm theo hạng thành viên (đọc từ cấu hình HangThanhVien)
  if (khach) {
    giamHang = phanTramHang(khach.hang_thanh_vien);
  }

  // Giảm theo sự kiện đang hiệu lực
  const [suKiens] = await query(
    'SELECT * FROM sukiengiamgia WHERE trang_thai = "hoat_dong" ' +
    'AND ngay_bat_dau <= NOW() AND ngay_ket_thuc >= NOW() ' +
    'AND (pham_vi = "toan_bo" OR (pham_vi = "the_loai" AND EXISTS (SELECT 1 FROM TruyenTheLoai ttl WHERE ttl.ma_truyen = ? AND ttl.ma_the_loai = sukiengiamgia.ma_the_loai)) OR (pham_vi = "truyen" AND ma_truyen = ?))',
    [truyen.id, truyen.id]
  );

  for (const sk of suKiens) {
    if (sk.kieu_giam === 'phan_tram') {
      soTienGiamSuKien += (giaGoc * Number(sk.gia_tri)) / 100;
    } else {
      soTienGiamSuKien += Number(sk.gia_tri);
    }
  }

  let thanhTien = giaGoc * (1 - giamHang / 100) - soTienGiamSuKien;
  if (thanhTien < 0) thanhTien = 0;

  return {
    gia_goc: giaGoc,
    phan_tram_giam_hang: giamHang,
    so_tien_giam_su_kien: Math.round(soTienGiamSuKien * 100) / 100,
    thanh_tien: Math.round(thanhTien * 100) / 100,
  };
}

async function getKhachById(id) {
  if (!id) return null;
  const [rows] = await query('SELECT id, hang_thanh_vien, diem_tich_luy, tong_diem_tich_luy FROM khachhang WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = { tinhGiaSauGiam, getKhachById, mapHang };