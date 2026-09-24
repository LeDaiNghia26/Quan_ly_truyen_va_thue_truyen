import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge } from '../ui';
import { useFetch } from '../hooks';

export default function NhaCungCap() {
  const { data, reload } = useFetch((p) => api.get('/nha-cung-cap', { params: p }));
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { reload(); }, []);

  function reset() { setShow(false); setEditing(null); setForm({}); setMsg(''); }

  async function add(e) {
    e.preventDefault();
    try { await api.post('/nha-cung-cap', form); reset(); reload(); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  async function save(e) {
    e.preventDefault();
    try { await api.put(`/nha-cung-cap/${editing.id}`, form); reset(); reload(); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  function startEdit(ncc) {
    setEditing(ncc);
    setForm({ ten_ncc: ncc.ten_ncc, dia_chi: ncc.dia_chi, so_dien_thoai: ncc.so_dien_thoai, email: ncc.email });
    setShow(true);
    setMsg('');
  }
  async function remove(ncc) {
    if (!confirm('Xóa/ngừng hợp tác nhà cung cấp này?')) return;
    try { await api.delete(`/nha-cung-cap/${ncc.id}`); reload(); } catch (e) { alert(getErrorMessage(e)); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Quản lý nhà cung cấp</h3>
        <button onClick={reset}>+ Thêm nhà cung cấp</button>
      </div>
      {show && (
        <div className="card">
          <h3>{editing ? `Sửa nhà cung cấp: ${editing.ten_ncc}` : 'Thêm nhà cung cấp'}</h3>
          {msg && <div className="msg err">{msg}</div>}
          <form className="form-grid" onSubmit={editing ? save : add}>
            <div><label>Tên nhà cung cấp *</label><input value={form.ten_ncc || ''} onChange={(e) => setForm({ ...form, ten_ncc: e.target.value })} required /></div>
            <div><label>Địa chỉ</label><input value={form.dia_chi || ''} onChange={(e) => setForm({ ...form, dia_chi: e.target.value })} /></div>
            <div><label>Số điện thoại</label><input value={form.so_dien_thoai || ''} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} /></div>
            <div><label>Email</label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="full toolbar">
              <button type="submit">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
              <button type="button" className="secondary" onClick={reset}>Hủy</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Tên</th><th>Địa chỉ</th><th>Điện thoại</th><th>Email</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((ncc) => (
              <tr key={ncc.id}>
                <td>{ncc.id}</td><td>{ncc.ten_ncc}</td><td>{ncc.dia_chi}</td><td>{ncc.so_dien_thoai}</td><td>{ncc.email}</td>
                <td><Badge type="trang_thai" value={ncc.trang_thai} /></td>
                <td>
                  <button className="small secondary" onClick={() => startEdit(ncc)}>Sửa</button>{' '}
                  <button className="small danger" onClick={() => remove(ncc)}>Xóa</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="empty">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}