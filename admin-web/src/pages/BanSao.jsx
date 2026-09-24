import React, { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge, fmt } from '../ui';
import Barcode from '../components/Barcode';

export default function BanSao() {
  const [items, setItems] = useState([]);
  const [kw, setKw] = useState('');
  const [filterTT, setFilterTT] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [edit, setEdit] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [printItems, setPrintItems] = useState(null);
  const [anLuuHanh, setAnLuuHanh] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/bansao', { params: { tu_khoa: kw || undefined, trang_thai: filterTT || undefined, an_luu_hanh: anLuuHanh ? '1' : undefined } });
      setItems(r.data);
    } catch (e) { setMsg(getErrorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [anLuuHanh]);

  const stats = useMemo(() => {
    const c = {};
    for (const i of items) c[i.trang_thai] = (c[i.trang_thai] || 0) + 1;
    return c;
  }, [items]);

  async function save(e) {
    e.preventDefault();
    setSaveMsg('');
    try {
      await api.put(`/bansao/${edit.id}`, {
        vi_tri_ke: edit.vi_tri_ke,
        tinh_trang_hien_tai: edit.tinh_trang_hien_tai,
        trang_thai: edit.trang_thai,
      });
      setSaveMsg('Đã lưu thay đổi.');
      setEdit(null);
      await load();
    } catch (e2) { setSaveMsg(getErrorMessage(e2)); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>🗄 Quản lý bản sao (kho)</h3>
        <input value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Tìm theo mã / tên truyện / vị trí kệ" style={{ margin: 0, width: 260 }} />
        <select value={filterTT} onChange={(e) => { setFilterTT(e.target.value); load(); }} style={{ margin: 0, width: 200 }}>
          <option value="">-- Tất cả trạng thái --</option>
          {Object.entries(stats).map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
        </select>
        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }} title="Ẩn các bản đã bán và ngừng lưu hành khỏi danh sách (không xóa dữ liệu)">
          <input type="checkbox" checked={anLuuHanh} onChange={(e) => setAnLuuHanh(e.target.checked)} />
          Chỉ hiện bản đang lưu hành (ẩn đã bán/ngừng lưu hành)
        </label>
        <button onClick={load}>Tìm</button>
        <button className="secondary" onClick={() => setPrintItems(items)} disabled={!items.length}>In tem mã vạch</button>
        <span className="muted">Tổng: <b>{items.length}</b> bản</span>
      </div>

      {msg && <div className="msg err">{msg}</div>}

      <div className="card">
        <table>
          <thead><tr><th>Mã bản sao</th><th>Truyện</th><th>Tập</th><th>Tác giả</th><th>Kệ</th><th>Tình trạng vật lý</th><th>Trạng thái</th><th>Giá thuê</th><th>Giá bán</th><th></th></tr></thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td><b>{b.ma_ban_sao}</b></td>
                <td>{b.ten_truyen}</td>
                <td>{b.tap}</td>
                <td>{b.tac_gia || ''}</td>
                <td>{b.vi_tri_ke || <span className="muted">—</span>}</td>
                <td><Badge type="tinh_trang_vat_ly" value={b.tinh_trang_hien_tai} /></td>
                <td><Badge type="trang_thai_bs" value={b.trang_thai} /></td>
                <td>{fmt(b.gia_thue)}₫</td>
                <td>{fmt(b.gia_ban)}₫</td>
                <td><button className="small" onClick={() => setEdit({ ...b })}>Cập nhật</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={10} className="empty">{loading ? 'Đang tải...' : 'Không tìm thấy bản sao.'}</td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="modal-overlay" onClick={() => setEdit(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Cập nhật bản sao {edit.ma_ban_sao}</h3>
            <form onSubmit={save} className="form-grid">
              <div className="full"><label>Truyện</label><div>{edit.ten_truyen}</div></div>
              <div className="full"><label>Vị trí kệ</label><input value={edit.vi_tri_ke || ''} onChange={(e) => setEdit({ ...edit, vi_tri_ke: e.target.value })} placeholder="VD: Kệ A2" /></div>
              <div>
                <label>Tình trạng vật lý</label>
                <select value={edit.tinh_trang_hien_tai} onChange={(e) => setEdit({ ...edit, tinh_trang_hien_tai: e.target.value })}>
                  <option value="moi">Mới</option>
                  <option value="tot">Tốt</option>
                  <option value="cu">Cũ</option>
                  <option value="hu_hong">Hư hỏng</option>
                </select>
              </div>
              <div>
                <label>Trạng thái kho</label>
                <select value={edit.trang_thai} onChange={(e) => setEdit({ ...edit, trang_thai: e.target.value })}>
                  <option value="san_sang">Sẵn sàng</option>
                  <option value="bao_tri">Bảo trì / Sửa chữa</option>
                  <option value="ngung_luu_hanh">Ngừng lưu hành</option>
                  <option value="dang_giu">Đang giữ</option>
                  <option value="da_ban">Đã bán</option>
                </select>
              </div>
              {saveMsg && <div className={`msg full ${saveMsg.startsWith('Đã') ? 'ok' : 'err'}`}>{saveMsg}</div>}
              <div className="full toolbar" style={{ marginTop: 8 }}>
                <button type="submit">Lưu</button>
                <button type="button" className="secondary" onClick={() => setEdit(null)}>Đóng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printItems && (
        <div className="print-overlay">
          <div className="print-toolbar">
            <h3>Tem mã vạch ({printItems.length})</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => window.print()}>In</button>
              <button className="secondary" onClick={() => setPrintItems(null)}>Đóng</button>
            </div>
          </div>
          <div className="print-area label-grid">
            {printItems.map((b) => (
              <div className="label-card" key={b.id}>
                <div className="lc-title">{b.ten_truyen}</div>
                <Barcode value={b.ma_ban_sao} height={40} width={1.5} />
                <div className="lc-code">{b.ma_ban_sao}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}