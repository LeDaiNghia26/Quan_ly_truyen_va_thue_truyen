import React, { useEffect, useState } from 'react';
import api from '../api';
import { fmt } from '../ui';
import { exportExcel, exportPdf } from '../exportUtils';

export default function ThongKe() {
  const [data, setData] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function load() {
    api.get('/thong-ke', { params: { tu_ngay: from || undefined, den_ngay: to || undefined } })
      .then((r) => { setData(r.data); setFrom(r.data.tu_ngay === '1970-01-01' ? '' : r.data.tu_ngay); setTo(r.data.den_ngay === '9999-12-31' ? '' : r.data.den_ngay); })
      .catch(() => setData(null));
  }
  useEffect(() => { load(); }, []);

  function doExportExcel() {
    if (!data) return;
    exportExcel([
      {
        name: 'TongQuan',
        rows: [
          { 'Chỉ tiêu': 'Doanh thu cho thuê', 'Giá trị': data.doanh_thu_cho_thue },
          { 'Chỉ tiêu': 'Số phiếu thuê', 'Giá trị': data.so_phieu_thue },
          { 'Chỉ tiêu': 'Doanh thu bán (sau giảm)', 'Giá trị': data.doanh_thu_ban_sau_giam },
          { 'Chỉ tiêu': 'Doanh thu bán (trước giảm)', 'Giá trị': data.doanh_thu_ban_truoc_giam },
          { 'Chỉ tiêu': 'Số phiếu bán', 'Giá trị': data.so_phieu_ban },
          { 'Chỉ tiêu': 'Chi phí nhập kho', 'Giá trị': data.chi_phi_nhap_kho },
          { 'Chỉ tiêu': 'Giảm theo hạng thành viên', 'Giá trị': data.tong_giam_gia.thanh_vien },
          { 'Chỉ tiêu': 'Giảm theo sự kiện', 'Giá trị': data.tong_giam_gia.su_kien },
          { 'Chỉ tiêu': 'Giảm bằng điểm tích lũy', 'Giá trị': data.tong_giam_gia.diem_tich_luy },
          { 'Chỉ tiêu': 'Hư hỏng / thất lạc (lượt)', 'Giá trị': data.hu_hong_mat_truyen.so_lan },
          { 'Chỉ tiêu': 'Phí hư hỏng / thất lạc', 'Giá trị': data.hu_hong_mat_truyen.tong_phi },
          { 'Chỉ tiêu': 'Lượt bảo trì', 'Giá trị': data.bao_tri.so_lan },
          { 'Chỉ tiêu': 'Chi phí bảo trì', 'Giá trị': data.bao_tri.tong_chi_phi },
        ],
      },
      { name: 'ThueNhieu', rows: data.truyen_thue_nhieu_nhat.map((t) => ({ 'Truyện': t.ten_truyen, 'Lượt thuê': t.so_lan })) },
      { name: 'BanNhieu', rows: data.truyen_ban_nhieu_nhat.map((t) => ({ 'Truyện': t.ten_truyen, 'Lượt bán': t.so_lan, 'Doanh thu': t.doanh_thu })) },
    ], 'thong-ke.xlsx');
  }
  function doExportPdf() {
    if (!data) return;
    exportPdf({
      title: `Báo cáo thống kê ${from || '...'} → ${to || '...'}`,
      sections: [
        {
          name: 'Tổng quan',
          head: ['Chỉ tiêu', 'Giá trị'],
          body: [
            ['Doanh thu cho thuê', fmt(data.doanh_thu_cho_thue) + '₫'],
            ['Doanh thu bán (sau giảm)', fmt(data.doanh_thu_ban_sau_giam) + '₫'],
            ['Chi phí nhập kho', fmt(data.chi_phi_nhap_kho) + '₫'],
            ['Phí hư hỏng / thất lạc', fmt(data.hu_hong_mat_truyen.tong_phi) + '₫'],
            ['Chi phí bảo trì', fmt(data.bao_tri.tong_chi_phi) + '₫'],
          ],
        },
        { name: 'Truyện thuê nhiều nhất', head: ['Truyện', 'Lượt'], body: data.truyen_thue_nhieu_nhat.map((t) => [t.ten_truyen, t.so_lan]) },
        { name: 'Truyện bán nhiều nhất', head: ['Truyện', 'Lượt', 'Doanh thu'], body: data.truyen_ban_nhieu_nhat.map((t) => [t.ten_truyen, t.so_lan, fmt(t.doanh_thu) + '₫']) },
      ],
    }, 'thong-ke.pdf');
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Thống kê hoạt động</h3>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span>→</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={load}>Xem</button>
        <button className="secondary" onClick={doExportExcel} disabled={!data}>Excel</button>
        <button className="secondary" onClick={doExportPdf} disabled={!data}>PDF</button>
      </div>
      {data && (
        <>
          <div className="stat-grid">
            <div className="stat"><div className="lbl">Doanh thu cho thuê</div><div className="num">{fmt(data.doanh_thu_cho_thue)}₫</div><div className="info">{data.so_phieu_thue} phiếu</div></div>
            <div className="stat"><div className="lbl">Doanh thu bán (sau giảm)</div><div className="num">{fmt(data.doanh_thu_ban_sau_giam)}₫</div><div className="info">{data.so_phieu_ban} phiếu · trước giảm {fmt(data.doanh_thu_ban_truoc_giam)}₫</div></div>
            <div className="stat"><div className="lbl">Chi phí nhập kho</div><div className="num">{fmt(data.chi_phi_nhap_kho)}₫</div><div className="info">giá vốn</div></div>
            <div className="stat"><div className="lbl">Hư hỏng / thất lạc</div><div className="num">{data.hu_hong_mat_truyen.so_lan}</div><div className="info">phí: {fmt(data.hu_hong_mat_truyen.tong_phi)}₫</div></div>
            <div className="stat"><div className="lbl">Bảo trì</div><div className="num">{data.bao_tri.so_lan}</div><div className="info">chi phí: {fmt(data.bao_tri.tong_chi_phi)}₫</div></div>
          </div>
          <div className="card">
            <h3>Tổng giảm giá đã áp dụng</h3>
            <table>
              <tbody>
                <tr><td>Giảm theo hạng thành viên</td><td>{fmt(data.tong_giam_gia.thanh_vien)}₫</td></tr>
                <tr><td>Giảm theo sự kiện</td><td>{fmt(data.tong_giam_gia.su_kien)}₫</td></tr>
                <tr><td>Giảm bằng điểm tích lũy</td><td>{fmt(data.tong_giam_gia.diem_tich_luy)}₫</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Truyện được thuê nhiều nhất</h3>
            <table>
              <thead><tr><th>#</th><th>Truyện</th><th>Lượt</th></tr></thead>
              <tbody>
                {data.truyen_thue_nhieu_nhat.map((t, i) => <tr key={i}><td>{i + 1}</td><td>{t.ten_truyen}</td><td>{t.so_lan}</td></tr>)}
                {data.truyen_thue_nhieu_nhat.length === 0 && <tr><td colSpan={3} className="empty">Chưa có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Truyện được mua nhiều nhất</h3>
            <table>
              <thead><tr><th>#</th><th>Truyện</th><th>Lượt</th><th>Doanh thu</th></tr></thead>
              <tbody>
                {data.truyen_ban_nhieu_nhat.map((t, i) => <tr key={i}><td>{i + 1}</td><td>{t.ten_truyen}</td><td>{t.so_lan}</td><td>{fmt(t.doanh_thu)}₫</td></tr>)}
                {data.truyen_ban_nhieu_nhat.length === 0 && <tr><td colSpan={4} className="empty">Chưa có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!data && <div className="card empty">Không tải được dữ liệu thống kê.</div>}
    </div>
  );
}