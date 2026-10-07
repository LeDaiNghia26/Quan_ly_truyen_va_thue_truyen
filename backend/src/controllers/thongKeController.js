const { query } = require('../config/db');
const { tienMoiDiem } = require('./cauHinhHelper');

async function thongKe(req, res) {
  const { tu_ngay, den_ngay } = req.query;
  const from = tu_ngay || '1970-01-01';
  const to = den_ngay || '9999-12-31';
  try {
    const [doanhThuThue] = await query(
      'SELECT COUNT(DISTINCT pt.id) AS so_phieu, COALESCE(SUM(ct.don_gia), 0) AS doanh_thu_goc, ' +
      'COALESCE(SUM(pr.phi_phat_sinh), 0) AS phi_phat_sinh ' +
      'FROM phieuthue pt ' +
      'LEFT JOIN chitietphieuthue ct ON ct.ma_phieu_thue = pt.id AND pt.trang_thai != "da_huy" ' +
      'LEFT JOIN phieutra pr ON pr.ma_chi_tiet_phieu_thue = ct.id ' +
      'WHERE pt.ngay_thue BETWEEN ? AND ?',
      [from, to]
    );

    const [doanhThuBan] = await query(
      'SELECT COUNT(DISTINCT pb.id) AS so_phieu, SUM(ctpb.gia_goc) AS doanh_thu_truoc_giam, ' +
      'SUM(ctpb.thanh_tien) AS doanh_thu_sau_giam, ' +
      'SUM(ctpb.so_tien_giam_su_kien) AS giam_su_kien, ' +
      'SUM(ctpb.phan_tram_giam_hang / 100 * ctpb.gia_goc) AS giam_thanh_vien, ' +
      'SUM(ctpb.diem_da_dung * ?) AS giam_diem ' +
      'FROM phieuban pb JOIN chitietphieuban ctpb ON ctpb.ma_phieu_ban = pb.id ' +
      'WHERE pb.ngay_ban BETWEEN ? AND ? AND pb.trang_thai != "da_huy"',
      [tienMoiDiem(), from, to]
    );

    // C11: Tỷ lệ trả đúng hạn = (số lượt trả trong hạn / tổng lượt trả) * 100
    const [traKpi] = await query(
      'SELECT COUNT(*) AS tong, COALESCE(SUM(CASE WHEN DATEDIFF(pr.ngay_tra, ct.ngay_hen_tra) <= 0 THEN 1 ELSE 0 END), 0) AS dung_han ' +
      'FROM phieutra pr JOIN chitietphieuthue ct ON ct.id = pr.ma_chi_tiet_phieu_thue ' +
      'WHERE pr.ngay_tra BETWEEN ? AND ?',
      [from, to]
    );
    const tongTra = Number(traKpi[0].tong) || 0;
    const dungHan = Number(traKpi[0].dung_han) || 0;

    const [chiPhiNhap] = await query(
      'SELECT SUM(tong_tien) AS chi_phi_nhap FROM phieunhapkho WHERE ngay_nhap BETWEEN ? AND ?',
      [from, to]
    );

    const [huHong] = await query(
      'SELECT COUNT(*) AS so_lan, SUM(phi_phat_sinh) AS tong_phi FROM phieutra ' +
      'WHERE tinh_trang_nhan IN ("hu_nhe", "hu_nang_mat") AND ngay_tra BETWEEN ? AND ?',
      [from, to]
    );

    const [baoTri] = await query(
      'SELECT COUNT(*) AS so_lan, SUM(chi_phi) AS tong_chi_phi FROM phieubaotri WHERE ngay BETWEEN ? AND ?',
      [from, to]
    );

    const [topThue] = await query(
      'SELECT t.ten_truyen, COUNT(ct.id) AS so_lan ' +
      'FROM chitietphieuthue ct JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuthue pt ON pt.id = ct.ma_phieu_thue ' +
      'WHERE pt.ngay_thue BETWEEN ? AND ? ' +
      'GROUP BY t.id, t.ten_truyen ORDER BY so_lan DESC LIMIT 10',
      [from, to]
    );

    const [topBan] = await query(
      'SELECT t.ten_truyen, COUNT(ct.id) AS so_lan, SUM(ct.thanh_tien) AS doanh_thu ' +
      'FROM chitietphieuban ct JOIN bansao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN phieuban pb ON pb.id = ct.ma_phieu_ban ' +
      'WHERE pb.ngay_ban BETWEEN ? AND ? ' +
      'GROUP BY t.id, t.ten_truyen ORDER BY so_lan DESC LIMIT 10',
      [from, to]
    );

    return res.json({
      tu_ngay: from,
      den_ngay: to,
      doanh_thu_cho_thue: Number(doanhThuThue[0].doanh_thu_goc) + Number(doanhThuThue[0].phi_phat_sinh) || 0,
      doanh_thu_thue_goc: Number(doanhThuThue[0].doanh_thu_goc) || 0,
      phi_phat_sinh_thue: Number(doanhThuThue[0].phi_phat_sinh) || 0,
      so_phieu_thue: Number(doanhThuThue[0].so_phieu) || 0,
      doanh_thu_ban_truoc_giam: Number(doanhThuBan[0].doanh_thu_truoc_giam) || 0,
      doanh_thu_ban_sau_giam: Number(doanhThuBan[0].doanh_thu_sau_giam) || 0,
      so_phieu_ban: Number(doanhThuBan[0].so_phieu) || 0,
      tong_giam_gia: {
        su_kien: Number(doanhThuBan[0].giam_su_kien) || 0,
        thanh_vien: Number(doanhThuBan[0].giam_thanh_vien) || 0,
        diem_tich_luy: Number(doanhThuBan[0].giam_diem) || 0,
      },
      ty_le_tra_dung_han: tongTra > 0 ? Math.round((dungHan / tongTra) * 1000) / 10 : 0,
      so_lan_tra: tongTra,
      so_lan_tra_dung_han: dungHan,
      chi_phi_nhap_kho: Number(chiPhiNhap[0].chi_phi_nhap) || 0,
      hu_hong_mat_truyen: {
        so_lan: Number(huHong[0].so_lan) || 0,
        tong_phi: Number(huHong[0].tong_phi) || 0,
      },
      bao_tri: {
        so_lan: Number(baoTri[0].so_lan) || 0,
        tong_chi_phi: Number(baoTri[0].tong_chi_phi) || 0,
      },
      truyen_thue_nhieu_nhat: topThue,
      truyen_ban_nhieu_nhat: topBan,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function dashboard(req, res) {
  try {
    const [tqRows] = await query(
      'SELECT ' +
      '(SELECT COUNT(*) FROM Truyen WHERE trang_thai = "hoat_dong") AS dau_truyen, ' +
      '(SELECT COUNT(*) FROM KhachHang) AS khach_hang, ' +
      '(SELECT COALESCE(SUM(ct.thanh_tien),0) FROM ChiTietPhieuBan ct WHERE ct.ma_phieu_ban NOT IN (SELECT id FROM PhieuBan WHERE trang_thai = "da_huy")) AS doanh_thu_ban, ' +
      '(SELECT COALESCE(SUM(ct.don_gia),0) FROM ChiTietPhieuThue ct WHERE ct.ma_phieu_thue NOT IN (SELECT id FROM PhieuThue WHERE trang_thai = "da_huy")) AS doanh_thu_thue_goc, ' +
      '(SELECT COALESCE(SUM(pr.phi_phat_sinh),0) FROM PhieuTra pr) AS phi_phat_sinh, ' +
      '(SELECT COUNT(*) FROM DatTruoc WHERE trang_thai = "cho_nhan") AS don_cho_nhan, ' +
      '(SELECT COUNT(*) FROM BanSao WHERE trang_thai = "dang_cho_thue") AS dang_cho_thue, ' +
      '(SELECT COUNT(*) FROM BanSao WHERE trang_thai = "bao_tri") AS dang_bao_tri'
    );
    const tq = tqRows[0];

    // C11: Tỷ lệ trả đúng hạn toàn hệ thống
    const [traKpi] = await query(
      'SELECT COUNT(*) AS tong, COALESCE(SUM(CASE WHEN DATEDIFF(pr.ngay_tra, ct.ngay_hen_tra) <= 0 THEN 1 ELSE 0 END), 0) AS dung_han ' +
      'FROM PhieuTra pr JOIN ChiTietPhieuThue ct ON ct.id = pr.ma_chi_tiet_phieu_thue'
    );
    const tongTra = Number(traKpi[0].tong) || 0;
    const dungHan = Number(traKpi[0].dung_han) || 0;

    const [lowRows] = await query(
      'SELECT COUNT(*) AS n FROM (' +
      'SELECT t.id FROM Truyen t LEFT JOIN BanSao bs ON bs.ma_truyen = t.id AND bs.trang_thai = "san_sang" ' +
      'WHERE t.trang_thai = "hoat_dong" GROUP BY t.id HAVING COUNT(bs.id) <= 1) x'
    );

    const [ban7] = await query(
      'SELECT DATE_FORMAT(pb.ngay_ban, "%Y-%m-%d") AS d, SUM(ct.thanh_tien) AS t FROM PhieuBan pb ' +
      'JOIN ChiTietPhieuBan ct ON ct.ma_phieu_ban = pb.id ' +
      'WHERE pb.ngay_ban >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE_FORMAT(pb.ngay_ban, "%Y-%m-%d")'
    );
    const [thue7] = await query(
      'SELECT DATE_FORMAT(pt.ngay_thue, "%Y-%m-%d") AS d, SUM(ct.don_gia) AS t FROM PhieuThue pt ' +
      'JOIN ChiTietPhieuThue ct ON ct.ma_phieu_thue = pt.id ' +
      'WHERE pt.ngay_thue >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE_FORMAT(pt.ngay_thue, "%Y-%m-%d")'
    );
    const mapBan7 = {};
    ban7.forEach((r) => { mapBan7[r.d] = Number(r.t); });
    const mapThue7 = {};
    thue7.forEach((r) => { mapThue7[r.d] = Number(r.t); });
    const doanhThu7Ngay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      doanhThu7Ngay.push({ ngay: `${d.getDate()}/${d.getMonth() + 1}`, ban: mapBan7[key] || 0, thue: mapThue7[key] || 0 });
    }

    const [ban12] = await query(
      'SELECT DATE_FORMAT(pb.ngay_ban, "%Y-%m") AS m, SUM(ct.thanh_tien) AS t FROM PhieuBan pb ' +
      'JOIN ChiTietPhieuBan ct ON ct.ma_phieu_ban = pb.id ' +
      'WHERE pb.ngay_ban >= DATE_SUB(DATE_FORMAT(CURDATE(), "%Y-%m-01"), INTERVAL 11 MONTH) ' +
      'GROUP BY DATE_FORMAT(pb.ngay_ban, "%Y-%m")'
    );
    const [thue12] = await query(
      'SELECT DATE_FORMAT(pt.ngay_thue, "%Y-%m") AS m, SUM(ct.don_gia) AS t FROM PhieuThue pt ' +
      'JOIN ChiTietPhieuThue ct ON ct.ma_phieu_thue = pt.id ' +
      'WHERE pt.ngay_thue >= DATE_SUB(DATE_FORMAT(CURDATE(), "%Y-%m-01"), INTERVAL 11 MONTH) ' +
      'GROUP BY DATE_FORMAT(pt.ngay_thue, "%Y-%m")'
    );
    const mapBan12 = {};
    ban12.forEach((r) => { mapBan12[r.m] = Number(r.t); });
    const mapThue12 = {};
    thue12.forEach((r) => { mapThue12[r.m] = Number(r.t); });
    const doanhThu12Thang = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      doanhThu12Thang.push({ thang: `${d.getMonth() + 1}/${d.getFullYear()}`, ban: mapBan12[key] || 0, thue: mapThue12[key] || 0 });
    }

    const [topBan] = await query(
      'SELECT t.ten_truyen, COUNT(ct.id) AS so_lan, SUM(ct.thanh_tien) AS doanh_thu ' +
      'FROM ChiTietPhieuBan ct JOIN BanSao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN Truyen t ON t.id = bs.ma_truyen GROUP BY t.id, t.ten_truyen ORDER BY so_lan DESC LIMIT 5'
    );
    const [topThue] = await query(
      'SELECT t.ten_truyen, COUNT(ct.id) AS so_lan ' +
      'FROM ChiTietPhieuThue ct JOIN BanSao bs ON bs.id = ct.ma_ban_sao ' +
      'JOIN Truyen t ON t.id = bs.ma_truyen GROUP BY t.id, t.ten_truyen ORDER BY so_lan DESC LIMIT 5'
    );

    const [phanBo] = await query(
      'SELECT tl.ten_the_loai AS ten, COUNT(DISTINCT ttl.ma_truyen) AS so_luong FROM TruyenTheLoai ttl ' +
      'JOIN TheLoai tl ON tl.id = ttl.ma_the_loai ' +
      'JOIN Truyen t ON t.id = ttl.ma_truyen AND t.trang_thai = "hoat_dong" ' +
      'GROUP BY tl.id, tl.ten_the_loai ' +
      'ORDER BY so_luong DESC LIMIT 8'
    );

    const [hoatDong] = await query(
      '(SELECT "ban" AS loai, pb.id AS ma, pb.ngay_ban AS thoi_gian, CONCAT("Bán phiếu #", pb.id) AS tieu_de ' +
      'FROM PhieuBan pb ORDER BY pb.ngay_ban DESC LIMIT 5) ' +
      'UNION ALL ' +
      '(SELECT "thue", pt.id, pt.ngay_thue, CONCAT("Thuê phiếu #", pt.id) FROM PhieuThue pt ORDER BY pt.ngay_thue DESC LIMIT 5) ' +
      'UNION ALL ' +
      '(SELECT "tra", pht.id, pht.ngay_tra, CONCAT("Trả sách phiếu #", pht.id) FROM PhieuTra pht ORDER BY pht.ngay_tra DESC LIMIT 5) ' +
      'UNION ALL ' +
      '(SELECT "dat_truoc", dt.id, dt.ngay_dat, CONCAT("Đặt trước #", dt.id) FROM DatTruoc dt ORDER BY dt.ngay_dat DESC LIMIT 5) ' +
      'ORDER BY thoi_gian DESC LIMIT 10'
    );

    return res.json({
      tong_quan: {
        dau_truyen: Number(tq.dau_truyen) || 0,
        khach_hang: Number(tq.khach_hang) || 0,
        doanh_thu_ban: Number(tq.doanh_thu_ban) || 0,
        doanh_thu_thue: (Number(tq.doanh_thu_thue_goc) || 0) + (Number(tq.phi_phat_sinh) || 0),
        doanh_thu_thue_goc: Number(tq.doanh_thu_thue_goc) || 0,
        phi_phat_sinh: Number(tq.phi_phat_sinh) || 0,
        don_cho_nhan: Number(tq.don_cho_nhan) || 0,
        dang_cho_thue: Number(tq.dang_cho_thue) || 0,
        dang_bao_tri: Number(tq.dang_bao_tri) || 0,
        ton_kho_thap: Number(lowRows[0].n) || 0,
        ty_le_tra_dung_han: tongTra > 0 ? Math.round((dungHan / tongTra) * 1000) / 10 : 0,
        so_lan_tra: tongTra,
        so_lan_tra_dung_han: dungHan,
      },
      doanh_thu_7_ngay: doanhThu7Ngay,
      doanh_thu_12_thang: doanhThu12Thang,
      truyen_ban_nhieu_nhat: topBan,
      truyen_thue_nhieu_nhat: topThue,
      phan_bo_the_loai: phanBo,
      hoat_dong_gan_day: hoatDong,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { thongKe, dashboard };
