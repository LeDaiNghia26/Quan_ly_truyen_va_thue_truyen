const BEAN = {
  trang_thai: {
    hoat_dong: ['Hoạt động', 'b-green'],
    khoa: ['Đã khóa', 'b-red'],
    ngung_hoat_dong: ['Ngừng hoạt động', 'b-gray'],
    ngung_kinh_doanh: ['Ngừng kinh doanh', 'b-gray'],
    ngung_hop_tac: ['Ngừng hợp tác', 'b-gray'],
    ket_thuc: ['Đã kết thúc', 'b-gray'],
    huy: ['Đã hủy', 'b-red'],
  },
  trang_thai_bs: {
    san_sang: ['Sẵn sàng', 'b-green'],
    dang_giu: ['Đang giữ', 'b-blue'],
    dang_cho_thue: ['Đang cho thuê', 'b-purple'],
    da_ban: ['Đã bán', 'b-gray'],
    ngung_luu_hanh: ['Ngừng lưu hành', 'b-red'],
    bao_tri: ['Bảo trì / Sửa chữa', 'b-orange'],
  },
  trang_thai_dt: {
    cho_nhan: ['Chờ nhận', 'b-yellow'],
    da_xac_nhan: ['Đã xác nhận', 'b-green'],
    da_huy: ['Đã hủy', 'b-red'],
    qua_han: ['Quá hạn', 'b-gray'],
  },
  trang_thai_ct: {
    dang_thue: ['Đang thuê', 'b-blue'],
    da_tra: ['Đã trả', 'b-green'],
    mat: ['Mất', 'b-red'],
  },
  trang_thai_pb: {
    hoat_dong: ['Hoạt động', 'b-green'],
    da_huy: ['Đã hủy', 'b-red'],
  },
  trang_thai_nhan: {
    tot: ['Tốt', 'b-green'],
    tre_han: ['Trễ hạn', 'b-yellow'],
    hu_nhe: ['Hư nhẹ', 'b-orange'],
    hu_nang_mat: ['Hư nặng / Mất', 'b-red'],
  },
  tinh_trang_vat_ly: {
    moi: ['Mới', 'b-blue'],
    tot: ['Tốt', 'b-green'],
    cu: ['Cũ', 'b-yellow'],
    hu_hong: ['Hư hỏng', 'b-red'],
  },
  hang: {
    thuong: ['Thường', 'b-gray'],
    than_thiet: ['Thân thiết', 'b-blue'],
    vip: ['VIP', 'b-orange'],
  },
  loai: {
    thue: ['Thuê', 'b-blue'],
    mua: ['Mua', 'b-purple'],
  },
  loai_san_pham: {
    TRUYEN_TRANH: ['Truyện tranh', 'b-blue'],
    TIEU_THUYET: ['Tiểu thuyết', 'b-purple'],
    TRUYEN_NGAN: ['Truyện ngắn', 'b-green'],
    LIGHT_NOVEL: ['Light Novel', 'b-orange'],
  },
  thong_bao_admin: {
    het_hang: ['Hết hàng', 'b-red'],
    hong_mat: ['Hỏng / mất', 'b-orange'],
    doanh_thu: ['Doanh thu', 'b-green'],
    he_thong: ['Hệ thống', 'b-gray'],
  },
};

export function Badge({ type, value }) {
  const [label, cls] = BEAN[type]?.[value] || [value, 'b-gray'];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function fmt(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('vi-VN');
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN') + ' ' + dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}