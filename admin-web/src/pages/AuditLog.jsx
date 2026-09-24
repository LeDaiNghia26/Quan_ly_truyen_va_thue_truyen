import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate } from '../ui';

const LABEL_HANH_DONG = {
  tao_truyen: 'Tạo truyện', sua_truyen: 'Sửa truyện', ngung_truyen: 'Ngừng kinh doanh truyện',
  tao_the_loai: 'Tạo thể loại', sua_the_loai: 'Sửa thể loại', xoa_the_loai: 'Xóa thể loại',
  tao_nhan_vien: 'Tạo nhân viên', sua_nhan_vien: 'Sửa nhân viên', khoa_nhan_vien: 'Khóa nhân viên', mo_khoa_nhan_vien: 'Mở khóa nhân viên',
  reset_mat_khau: 'Đặt lại mật khẩu', khoa_khach_hang: 'Khóa khách hàng', mo_khoa_khach_hang: 'Mở khóa khách hàng',
  tao_su_kien: 'Tạo sự kiện', sua_su_kien: 'Sửa sự kiện', huy_su_kien: 'Hủy sự kiện', ket_thuc_su_kien: 'Kết thúc sự kiện', bat_su_kien: 'Bật sự kiện', tam_dung_su_kien: 'Tạm dừng sự kiện',
  doi_hang_thanh_vien: 'Đổi hạng thành viên', doi_quy_doi_diem: 'Đổi quy đổi điểm',
  tao_bao_tri: 'Tạo phiếu bảo trì', sua_bao_tri: 'Sửa phiếu bảo trì', xoa_bao_tri: 'Xóa phiếu bảo trì', hoan_tat_bao_tri: 'Hoàn tất bảo trì',
  nhap_kho: 'Phiếu nhập kho', sua_ban_sao: 'Sửa bản sao',
  mo_ca: 'Mở ca làm việc', chot_ca: 'Chốt ca làm việc',
  huy_phieu_thue: 'Hủy phiếu thuê', huy_phieu_ban: 'Hủy phiếu bán', huy_dat_truoc: 'Hủy đơn đặt trước', bao_mat: 'Báo mất truyện',
};

export default function AuditLog() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.user?.vai_tro;
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [hanhDong, setHanhDong] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true); setMsg('');
    try {
      const r = await api.get('/audit-log', { params: { q: q || undefined, hanh_dong: hanhDong || undefined, tu_ngay: tuNgay || undefined, den_ngay: denNgay || undefined } });
      setRows(r.data);
    } catch (e) { setMsg(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (role === 'admin') load(); }, []);

  if (role !== 'admin') {
    return <p style={{ padding: 16 }}><b>Bạn không có quyền xem nhật ký hệ thống.</b></p>;
  }

  return (
    <div>
      <div className="toolbar">
        <h3>🧾 Nhật ký hệ thống (Audit Log)</h3>
        <button className="secondary small" onClick={load} disabled={loading}>⟳ Làm mới</button>
      </div>
      {msg && <div className="msg err">{msg}</div>}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.2fr 1fr 1fr auto', alignItems: 'end' }}>
          <div>
            <label>Từ khoá (người thực hiện / lý do / đối tượng)</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="VD: hủy phiếu, Nguyễn..." />
          </div>
          <div>
            <label>Hành động</label>
            <select value={hanhDong} onChange={(e) => setHanhDong(e.target.value)}>
              <option value="">-- Tất cả --</option>
              {Object.keys(LABEL_HANH_DONG).map((k) => <option key={k} value={k}>{LABEL_HANH_DONG[k]}</option>)}
            </select>
          </div>
          <div><label>Từ ngày</label><input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /></div>
          <div><label>Đến ngày</label><input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} /></div>
          <button className="secondary" onClick={load} disabled={loading}>Lọc</button>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>#</th><th>Thời gian</th><th>Người thực hiện</th><th>Vai trò</th><th>Hành động</th><th>Đối tượng</th><th>ID</th><th>Lý do / Chi tiết</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="muted">{a.id}</td>
                <td>{fmtDate(a.ngay_tao)}</td>
                <td><b>{a.nguoi_thuc_hien || '—'}</b></td>
                <td><span className="badge b-gray">{a.vai_tro}</span></td>
                <td>{LABEL_HANH_DONG[a.hanh_dong] || a.hanh_dong}</td>
                <td>{a.doi_tuong || '—'}</td>
                <td>{a.id_doi_tuong ?? '—'}</td>
                <td style={{ maxWidth: 320 }}>{a.ly_do || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="empty">{loading ? 'Đang tải...' : 'Không có bản ghi.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}