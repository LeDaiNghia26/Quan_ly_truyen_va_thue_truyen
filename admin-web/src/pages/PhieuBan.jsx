import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate, Badge } from '../ui';
import { useFetch } from '../hooks';

export default function PhieuBan() {
  const { data, reload } = useFetch((p) => api.get('/phieu-ban', { params: p }));
  const [show, setShow] = useState(false);
  const [datTruocList, setDatTruocList] = useState([]);
  const [truyenList, setTruyenList] = useState([]);
  const [khachList, setKhachList] = useState([]);
  const [form, setForm] = useState({ ma_dat_truoc: '', ma_khach_hang: '', rows: [{ ma_truyen: '', ma_ban_sao: '', diem_su_dung: 0 }] });
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
        rows: (dt.chi_tiet || []).map((ct) => ({ ma_truyen: String(ct.ma_truyen), ma_ban_sao: String(ct.ma_ban_sao), diem_su_dung: Number(dt.diem_su_dung || 0) })),
      });
    }).catch(() => {});
  }

  async function submit(e) {
    e.preventDefault();
    const chiTiet = form.rows.filter((r) => r.ma_ban_sao).map((r) => ({ ma_ban_sao: Number(r.ma_ban_sao), diem_su_dung: Number(r.diem_su_dung) || 0 }));
    if (chiTiet.length === 0) { setMsg('Chọn ít nhất 1 bản sao.'); return; }
    const body = {
      ma_dat_truoc: form.ma_dat_truoc ? Number(form.ma_dat_truoc) : null,
      ma_khach_hang: form.ma_khach_hang ? Number(form.ma_khach_hang) : null,
      ten_khach_le: form.ten_khach_le || null,
      sdt_khach_le: form.sdt_khach_le || null,
      phuong_thuc_thanh_toan: form.phuong_thuc || 'tien_mat',
      chi_tiet: chiTiet,
    };
    try { await api.post('/phieu-ban', body); setShow(false); setForm({ ma_dat_truoc: '', ma_khach_hang: '', rows: [{ ma_truyen: '', ma_ban_sao: '', diem_su_dung: 0 }] }); reload(); setMsg(''); }
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
    try { await api.post(`/phieu-ban/${lyDoTarget.id}/huy`, { ly_do: lyDo }); setLyDoTarget(null); setLyDoHop(''); setLyDoMsg(''); reload(); setMsg(''); }
    catch (e2) { setLyDoMsg(getErrorMessage(e2)); }
    finally { setBusyLyDo(false); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>Phiếu bán</h3>
        <button onClick={() => { setShow(true); setMsg(''); }}>+ Lập phiếu bán</button>
      </div>
      {msg && !show && <div className="msg err">{msg}</div>}
      {show && (
        <div className="card">
          <h3>Lập phiếu bán</h3>
          {msg && <div className="msg err">{msg}</div>}
          <form onSubmit={submit} className="form-grid">
            <div>
              <label>Đơn đặt trước (nếu có)</label>
              <select value={form.ma_dat_truoc} onChange={(e) => onChonDatTruoc(e.target.value)}>
                <option value="">-- Không --</option>
                {datTruocList.filter((d) => d.loai === 'mua').map((d) => <option key={d.id} value={d.id}>#{d.id} {d.ho_ten} - {d.danh_sach_truyen}</option>)}
              </select>
            </div>
            <div>
              <label>Khách hàng có tài khoản (được giảm theo hạng + điểm)</label>
              <select value={form.ma_khach_hang} onChange={(e) => setForm({ ...form, ma_khach_hang: e.target.value })}>
                <option value="">-- Khách vãng lai --</option>
                {khachList.map((kh) => <option key={kh.id} value={kh.id}>{kh.ho_ten} ({kh.hang_thanh_vien}, {kh.diem_tich_luy} điểm)</option>)}
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
              <table>
                <thead><tr><th>Truyện</th><th>Bản sao</th><th>Số điểm dùng (VIP)</th><th></th></tr></thead>
                <tbody>
                  {form.rows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <select value={r.ma_truyen || ''} onChange={(e) => setRow(i, 'ma_truyen', e.target.value)} style={{ marginBottom: 0 }}>
                          <option value="">-- Truyện --</option>
                          {truyenList.map((t) => <option key={t.id} value={t.id}>{t.ten_truyen}</option>)}
                        </select>
                      </td>
                      <td><BanSaoPicker truyenId={r.ma_truyen} value={r.ma_ban_sao} onPick={(id) => setRow(i, 'ma_ban_sao', id)} /></td>
                      <td><input type="number" min="0" value={r.diem_su_dung || 0} onChange={(e) => setRow(i, 'diem_su_dung', e.target.value)} style={{ marginBottom: 0 }} /></td>
                      <td><button type="button" className="small danger" onClick={() => setForm({ ...form, rows: form.rows.filter((_, idx) => idx !== i) })}>Bỏ</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="secondary small" onClick={() => setForm({ ...form, rows: [...form.rows, { ma_truyen: '', ma_ban_sao: '', diem_su_dung: 0 }] })}>+ Thêm dòng</button>
            </div>
            <div className="full toolbar" style={{ marginTop: 16 }}>
              <button type="submit">Xác nhận & thu tiền</button>
              <button type="button" className="secondary" onClick={() => setShow(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Khách</th><th>Nhân viên</th><th>Ngày bán</th><th>Số đầu</th><th>Tổng thu</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.ten_khach}</td><td>{p.ma_nhan_vien}</td>
                <td>{fmtDate(p.ngay_ban)}</td><td>{p.so_dau}</td><td>{fmt(p.tong_tien)}₫</td>
                <td><Badge type="trang_thai_pb" value={p.trang_thai} /></td>
                <td>{p.trang_thai === 'hoat_dong' && <button className="small danger" onClick={() => huyPhieu(p)}>Hủy phiếu</button>}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={8} className="empty">Chưa có phiếu bán</td></tr>}
          </tbody>
        </table>
      </div>

      {lyDoTarget && (
        <div className="modal-overlay" onClick={() => setLyDoTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Hủy phiếu bán #{lyDoTarget.id}</h4>
            <p className="muted">Hủy phiếu sẽ trả bản sao về kho và hoàn/thu hồi điểm (nếu khách có tài khoản). Vui lòng ghi rõ lý do.</p>
            <input autoFocus value={lyDoHop} onChange={(e) => setLyDoHop(e.target.value)} placeholder="Lý do hủy (bắt buộc): VD khách trả lại, chọn nhầm, ..." />
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
    api.get(`/truyen/${truyenId}`).then((r) => setBs(r.data.ban_sao.filter((b) => ['san_sang', 'dang_giu'].includes(b.trang_thai)))).catch(() => setBs([]));
  }, [truyenId]);
  return (
    <select value={value} onChange={(e) => e.target.value && onPick(e.target.value)} style={{ marginBottom: 0 }}>
      <option value="">-- Bản sao --</option>
      {bs.map((b) => <option key={b.id} value={b.id}>{b.ma_ban_sao} ({b.trang_thai === 'dang_giu' ? 'đang giữ' : b.trang_thai})</option>)}
    </select>
  );
}