import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge, fmt, fmtDate } from '../ui';
import { useFetch, SearchBar } from '../hooks';

export default function KhachHang() {
  const { data, reload } = useFetch((p) => api.get('/khach-hang', { params: p }));
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { reload(); }, []);

  async function toggle(kh) {
    try { await api.patch(`/khach-hang/${kh.id}/toggle-khoa`); reload(); }
    catch (e) { alert(getErrorMessage(e)); }
  }

  async function resetPw(kh) {
    if (!confirm(`Đặt lại mật khẩu của "${kh.ho_ten}" về 123456?`)) return;
    try { const r = await api.patch(`/khach-hang/${kh.id}/reset-mat-khau`); alert(r.data.message); }
    catch (e) { alert(getErrorMessage(e)); }
  }

  async function openDetail(kh) {
    setLoading(true);
    try { const r = await api.get(`/khach-hang/${kh.id}`); setDetail(r.data); }
    catch (e) { alert(getErrorMessage(e)); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Quản lý khách hàng</h3>
        <SearchBar placeholder="Tìm theo tên / số điện thoại..." onSearch={(kw) => reload({ tu_khoa: kw })} />
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Điểm hiện tại</th><th>Tổng tích lũy</th><th>Hạng</th><th>Vi phạm</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((kh) => (
              <tr key={kh.id}>
                <td>{kh.id}</td>
                <td>{kh.ho_ten}</td>
                <td>{kh.email}</td>
                <td>{kh.so_dien_thoai}</td>
                <td>{fmt(kh.diem_tich_luy)}</td>
                <td>{fmt(kh.tong_diem_tich_luy)}</td>
                <td><Badge type="hang" value={kh.hang_thanh_vien} /></td>
                <td>{Number(kh.so_lan_vi_pham) > 0 ? <span className="badge b-red">{kh.so_lan_vi_pham}</span> : <span className="muted">0</span>}</td>
                <td><Badge type="trang_thai" value={kh.trang_thai_tk} /></td>
                <td>
                  <button className="small secondary" onClick={() => openDetail(kh)}>Chi tiết</button>{' '}
                  <button className="small secondary" onClick={() => resetPw(kh)}>Reset MK</button>{' '}
                  <button className="small secondary" onClick={() => toggle(kh)}>{kh.trang_thai_tk === 'khoa' ? 'Mở khóa' : 'Khóa'}</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={10} className="empty">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="card">
          <div className="toolbar">
            <h3>Khách hàng #{detail.id} · {detail.ho_ten}</h3>
            <button className="secondary" onClick={() => setDetail(null)}>Đóng</button>
          </div>
          <p>
            <Badge type="hang" value={detail.hang_thanh_vien} /> · Điểm: {fmt(detail.diem_tich_luy)} · {detail.email} · {detail.so_dien_thoai} ·{' '}
            <Badge type="trang_thai" value={detail.trang_thai_tk} />
          </p>

          <h4>Lịch sử đặt trước ({detail.lich_su_dat_truoc.length})</h4>
          <table>
            <thead><tr><th>ID</th><th>Loại</th><th>Ngày đặt</th><th>Hạn nhận</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {detail.lich_su_dat_truoc.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td><td>{d.loai === 'thue' ? 'Thuê' : 'Mua'}</td>
                  <td>{fmtDate(d.ngay_dat)}</td><td>{fmtDate(d.han_nhan)}</td>
                  <td><Badge type="trang_thai" value={d.trang_thai} /></td>
                </tr>
              ))}
              {detail.lich_su_dat_truoc.length === 0 && <tr><td colSpan={5} className="empty">Chưa có</td></tr>}
            </tbody>
          </table>

          <h4>Lịch sử thuê ({detail.lich_su_thue.length})</h4>
          <table>
            <thead><tr><th>Phiếu</th><th>Truyện</th><th>Bản sao</th><th>Hạn trả</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {detail.lich_su_thue.map((t) => (
                <tr key={`${t.ma_phieu}-${t.ma_ban_sao_str}`}>
                  <td>{t.ma_phieu}</td><td>{t.ten_truyen}</td><td>{t.ma_ban_sao_str}</td>
                  <td>{fmtDate(t.ngay_hen_tra)}</td>
                  <td><Badge type="trang_thai" value={t.trang_thai} /></td>
                </tr>
              ))}
              {detail.lich_su_thue.length === 0 && <tr><td colSpan={5} className="empty">Chưa có</td></tr>}
            </tbody>
          </table>

          <h4>Lịch sử mua ({detail.lich_su_mua.length})</h4>
          <table>
            <thead><tr><th>Phiếu</th><th>Truyện</th><th>Bản sao</th><th>Thành tiền</th></tr></thead>
            <tbody>
              {detail.lich_su_mua.map((m) => (
                <tr key={`${m.ma_phieu}-${m.ma_ban_sao_str}`}>
                  <td>{m.ma_phieu}</td><td>{m.ten_truyen}</td><td>{m.ma_ban_sao_str}</td><td>{fmt(m.thanh_tien)}₫</td>
                </tr>
              ))}
              {detail.lich_su_mua.length === 0 && <tr><td colSpan={4} className="empty">Chưa có</td></tr>}
            </tbody>
          </table>
          {loading && <p>Đang tải...</p>}
          <div className="toolbar">
            <button className="secondary" onClick={() => setDetail(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}