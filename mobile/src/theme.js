export const C = {
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  accent: '#f59e0b',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#0f172a',
  sub: '#64748b',
  muted: '#94a3b8',
  line: '#e2e8f0',
  danger: '#dc2626',
  success: '#16a34a',
  vip: '#7c3aed',
};

export function fmtVND(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('vi-VN') + 'đ';
}

export function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function trangThaiDon(tt) {
  const map = {
    cho_nhan: 'Chờ nhận sách',
    da_xac_nhan: 'Đã xác nhận',
    da_huy: 'Đã hủy',
    qua_han: 'Quá hạn',
  };
  return map[tt] || tt;
}

export const HANG_MAP = {
  thuong: 'Thành viên thường',
  than_thiet: 'Thân thiết',
  vip: 'VIP',
};