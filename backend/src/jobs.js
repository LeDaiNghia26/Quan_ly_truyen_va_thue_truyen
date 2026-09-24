const { query } = require('./config/db');
const { loadCauHinh } = require('./controllers/cauHinhHelper');
const { autoExpireDatTruocAll } = require('./controllers/datTruocController');

// Tự kết thúc chương trình giảm giá đã hết hạn
async function autoExpireSuKien() {
  try {
    await query(
      'UPDATE SuKienGiamGia SET trang_thai = "ket_thuc" WHERE trang_thai = "hoat_dong" AND ngay_ket_thuc < NOW()'
    );
  } catch (e) { /* bỏ qua */ }
}

// Quét và sinh thông báo quản trị (hết hàng, hỏng/mất, doanh thu đột biến)
async function quetThongBaoAdmin() {
  try {
    const [low] = await query(
      'SELECT t.id, t.ten_truyen, COUNT(bs.id) AS so_san_sang FROM truyen t ' +
      'LEFT JOIN bansao bs ON bs.ma_truyen = t.id AND bs.trang_thai = "san_sang" ' +
      'WHERE t.trang_thai = "hoat_dong" GROUP BY t.id HAVING so_san_sang <= 1'
    );
    for (const t of low) {
      const [ex] = await query(
        'SELECT id FROM ThongBaoAdmin WHERE loai = "het_hang" AND ma_tham_chieu = ? AND da_doc = 0', [t.id]
      );
      if (ex.length === 0) {
        await query(
          'INSERT INTO ThongBaoAdmin (tieu_de, noi_dung, loai, ma_tham_chieu) VALUES (?, ?, ?, ?)',
          ['Tồn kho thấp', `Đầu truyện "${t.ten_truyen}" chỉ còn ${t.so_san_sang} bản sẵn sàng.`, 'het_hang', t.id]
        );
      }
    }

    const [hu] = await query(
      'SELECT COUNT(*) AS n FROM phieutra WHERE tinh_trang_nhan = "hu_nang_mat" AND ngay_tra >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
    );
    if (hu[0].n > 0) {
      const [ex2] = await query(
        'SELECT id FROM ThongBaoAdmin WHERE loai = "hong_mat" AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
      );
      if (ex2.length === 0) {
        await query(
          'INSERT INTO ThongBaoAdmin (tieu_de, noi_dung, loai) VALUES (?, ?, ?)',
          ['Có sách hỏng/mất mới', `Ghi nhận ${hu[0].n} trường hợp hỏng/mất trong 24 giờ qua.`, 'hong_mat']
        );
      }
    }

    const [today] = await query(
      'SELECT COALESCE(SUM(ctpb.thanh_tien), 0) AS t FROM chitietphieuban ctpb ' +
      'JOIN phieuban pb ON pb.id = ctpb.ma_phieu_ban WHERE DATE(pb.ngay_ban) = CURDATE()'
    );
    const [avg] = await query(
      'SELECT COALESCE(AVG(s), 0) AS a FROM (' +
      'SELECT DATE(pb.ngay_ban) d, SUM(ctpb.thanh_tien) s FROM phieuban pb ' +
      'JOIN chitietphieuban ctpb ON ctpb.ma_phieu_ban = pb.id ' +
      'WHERE pb.ngay_ban >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND DATE(pb.ngay_ban) < CURDATE() ' +
      'GROUP BY DATE(pb.ngay_ban)) x'
    );
    const t = Number(today[0].t);
    const a = Number(avg[0].a);
    if (a > 0 && t > a * 2) {
      const [ex3] = await query('SELECT id FROM ThongBaoAdmin WHERE loai = "doanh_thu" AND DATE(ngay_tao) = CURDATE()');
      if (ex3.length === 0) {
        await query(
          'INSERT INTO ThongBaoAdmin (tieu_de, noi_dung, loai) VALUES (?, ?, ?)',
          ['Doanh thu đột biến', `Doanh thu hôm nay ${Math.round(t).toLocaleString('vi-VN')}đ, cao hơn 2 lần trung bình 7 ngày.`, 'doanh_thu']
        );
      }
    }
  } catch (e) { /* bỏ qua */ }
}

function startJobs() {
  loadCauHinh(true).then(() => console.log('Đã nạp cấu hình hệ thống')).catch(() => {});
  autoExpireSuKien();
  quetThongBaoAdmin();
  autoExpireDatTruocAll();
  setInterval(() => {
    autoExpireSuKien();
    quetThongBaoAdmin();
    autoExpireDatTruocAll();
  }, 15 * 60 * 1000);
}

module.exports = { autoExpireSuKien, quetThongBaoAdmin, startJobs };
