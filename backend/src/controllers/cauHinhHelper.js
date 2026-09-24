const { query } = require('../config/db');

// Cache cấu hình hạng thành viên + quy đổi điểm (nạp 1 lần, refresh khi admin sửa)
let cache = { tiers: [], quyDoi: {}, loadedAt: 0 };

async function loadCauHinh(force) {
  if (!force && cache.loadedAt) return cache;
  try {
    const [tiers] = await query('SELECT * FROM HangThanhVien ORDER BY nguong_diem ASC');
    const [qd] = await query('SELECT * FROM QuyDoiDiem');
    const quyDoi = {};
    for (const r of qd) quyDoi[r.ten_quy_tac] = Number(r.gia_tri);
    cache = { tiers, quyDoi, loadedAt: Date.now() };
  } catch (e) {
    // Bảng cấu hình chưa tồn tại -> giữ mặc định
  }
  return cache;
}

function mapHang(diem) {
  let hang = 'thuong';
  for (const t of cache.tiers) {
    if (Number(diem) >= Number(t.nguong_diem)) hang = t.ma_hang;
  }
  return hang;
}

function phanTramHang(maHang) {
  const t = cache.tiers.find((x) => x.ma_hang === maHang);
  return t ? Number(t.phan_tram_giam) : 0;
}

function tienMoiDiem() {
  return Number(cache.quyDoi.tien_moi_diem) || 200;
}

// Tích điểm theo tổng tiền dịch vụ thực thanh toán: 1.000đ = 1 điểm
const NGUONG_TIEN_MOI_DIEM = 1000;
function diemThuongTheoTien(tongTien) {
  return Math.max(0, Math.floor(Number(tongTien || 0) / NGUONG_TIEN_MOI_DIEM));
}

function nguongHang() {
  return cache.tiers;
}

module.exports = { loadCauHinh, mapHang, phanTramHang, tienMoiDiem, diemThuongTheoTien, nguongHang };
