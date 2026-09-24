import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge, fmtDate } from '../ui';
import { useFetch } from '../hooks';

export default function TheLoai() {
  const { data, reload } = useFetch((p) => api.get('/the-loai', { params: p }));
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);
  useEffect(() => { reload(); }, []);

  async function add(e) {
    e.preventDefault();
    try { await api.post('/the-loai', { ten_the_loai: name, mo_ta: desc }); setName(''); setDesc(''); reload(); setMsg(''); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  async function saveEdit(e) {
    e.preventDefault();
    try { await api.put(`/the-loai/${editing.id}`, { ten_the_loai: name, mo_ta: desc }); setEditing(null); setName(''); setDesc(''); reload(); setMsg(''); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  function startEdit(tl) { setEditing(tl); setName(tl.ten_the_loai); setDesc(tl.mo_ta || ''); setMsg(''); }
  async function remove(tl) {
    if (!confirm('Xóa thể loại này?')) return;
    try { await api.delete(`/the-loai/${tl.id}`); reload(); } catch (e) { alert(getErrorMessage(e)); }
  }

  return (
    <div>
      <div className="toolbar"><h3>Quản lý thể loại</h3></div>
      <div className="card">
        <h3>{editing ? `Sửa thể loại: ${editing.ten_the_loai}` : 'Thêm thể loại'}</h3>
        {msg && <div className="msg err">{msg}</div>}
        <form className="form-grid" onSubmit={editing ? saveEdit : add}>
          <div><label>Tên thể loại *</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label>Mô tả</label><input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="full toolbar">
            <button type="submit">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
            {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setName(''); setDesc(''); setMsg(''); }}>Hủy</button>}
          </div>
        </form>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Tên</th><th>Mô tả</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((tl) => (
              <tr key={tl.id}>
                <td>{tl.id}</td>
                <td>{tl.ten_the_loai}</td>
                <td>{tl.mo_ta}</td>
                <td><Badge type="trang_thai" value={tl.trang_thai} /></td>
                <td>
                  <button className="small secondary" onClick={() => startEdit(tl)}>Sửa</button>{' '}
                  <button className="small danger" onClick={() => remove(tl)}>Xóa</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={5} className="empty">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}