import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate } from '../ui';
import { useFetch } from '../hooks';

export default function PhieuNhapKho() {
  const { data, reload } = useFetch((p) => api.get('/phieu-nhap-kho', { params: p }));
  const [nccList, setNccList] = useState([]);
  const [truyenList, setTruyenList] = useState([]);
  const [show, setShow] = useState(false);
  const [maNcc, setMaNcc] = useState('');
  const [rows, setRows] = useState([{ ma_truyen: '', so_luong: 1, gia_nhap: '', tap: 1, tinh_trang: 'moi' }]);
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState(null);
  useEffect(() => { reload(); api.get('/nha-cung-cap').then((r) => setNccList(r.data)).catch(() => {}); api.get('/truyen').then((r) => setTruyenList(r.data)).catch(() => {}); }, []);

  function setRow(i, field, v) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  }

  async function openDetail(id) {
    try { const r = await api.get(`/phieu-nhap-kho/${id}`); setDetail(r.data); }
    catch (e) { alert(getErrorMessage(e)); }
  }

  async function submit(e) {
    e.preventDefault();
    const chiTiet = rows.filter((r) => r.ma_truyen);
    if (!maNcc || chiTiet.length === 0) { setMsg('Chọn nhà cung cấp và ít nhất 1 truyện.'); return; }
    try {
      await api.post('/phieu-nhap-kho', { ma_ncc: Number(maNcc), chi_tiet: chiTiet });
      setShow(false); setRows([{ ma_truyen: '', so_luong: 1, gia_nhap: '', tap: 1, tinh_trang: 'moi' }]); reload(); setMsg('');
    } catch (e2) { setMsg(getErrorMessage(e2)); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Quản lý phiếu nhập kho</h3>
        <button onClick={() => { setShow(true); setMsg(''); }}>+ Lập phiếu nhập</button>
      </div>
      {show && (
        <div className="card">
          <h3>Lập phiếu nhập kho</h3>
          {msg && <div className="msg err">{msg}</div>}
          <form onSubmit={submit}>
            <label>Nhà cung cấp *</label>
            <select value={maNcc} onChange={(e) => setMaNcc(e.target.value)} required>
              <option value="">-- Chọn --</option>
              {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten_ncc}</option>)}
            </select>
            <table>
              <thead><tr><th>Truyện</th><th>Tập</th><th>Số lượng</th><th>Giá nhập</th><th>Tình trạng</th><th></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <select value={r.ma_truyen} onChange={(e) => setRow(i, 'ma_truyen', e.target.value)} required>
                        <option value="">-- Truyện --</option>
                        {truyenList.map((t) => <option key={t.id} value={t.id}>{t.ten_truyen}</option>)}
                      </select>
                    </td>
                    <td><input type="number" min="1" value={r.tap} onChange={(e) => setRow(i, 'tap', e.target.value)} style={{ width: 70 }} /></td>
                    <td><input type="number" min="1" value={r.so_luong} onChange={(e) => setRow(i, 'so_luong', e.target.value)} /></td>
                    <td><input type="number" min="0" value={r.gia_nhap} onChange={(e) => setRow(i, 'gia_nhap', e.target.value)} required /></td>
                    <td>
                      <select value={r.tinh_trang} onChange={(e) => setRow(i, 'tinh_trang', e.target.value)}>
                        <option value="moi">Mới</option><option value="tot">Tốt</option><option value="cu">Cũ</option>
                      </select>
                    </td>
                    <td><button type="button" className="small danger" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>Bỏ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="toolbar">
              <button type="button" className="secondary" onClick={() => setRows([...rows, { ma_truyen: '', so_luong: 1, gia_nhap: '', tap: 1, tinh_trang: 'moi' }])}>+ Thêm dòng</button>
              <button type="submit">Xác nhận nhập</button>
              <button type="button" className="secondary" onClick={() => setShow(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Nhà cung cấp</th><th>Người lập</th><th>Ngày nhập</th><th>Tổng tiền</th><th></th></tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.ten_ncc}</td><td>{p.nguoi_lap}</td>
                <td>{fmtDate(p.ngay_nhap)}</td><td>{fmt(p.tong_tien)}₫</td>
                <td><button className="small secondary" onClick={() => openDetail(p.id)}>Chi tiết</button></td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="empty">Chưa có phiếu nhập</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="card">
          <div className="toolbar">
            <h3>Phiếu nhập #{detail.id} · {detail.ten_ncc} ({detail.nguoi_lap})</h3>
            <button className="secondary" onClick={() => setDetail(null)}>Đóng</button>
          </div>
          <table>
            <thead><tr><th>Truyện</th><th>Tập</th><th>Số lượng</th><th>Giá nhập</th><th>Thành tiền</th></tr></thead>
            <tbody>
              {detail.chi_tiet.map((ct) => (
                <tr key={ct.id}>
                  <td>{ct.ten_truyen}</td><td>{ct.tap}</td><td>{ct.so_luong}</td>
                  <td>{fmt(ct.gia_nhap)}₫</td><td>{fmt(ct.so_luong * ct.gia_nhap)}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}