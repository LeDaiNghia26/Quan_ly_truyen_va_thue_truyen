import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge } from '../ui';
import { useFetch } from '../hooks';

export default function NhanVien() {
  const { data, reload } = useFetch((p) => api.get('/nhan-vien', { params: p }));
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { reload(); }, []);

  function reset() { setShow(false); setEditing(null); setForm({}); setMsg(''); }

  async function add(e) {
    e.preventDefault();
    try { await api.post('/nhan-vien', form); reset(); reload(); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  async function save(e) {
    e.preventDefault();
    try { await api.put(`/nhan-vien/${editing.id}`, form); reset(); reload(); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  function startEdit(nv) {
    setEditing(nv);
    setForm({ ho_ten: nv.ho_ten, chuc_vu: nv.chuc_vu, email: nv.email, so_dien_thoai: nv.so_dien_thoai });
    setShow(true);
    setMsg('');
  }
  async function toggle(nv) {
    try { await api.patch(`/nhan-vien/${nv.id}/toggle-khoa`); reload(); }
    catch (e) { alert(getErrorMessage(e)); }
  }
  async function resetPw(nv) {
    if (!confirm(`Đặt lại mật khẩu của "${nv.ho_ten}" về 123456?`)) return;
    try { const r = await api.patch(`/nhan-vien/${nv.id}/reset-mat-khau`); alert(r.data.message); }
    catch (e) { alert(getErrorMessage(e)); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Quản lý nhân viên</h3>
        <button onClick={reset}>+ Thêm nhân viên</button>
      </div>
      {show && (
        <div className="card">
          <h3>{editing ? `Sửa nhân viên: ${editing.ho_ten}` : 'Thêm nhân viên mới'}</h3>
          {msg && <div className="msg err">{msg}</div>}
          <form className="form-grid" onSubmit={editing ? save : add}>
            <div><label>Họ tên *</label><input value={form.ho_ten || ''} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} required /></div>
            <div><label>Chức vụ</label><input value={form.chuc_vu || ''} onChange={(e) => setForm({ ...form, chuc_vu: e.target.value })} /></div>
            <div><label>Email *</label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label>Số điện thoại</label><input value={form.so_dien_thoai || ''} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} /></div>
            {!editing && <div className="full"><label>Mật khẩu ban đầu *</label><input value={form.mat_khau || ''} onChange={(e) => setForm({ ...form, mat_khau: e.target.value })} required /></div>}
            <div className="full toolbar">
              <button type="submit">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
              <button type="button" className="secondary" onClick={reset}>Hủy</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Họ tên</th><th>Chức vụ</th><th>Email</th><th>Điện thoại</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((nv) => (
              <tr key={nv.id}>
                <td>{nv.id}</td><td>{nv.ho_ten}</td><td>{nv.chuc_vu}</td><td>{nv.email}</td><td>{nv.so_dien_thoai}</td>
                <td><Badge type="trang_thai" value={nv.trang_thai} /></td>
                <td>
                  <button className="small secondary" onClick={() => startEdit(nv)}>Sửa</button>{' '}
                  <button className="small secondary" onClick={() => resetPw(nv)}>Reset MK</button>{' '}
                  <button className="small secondary" onClick={() => toggle(nv)}>{nv.trang_thai === 'khoa' ? 'Mở khóa' : 'Khóa'}</button>
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