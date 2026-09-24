import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { Badge, fmt } from '../ui';
import { useFetch, SearchBar } from '../hooks';
import { exportExcel, exportPdf } from '../exportUtils';

const emptyForm = { ma_ban_sao: '', ngay: new Date().toISOString().slice(0, 10), chi_phi: 0, noi_dung: '' };

export default function BaoTri() {
  const { data, reload } = useFetch((p) => api.get('/bao-tri', { params: p }));
  const [banSaoList, setBanSaoList] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');

  function loadBanSao() {
    api.get('/bansao').then((r) => {
      setBanSaoList(r.data.filter((b) => ['san_sang', 'bao_tri'].includes(b.trang_thai)));
    }).catch(() => {});
  }
  useEffect(() => { reload(); loadBanSao(); }, []);

  function reset() { setShow(false); setEditing(null); setForm(emptyForm); setMsg(''); }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/bao-tri/${editing.id}`, form);
      else await api.post('/bao-tri', form);
      reset(); reload(); loadBanSao();
    } catch (e2) { setMsg(getErrorMessage(e2)); }
  }
  function startEdit(row) {
    setEditing(row);
    setForm({ ma_ban_sao: row.ma_ban_sao, ngay: row.ngay ? row.ngay.slice(0, 10) : '', chi_phi: row.chi_phi, noi_dung: row.noi_dung || '' });
    setShow(true);
    setMsg('');
  }
  async function hoanTat(row) {
    if (!confirm(`Hoàn tất bảo trì bản sao "${row.ma}" và đưa về Sẵn sàng?`)) return;
    try { await api.patch(`/bao-tri/${row.id}/hoan-tat`); reload(); loadBanSao(); }
    catch (e) { alert(getErrorMessage(e)); }
  }
  async function remove(row) {
    if (!confirm(`Xóa phiếu bảo trì #${row.id}?`)) return;
    try { await api.delete(`/bao-tri/${row.id}`); reload(); }
    catch (e) { alert(getErrorMessage(e)); }
  }
  function f(k) { return (e) => setForm({ ...form, [k]: e.target.value }); }

  const tongChiPhi = data.reduce((s, r) => s + Number(r.chi_phi || 0), 0);

  function doExportExcel() {
    exportExcel([{
      name: 'BaoTri',
      rows: data.map((r) => ({
        'Mã phiếu': r.id, 'Mã bản sao': r.ma, 'Tập': r.tap, 'Truyện': r.ten_truyen,
        'Ngày': r.ngay ? String(r.ngay).slice(0, 10) : '', 'Chi phí': Number(r.chi_phi || 0),
        'Nội dung': r.noi_dung || '', 'Người ghi': r.ten_quan_tri_vien,
      })),
    }], 'bao-tri.xlsx');
  }
  function doExportPdf() {
    exportPdf({
      title: 'Danh sách phiếu bảo trì',
      sections: [{
        head: ['Mã', 'Bản sao', 'Tập', 'Truyện', 'Ngày', 'Chi phí', 'Nội dung'],
        body: data.map((r) => [r.id, r.ma, r.tap, r.ten_truyen, r.ngay ? String(r.ngay).slice(0, 10) : '', fmt(r.chi_phi) + '₫', r.noi_dung || '']),
      }],
    }, 'bao-tri.pdf');
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Phiếu bảo trì</h3>
        <SearchBar placeholder="Mã bản sao / truyện / nội dung..." onSearch={(kw) => reload({ tu_khoa: kw })} />
        <button onClick={() => { reset(); setShow(true); }}>+ Ghi nhận bảo trì</button>
        <button className="secondary" onClick={doExportExcel}>Excel</button>
        <button className="secondary" onClick={doExportPdf}>PDF</button>
      </div>

      {show && (
        <div className="card">
          <h3>{editing ? `Sửa phiếu bảo trì #${editing.id}` : 'Ghi nhận bảo trì mới'}</h3>
          {msg && <div className="msg err">{msg}</div>}
          <form className="form-grid" onSubmit={submit}>
            <div>
              <label>Bản sao *</label>
              <select value={form.ma_ban_sao || ''} onChange={f('ma_ban_sao')} required disabled={!!editing}>
                <option value="">-- Chọn bản sao --</option>
                {banSaoList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ma_ban_sao} · {b.ten_truyen} · T{b.tap} {b.trang_thai === 'bao_tri' ? '(đang bảo trì)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div><label>Ngày *</label><input type="date" value={form.ngay || ''} onChange={f('ngay')} required /></div>
            <div><label>Chi phí (₫)</label><input type="number" step="0.01" value={form.chi_phi || ''} onChange={f('chi_phi')} /></div>
            <div className="full"><label>Nội dung</label><input value={form.noi_dung || ''} onChange={f('noi_dung')} /></div>
            <div className="full toolbar">
              <button type="submit">Xác nhận</button>
              <button type="button" className="secondary" onClick={reset}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Mã</th><th>Bản sao</th><th>Tập</th><th>Truyện</th><th>Ngày</th><th>Chi phí</th><th>Nội dung</th><th>Trạng thái BS</th><th>Người ghi</th><th></th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.ma}</td>
                <td>{r.tap}</td>
                <td>{r.ten_truyen}</td>
                <td>{r.ngay ? String(r.ngay).slice(0, 10) : '—'}</td>
                <td>{fmt(r.chi_phi)}₫</td>
                <td>{r.noi_dung}</td>
                <td><Badge type="trang_thai_bs" value={r.trang_thai_ban_sao} /></td>
                <td>{r.ten_quan_tri_vien}</td>
                <td>
                  <button className="small secondary" onClick={() => startEdit(r)}>Sửa</button>{' '}
                  {r.trang_thai_ban_sao === 'bao_tri' && (
                    <><button className="small" onClick={() => hoanTat(r)}>Hoàn tất</button>{' '}</>
                  )}
                  <button className="small secondary" onClick={() => remove(r)}>Xóa</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={10} className="empty">Chưa có phiếu bảo trì</td></tr>}
          </tbody>
          {data.length > 0 && (
            <tfoot><tr><td colSpan={5}><b>Tổng chi phí</b></td><td colSpan={5}><b>{fmt(tongChiPhi)}₫</b></td></tr></tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
