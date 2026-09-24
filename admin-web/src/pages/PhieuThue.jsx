import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate, Badge } from '../ui';
import { useFetch } from '../hooks';

export default function PhieuThue() {
  const { data, reload } = useFetch((p) => api.get('/phieu-thue', { params: p }));
  const [show, setShow] = useState(false);
  const [datTruocList, setDatTruocList] = useState([]);
  const [truyenList, setTruyenList] = useState([]);
  const [khachList, setKhachList] = useState([]);
  const [form, setForm] = useState({ ma_dat_truoc: '', ma_khach_hang: '', rows: [{ ma_ban_sao: '', ngay_hen_tra: '', tinh_trang_giao: 'moi' }] });
  const [msg, setMsg] = useState('');
  const [lyDoTarget, setLyDoTarget] = useState(null);
  const [lyDoHop, setLyDoHop] = useState('');
  const [lyDoMsg, setLyDoMsg] = useState('');
  const [busyLyDo, setBusyLyDo] = useState(false);

  useEffect(() => { reload(); api.get('/dat-truoc', { params: { trang_thai: 'cho_nhan' } }).then((r) => setDatTruocList(r.data)).catch(() => {});
    api.get('/truyen').then((r) => setTruyenList(r.data)).catch(() => {}); api.get('/khach-hang').then((r) => setKhachList(r.data)).catch(() => {}); }, []);

  function setRow(i, k, v) { setForm({ ...form, rows: form.rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r) }); }

  function onChonDatTruoc(v) {
    setForm({ ...form, ma_dat_truoc: v });
    if (!v) return;
    api.get(`/dat-truoc/${v}`).then((r) => {
      const dt = r.data;
      setForm({
        ...form,
        ma_dat_truoc: v,
        ma_khach_hang: String(dt.ma_khach_hang || ''),
        rows: (dt.chi_tiet || []).map((ct) => ({ ma_truyen: String(ct.ma_truyen), ma_ban_sao: String(ct.ma_ban_sao), ngay_hen_tra: '', tinh_trang_giao: 'moi' })),
      });
    }).catch(() => {});
  }

  async function submit(e) {
    e.preventDefault();
    const chiTiet = form.rows.filter((r) => r.ma_ban_sao).map((r) => ({ ...r, ma_ban_sao: Number(r.ma_ban_sao) }));
    if (chiTiet.length === 0) { setMsg('Chọn ít nhất 1 bản sao.'); return; }
    const body = {
      ma_dat_truoc: form.ma_dat_truoc ? Number(form.ma_dat_truoc) : null,
      ma_khach_hang: form.ma_khach_hang ? Number(form.ma_khach_hang) : null,
      ten_khach_le: form.ten_khach_le || null,
      sdt_khach_le: form.sdt_khach_le || null,
      phuong_thuc_thanh_toan: form.phuong_thuc || 'tien_mat',
      chi_tiet: chiTiet,
    };
    try { await api.post('/phieu-thue', body); setShow(false); setForm({ ma_dat_truoc: '', ma_khach_hang: '', rows: [{ ma_ban_sao: '', ngay_hen_tra: '', tinh_trang_giao: 'moi' }] }); reload(); setMsg(''); }
    catch (e2) { setMsg(getErrorMessage(e2)); }
  }

  async function huyPhieu(p) {
    setLyDoTarget(p);
    setLyDoHop('');
    setLyDoMsg('');
  }

  async function xacNhanHuy() {
    if (!lyDoTarget) return;
    const lyDo = (lyDoHop || '').trim();
    if (!lyDo) { setLyDoMsg('Vui lòng nhập lý do hủy phiếu.'); return; }
    setBusyLyDo(true);
    try { await api.post(`/phieu-thue/${lyDoTarget.id}/huy`, { ly_do: lyDo }); setLyDoTarget(null); setLyDoHop(''); setLyDoMsg(''); reload(); setMsg(''); }
    catch (e2) { setLyDoMsg(getErrorMessage(e2)); }
    finally { setBusyLyDo(false); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Phiếu thuê</h3>
        <button onClick={() => { setShow(true); setMsg(''); }}>+ Lập phiếu thuê</button>
      </div>
      {msg && <div className="msg err">{msg}</div>}
      {show && (
        <div className="card">
          <h3>Lập phiếu thuê</h3>
{msg && !show && <div className="msg err">{msg}</div>}
          <form onSubmit={submit} className="form-grid">
            <div>
              <label>Đơn đặt trước (nếu có)</label>
              <select value={form.ma_dat_truoc} onChange={(e) => onChonDatTruoc(e.target.value)}>
                <option value="">-- Không --</option>
                {datTruocList.filter((d) => d.loai === 'thue').map((d) => <option key={d.id} value={d.id}>#{d.id} {d.ho_ten} - {d.danh_sach_truyen}</option>)}
              </select>
            </div>
            <div>
              <label>Khách hàng có tài khoản</label>
              <select value={form.ma_khach_hang} onChange={(e) => setForm({ ...form, ma_khach_hang: e.target.value })}>
                <option value="">-- Khách vãng lai --</option>
                {khachList.map((kh) => <option key={kh.id} value={kh.id}>{kh.ho_ten}</option>)}
              </select>
            </div>
            <div><label>Tên khách vãng lai</label><input value={form.ten_khach_le || ''} onChange={(e) => setForm({ ...form, ten_khach_le: e.target.value })} /></div>
            <div><label>SĐT khách vãng lai</label><input value={form.sdt_khach_le || ''} onChange={(e) => setForm({ ...form, sdt_khach_le: e.target.value })} /></div>
            <div><label>Phương thức thanh toán</label>
              <select value={form.phuong_thuc || 'tien_mat'} onChange={(e) => setForm({ ...form, phuong_thuc: e.target.value })}>
                <option value="tien_mat">💵 Tiền mặt</option><option value="chuyen_khoan">🏦 Chuyển khoản</option>
              </select>
            </div>
            <div className="full" style={{ marginTop: 8 }}>
              <label>Truyện & bản sao (chọn bản sao có mã từ truyện)</label>
              <table>
                <thead><tr><th>Truyện</th><th>Mã bản sao</th><th>Ngày hẹn trả</th><th>Tình trạng giao</th><th></th></tr></thead>
                <tbody>
                  {form.rows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <select value={r.ma_truyen || ''} onChange={(e) => { setRow(i, 'ma_truyen', e.target.value); }} style={{ marginBottom: 0 }}>
                          <option value="">-- Truyện --</option>
                          {truyenList.map((t) => <option key={t.id} value={t.id}>{t.ten_truyen}</option>)}
                        </select>
                      </td>
                      <td>
                        <BanSaoPicker truyenId={r.ma_truyen} value={r.ma_ban_sao} onPick={(id) => setRow(i, 'ma_ban_sao', id)} />
                      </td>
                      <td><input type="date" value={r.ngay_hen_tra} onChange={(e) => setRow(i, 'ngay_hen_tra', e.target.value)} required style={{ marginBottom: 0 }} /></td>
                      <td>
                        <select value={r.tinh_trang_giao} onChange={(e) => setRow(i, 'tinh_trang_giao', e.target.value)} style={{ marginBottom: 0 }}>
                          <option value="moi">Mới</option><option value="tot">Tốt</option><option value="cu">Cũ</option>
                        </select>
                      </td>
                      <td><button type="button" className="small danger" onClick={() => setForm({ ...form, rows: form.rows.filter((_, idx) => idx !== i) })}>Bỏ</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="secondary small" onClick={() => setForm({ ...form, rows: [...form.rows, { ma_truyen: '', ma_ban_sao: '', ngay_hen_tra: '', tinh_trang_giao: 'moi' }] })}>+ Thêm dòng</button>
            </div>
            <div className="full toolbar" style={{ marginTop: 16 }}>
              <button type="submit">Xác nhận</button>
              <button type="button" className="secondary" onClick={() => setShow(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Khách</th><th>Nhân viên</th><th>Ngày thuê</th><th>Số đầu</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.ten_khach}</td><td>{p.ma_nhan_vien}</td>
                <td>{fmtDate(p.ngay_thue)}</td><td>{p.so_dau} ({p.dang_thue} đang thuê)</td><td>{fmt(p.tong_tien)}₫</td>
                <td><Badge type="trang_thai_pb" value={p.trang_thai} /></td>
                <td>{p.trang_thai === 'hoat_dong' && <button className="small danger" onClick={() => huyPhieu(p)}>Hủy phiếu</button>}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={8} className="empty">Chưa có phiếu thuê</td></tr>}
          </tbody>
        </table>
      </div>

      {lyDoTarget && (
        <div className="modal-overlay" onClick={() => setLyDoTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Hủy phiếu thuê #{lyDoTarget.id}</h4>
            <p className="muted">Hủy phiếu sẽ trả bản sao về kho và thu hồi điểm tích (nếu khách có tài khoản). Vui lòng ghi rõ lý do.</p>
            <input autoFocus value={lyDoHop} onChange={(e) => setLyDoHop(e.target.value)} placeholder="Lý do hủy (bắt buộc): VD khách trả nhầm, chưa lấy, ..." />
            {lyDoMsg && <div className="msg err">{lyDoMsg}</div>}
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button className="danger" disabled={busyLyDo} onClick={xacNhanHuy}>{busyLyDo ? 'Đang xử lý...' : 'Xác nhận hủy phiếu'}</button>
              <button className="secondary" onClick={() => setLyDoTarget(null)}>Thoát</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BanSaoPicker({ truyenId, value, onPick }) {
  const [bs, setBs] = useState([]);
  useEffect(() => {
    if (!truyenId) { setBs([]); return; }
    api.get(`/truyen/${truyenId}`).then((r) => setBs(r.data.ban_sao.filter((b) => b.trang_thai === 'san_sang' || b.trang_thai === 'dang_giu'))).catch(() => setBs([]));
  }, [truyenId]);
  return (
    <select value={value} onChange={(e) => e.target.value && onPick(e.target.value)} style={{ marginBottom: 0 }}>
      <option value="">-- Bản sao --</option>
      {bs.map((b) => <option key={b.id} value={b.id}>{b.ma_ban_sao} ({b.trang_thai === 'dang_giu' ? 'đang giữ' : b.trang_thai})</option>)}
    </select>
  );
}