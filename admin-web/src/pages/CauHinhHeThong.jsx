import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';

export default function CauHinhHeThong() {
  const [hang, setHang] = useState([]);
  const [quyDoi, setQuyDoi] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function load() {
    try {
      const r = await api.get('/cau-hinh');
      setHang(r.data.hang_thanh_vien);
      setQuyDoi(r.data.quy_doi);
    } catch (e) { setMsg({ type: 'err', text: getErrorMessage(e) }); }
  }
  useEffect(() => { load(); }, []);

  function setHangRow(i, field, v) {
    setHang(hang.map((h, idx) => (idx === i ? { ...h, [field]: v } : h)));
  }
  function setQuyDoiRow(i, v) {
    setQuyDoi(quyDoi.map((q, idx) => (idx === i ? { ...q, gia_tri: v } : q)));
  }

  async function saveHang(h) {
    try {
      await api.put(`/cau-hinh/hang-thanh-vien/${h.id}`, {
        ten_hang: h.ten_hang, nguong_diem: h.nguong_diem, phan_tram_giam: h.phan_tram_giam,
      });
      setMsg({ type: 'ok', text: `Đã lưu hạng "${h.ten_hang}". Hạng khách hàng đã được cập nhật lại.` });
      load();
    } catch (e) { setMsg({ type: 'err', text: getErrorMessage(e) }); }
  }
  async function saveQuyDoi(q) {
    try {
      await api.put(`/cau-hinh/quy-doi-diem/${q.id}`, { gia_tri: q.gia_tri });
      setMsg({ type: 'ok', text: `Đã lưu quy tắc "${q.ten_quy_tac}".` });
      load();
    } catch (e) { setMsg({ type: 'err', text: getErrorMessage(e) }); }
  }

  return (
    <div>
      <div className="toolbar"><h3>Cấu hình hệ thống</h3></div>
      {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

      <div className="card">
        <h3>Hạng thành viên</h3>
        <p className="muted">Ngưỡng điểm quyết định hạng; % giảm áp dụng khi bán. Lưu sẽ tự động cập nhật lại hạng của toàn bộ khách hàng.</p>
        <table>
          <thead><tr><th>Mã hạng</th><th>Tên hạng</th><th>Ngưỡng điểm</th><th>Giảm giá (%)</th><th></th></tr></thead>
          <tbody>
            {hang.map((h, i) => (
              <tr key={h.id}>
                <td><b>{h.ma_hang}</b></td>
                <td><input value={h.ten_hang || ''} onChange={(e) => setHangRow(i, 'ten_hang', e.target.value)} style={{ margin: 0 }} /></td>
                <td><input type="number" value={h.nguong_diem} onChange={(e) => setHangRow(i, 'nguong_diem', e.target.value)} style={{ margin: 0, width: 130 }} /></td>
                <td><input type="number" step="0.01" value={h.phan_tram_giam} onChange={(e) => setHangRow(i, 'phan_tram_giam', e.target.value)} style={{ margin: 0, width: 110 }} /></td>
                <td><button className="small" onClick={() => saveHang(h)}>Lưu</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Quy tắc quy đổi điểm</h3>
        <table>
          <thead><tr><th>Quy tắc</th><th>Mô tả</th><th>Giá trị</th><th></th></tr></thead>
          <tbody>
            {quyDoi.map((q, i) => (
              <tr key={q.id}>
                <td><b>{q.ten_quy_tac}</b></td>
                <td className="muted">{q.mo_ta}</td>
                <td><input type="number" step="1" value={q.gia_tri} onChange={(e) => setQuyDoiRow(i, e.target.value)} style={{ margin: 0, width: 140 }} /></td>
                <td><button className="small" onClick={() => saveQuyDoi(q)}>Lưu</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
