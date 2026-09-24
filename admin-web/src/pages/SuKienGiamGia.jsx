import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge, fmtDate } from '../ui';
import { useFetch } from '../hooks';

export default function SuKienGiamGia() {
  const { data, reload } = useFetch((p) => api.get('/su-kien-giam-gia', { params: p }));
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const [tlList, setTlList] = useState([]);
  const [trList, setTrList] = useState([]);
  useEffect(() => { reload(); api.get('/the-loai').then((r) => setTlList(r.data)).catch(() => {}); api.get('/truyen').then((r) => setTrList(r.data)).catch(() => {}); }, []);

  function reset() { setShow(false); setEditing(null); setForm({}); setMsg(''); }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/su-kien-giam-gia/${editing.id}`, form); }
      else { await api.post('/su-kien-giam-gia', form); }
      reset(); reload();
    } catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  function startEdit(sk) {
    setEditing(sk);
    setForm({
      ten_su_kien: sk.ten_su_kien, kieu_giam: sk.kieu_giam, gia_tri: sk.gia_tri, pham_vi: sk.pham_vi,
      ma_the_loai: sk.ma_the_loai, ma_truyen: sk.ma_truyen,
      ngay_bat_dau: sk.ngay_bat_dau ? sk.ngay_bat_dau.slice(0, 16) : '', ngay_ket_thuc: sk.ngay_ket_thuc ? sk.ngay_ket_thuc.slice(0, 16) : '',
    });
    setShow(true);
    setMsg('');
  }
  async function end(sk) {
    try {
      await api.patch(`/su-kien-giam-gia/${sk.id}/end`, { trang_thai: 'ket_thuc' });
      reload();
    } catch (e) { alert(getErrorMessage(e)); }
  }
  async function toggle(sk) {
    try { await api.patch(`/su-kien-giam-gia/${sk.id}/toggle`); reload(); }
    catch (e) { alert(getErrorMessage(e)); }
  }
  function f(k) { return (e) => setForm({ ...form, [k]: e.target.value }); }

  return (
    <div>
      <div className="toolbar">
        <h3>Chương trình giảm giá</h3>
        <button onClick={reset}>+ Tạo chương trình</button>
      </div>
      {show && (
        <div className="card">
          <h3>{editing ? `Sửa chương trình: ${editing.ten_su_kien}` : 'Tạo chương trình giảm giá'}</h3>
          {msg && <div className="msg err">{msg}</div>}
          <form className="form-grid" onSubmit={submit}>
            <div><label>Tên chương trình *</label><input value={form.ten_su_kien || ''} onChange={f('ten_su_kien')} required /></div>
            <div>
              <label>Kiểu giảm *</label>
              <select value={form.kieu_giam || ''} onChange={f('kieu_giam')} required>
                <option value="">--</option><option value="phan_tram">Theo %</option><option value="so_tien">Số tiền cố định</option>
              </select>
            </div>
            <div><label>Giá trị giảm *</label><input type="number" step="0.01" value={form.gia_tri || ''} onChange={f('gia_tri')} required /></div>
            <div>
              <label>Phạm vi *</label>
              <select value={form.pham_vi || ''} onChange={f('pham_vi')} required>
                <option value="">--</option><option value="toan_bo">Toàn bộ</option><option value="the_loai">Theo thể loại</option><option value="truyen">Theo truyện</option>
              </select>
            </div>
            {form.pham_vi === 'the_loai' && (
              <div><label>Thể loại</label>
                <select value={form.ma_the_loai || ''} onChange={f('ma_the_loai')}>
                  <option value="">--</option>{tlList.map((tl) => <option key={tl.id} value={tl.id}>{tl.ten_the_loai}</option>)}
                </select>
              </div>
            )}
            {form.pham_vi === 'truyen' && (
              <div><label>Truyện</label>
                <select value={form.ma_truyen || ''} onChange={f('ma_truyen')}>
                  <option value="">--</option>{trList.map((t) => <option key={t.id} value={t.id}>{t.ten_truyen}</option>)}
                </select>
              </div>
            )}
            <div><label>Bắt đầu *</label><input type="datetime-local" value={form.ngay_bat_dau || ''} onChange={f('ngay_bat_dau')} required /></div>
            <div><label>Kết thúc *</label><input type="datetime-local" value={form.ngay_ket_thuc || ''} onChange={f('ngay_ket_thuc')} required /></div>
            <div className="full toolbar">
              <button type="submit">Xác nhận</button>
              <button type="button" className="secondary" onClick={reset}>Hủy</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Tên</th><th>Giảm</th><th>Phạm vi</th><th>Hiệu lực</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((sk) => (
              <tr key={sk.id}>
                <td>{sk.id}</td><td>{sk.ten_su_kien}</td>
                <td>{sk.kieu_giam === 'phan_tram' ? `${sk.gia_tri}%` : `${sk.gia_tri}₫`}</td>
                <td>{sk.pham_vi === 'toan_bo' ? 'Toàn bộ' : sk.pham_vi === 'the_loai' ? 'Theo thể loại' : 'Theo truyện'}</td>
                <td>{fmtDate(sk.ngay_bat_dau)} → {fmtDate(sk.ngay_ket_thuc)}</td>
                <td><Badge type="trang_thai" value={sk.trang_thai} /></td>
                <td>
                  {sk.trang_thai === 'hoat_dong' && (
                    <>
                      <button className="small secondary" onClick={() => startEdit(sk)}>Sửa</button>{' '}
                      <button className="small secondary" onClick={() => toggle(sk)}>Tạm dừng</button>{' '}
                      <button className="small secondary" onClick={() => end(sk)}>Kết thúc</button>
                    </>
                  )}
                  {sk.trang_thai === 'ket_thuc' && (
                    <button className="small" onClick={() => toggle(sk)}>Bật lại</button>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="empty">Chưa có chương trình</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}