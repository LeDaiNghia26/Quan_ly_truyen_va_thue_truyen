import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge, fmt, fmtDate } from '../ui';
import { useFetch } from '../hooks';

const TABS = [
  ['', 'Tất cả'],
  ['TRUYEN_TRANH', 'Truyện tranh'],
  ['TIEU_THUYET', 'Tiểu thuyết'],
  ['TRUYEN_NGAN', 'Truyện ngắn'],
  ['LIGHT_NOVEL', 'Light Novel'],
];

export default function Truyen() {
  const { data, loading, reload } = useFetch((p) => api.get('/truyen', { params: p }));
  const [theLoaiList, setTheLoaiList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [chiTiet, setChiTiet] = useState(null);
  const [tab, setTab] = useState('');
  const [kw, setKw] = useState('');
  const [uploading, setUploading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.user?.vai_tro === 'admin';

  function run(kwValue = kw, tabValue = tab) {
    reload({ tu_khoa: kwValue || undefined, loai: tabValue || undefined });
  }

  useEffect(() => { run('', ''); api.get('/the-loai').then((r) => setTheLoaiList(r.data)).catch(() => {}); }, []);

  async function xemBanSao(t) {
    try { const r = await api.get(`/truyen/${t.id}`); setChiTiet(r.data); }
    catch (e) { alert(getErrorMessage(e)); }
  }

  function openAdd() {
    setEditing(0);
    setForm({ ten_truyen: '', tac_gia: '', loai: 'TRUYEN_TRANH', gia_thue: '', gia_ban: '', mo_ta: '', anh_bia: '', ma_viet_tat: '', danh_sach_the_loai: [] });
    setMsg({ type: '', text: '' });
  }
  async function openEdit(t) {
    try {
      const r = await api.get(`/truyen/${t.id}`);
      setForm({ ...r.data, danh_sach_the_loai: r.data.danh_sach_the_loai || [] });
      setEditing(t.id);
      setMsg({ type: '', text: '' });
    } catch (e) { alert(getErrorMessage(e)); }
  }
  function close() { setEditing(null); setMsg({ type: '', text: '' }); }

  async function submit(e) {
    e.preventDefault();
    if (!(form.danh_sach_the_loai || []).length) { setMsg({ type: 'err', text: 'Chọn ít nhất 1 thể loại.' }); return; }
    try {
      if (editing === 0) { await api.post('/truyen', form); setMsg({ type: 'ok', text: 'Thêm truyện thành công.' }); }
      else { await api.put(`/truyen/${editing}`, form); setMsg({ type: 'ok', text: 'Cập nhật thành công.' }); }
      run(); setEditing(null);
    } catch (e2) { setMsg({ type: 'err', text: getErrorMessage(e2) }); }
  }

  async function remove(t) {
    if (!confirm(`Ngừng kinh doanh "${t.ten_truyen}"?`)) return;
    try { await api.delete(`/truyen/${t.id}`); run(); } catch (e) { alert(getErrorMessage(e)); }
  }

  async function uploadBia(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('anh', f);
    setUploading(true);
    try {
      const r = await api.post('/upload/anh-bia', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => ({ ...prev, anh_bia: r.data.url }));
    } catch (e2) { alert(getErrorMessage(e2)); }
    finally { setUploading(false); }
  }

  function set(field) { return (e) => setForm({ ...form, [field]: e.target.value }); }
  function toggleTheLoai(id) {
    const cur = form.danh_sach_the_loai || [];
    setForm({ ...form, danh_sach_the_loai: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  }

  return (
    <div>
      <div className="toolbar">
        <h3>{isAdmin ? 'Quản lý truyện' : 'Tra cứu truyện & tình trạng bản sao'}</h3>
        {isAdmin && <button onClick={openAdd}>+ Thêm truyện</button>}
      </div>

      <div className="tabs">
        {TABS.map(([v, label]) => (
          <button key={v} className={`tab ${tab === v ? 'active' : ''}`} onClick={() => { setTab(v); run(kw, v); }}>
            {label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input placeholder="Nhập tên truyện/tác giả/mã viết tắt" value={kw}
          onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} style={{ width: 300, margin: 0 }} />
        <button onClick={() => run()}>Tìm kiếm</button>
      </div>

      {loading && <div className="card">Đang tải...</div>}
      {!loading && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Tên truyện</th><th>Mã</th><th>Tác giả</th><th>Loại</th><th>Thể loại</th>
                <th>Giá thuê</th><th>Giá bán</th><th>Bản sao (sẵn sàng)</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.ten_truyen}</td>
                  <td>{t.ma_viet_tat || <span className="muted">—</span>}</td>
                  <td>{t.tac_gia}</td>
                  <td><Badge type="loai_san_pham" value={t.loai} /></td>
                  <td>
                    {t.the_loai_ten || <span className="muted">—</span>}
                  </td>
                  <td>{fmt(t.gia_thue)}₫</td>
                  <td>{fmt(t.gia_ban)}₫</td>
                  <td>{t.tong_ban_sao} ({t.so_san_sang})</td>
                  <td><Badge type="trang_thai" value={t.trang_thai} /></td>
                  <td>
                    <button className="small secondary" onClick={() => xemBanSao(t)}>Bản sao</button>{' '}
                    {isAdmin && <><button className="small secondary" onClick={() => openEdit(t)}>Sửa</button>{' '}
                    <button className="small danger" onClick={() => remove(t)}>Xóa</button></>}
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={11} className="empty">Không có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {chiTiet && (
        <div className="card">
          <div className="toolbar">
            <h3>{chiTiet.ten_truyen} — các bản sao ({chiTiet.ban_sao.length})</h3>
            <button className="secondary" onClick={() => setChiTiet(null)}>Đóng</button>
          </div>
          <table>
            <thead><tr><th>Mã bản sao</th><th>Tập</th><th>Tình trạng hiện tại</th><th>Trạng thái</th><th>Ngày nhập</th></tr></thead>
            <tbody>
              {chiTiet.ban_sao.map((b) => (
                <tr key={b.id}>
                  <td>{b.ma_ban_sao}</td>
                  <td>{b.tap}</td>
                  <td><Badge type="tinh_trang_vat_ly" value={b.tinh_trang_hien_tai} /></td>
                  <td><Badge type="trang_thai_bs" value={b.trang_thai} /></td>
                  <td>{fmtDate(b.ngay_nhap)}</td>
                </tr>
              ))}
              {chiTiet.ban_sao.length === 0 && <tr><td colSpan={5} className="empty">Chưa có bản sao</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <div className="card">
          <h3>{editing === 0 ? 'Thêm truyện mới' : `Sửa: ${form.ten_truyen}`}</h3>
          {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          <form onSubmit={submit} className="form-grid">
            <div><label>Tên truyện *</label><input value={form.ten_truyen || ''} onChange={set('ten_truyen')} required /></div>
            <div><label>Tác giả</label><input value={form.tac_gia || ''} onChange={set('tac_gia')} /></div>
            <div>
              <label>Loại truyện * (format — chọn 1)</label>
              <select value={form.loai || 'TRUYEN_TRANH'} onChange={set('loai')}>
                <option value="TRUYEN_TRANH">Truyện tranh</option>
                <option value="TIEU_THUYET">Tiểu thuyết</option>
                <option value="TRUYEN_NGAN">Truyện ngắn</option>
                <option value="LIGHT_NOVEL">Light Novel</option>
              </select>
            </div>
            <div><label>Mã viết tắt (dùng in tem)</label><input value={form.ma_viet_tat || ''} onChange={set('ma_viet_tat')} placeholder="VD: DRM" maxLength={20} /></div>
            <div>
              <label>Ảnh bìa</label>
              <input type="file" accept="image/*" onChange={uploadBia} />
              {uploading && <div className="muted">Đang tải ảnh...</div>}
              {form.anh_bia && <img src={form.anh_bia} alt="bìa" className="bia-preview" />}
            </div>
            <div className="full">
              <label>Thể loại (chủ đề) * — chọn nhiều</label>
              <div className="chk-grid">
                {theLoaiList.map((tl) => (
                  <label key={tl.id} className="chk">
                    <input type="checkbox" checked={(form.danh_sach_the_loai || []).includes(tl.id)} onChange={() => toggleTheLoai(tl.id)} />
                    {tl.ten_the_loai}
                  </label>
                ))}
              </div>
            </div>
            <div><label>Giá thuê/lượt (₫) *</label><input type="number" value={form.gia_thue || ''} onChange={set('gia_thue')} required /></div>
            <div><label>Giá bán (₫) *</label><input type="number" value={form.gia_ban || ''} onChange={set('gia_ban')} required /></div>
            <div className="full"><label>Mô tả</label><textarea rows={3} value={form.mo_ta || ''} onChange={set('mo_ta')} /></div>
            <div className="full toolbar">
              <button type="submit">{editing === 0 ? 'Thêm mới' : 'Cập nhật'}</button>
              <button type="button" className="secondary" onClick={close}>Hủy</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
