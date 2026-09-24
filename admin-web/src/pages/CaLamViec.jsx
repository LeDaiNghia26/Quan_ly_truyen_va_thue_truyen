import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate } from '../ui';

export default function CaLamViec() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.user?.vai_tro;
  const [ca, setCa] = useState(null);        // ca đang mở của bản thân (staff) / null
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [moModal, setMoModal] = useState(false);
  const [chotModal, setChotModal] = useState(null); // { ca, ly_do, thuc_te }
  const [result, setResult] = useState(null);       // kết quả chốt để in phiếu

  async function load() {
    try {
      const [r1, r2] = await Promise.all([api.get('/ca-lam-viec/hien-tai'), api.get('/ca-lam-viec')]);
      setCa(r1.data);
      setList(r2.data);
    } catch (e) { setMsg(getErrorMessage(e)); }
  }
  useEffect(() => { load(); }, []);

  async function moCa(v) {
    setBusy(true); setMsg('');
    try {
      await api.post('/ca-lam-viec', { tien_mat_dau_ca: Number(v) });
      setMoModal(false);
      await load();
    } catch (e) { setMsg(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  async function chotCa() {
    if (!chotModal) return;
    const t = Number(chotModal.thuc_te);
    if (Number.isNaN(t) || t < 0) { setMsg('Số tiền mặt thực tế không hợp lệ.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await api.post(`/ca-lam-viec/${chotModal.ca.id}/chot`, { tien_mat_thuc_te: t, ghi_chu: chotModal.ly_do || null });
      setResult({ ...r.data, ca: { ...chotModal.ca, tien_mat_thuc_te: t }, ghi_chu: chotModal.ly_do || '' });
      setChotModal(null);
      await load();
    } catch (e) { setMsg(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  function inPhieu() {
    if (!result) return;
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const c = result.ca;
    const html = `<html><head><meta charset="utf-8"><title>Phiếu bàn giao ca</title><style>
      body{font-family:Consolas,monospace;width:320px;margin:0 auto;padding:14px;font-size:13px;color:#111}
      h2{text-align:center;margin:4px 0}h3{text-align:center;margin:2px 0 8px;font-weight:normal}
      .line{border-top:1px dashed #444;margin:8px 0}table{width:100%}td{padding:3px 0}.r{text-align:right}
    </style></head><body>
      <h2>📚 Quản lý truyện</h2>
      <h3>PHIẾU BÀN GIAO CA #${c.id}</h3>
      <div>Nhân viên: <b>${esc(c.ho_ten)}</b></div>
      <div>Mở ca: ${fmtDate(c.thoi_gian_mo)}</div>
      <div>Chốt ca: ${fmtDate(c.thoi_gian_chot)}</div>
      <div class="line"></div>
      <table>
        <tr><td>Tiền mặt đầu ca</td><td class="r">${fmt(c.tien_mat_dau_ca)}₫</td></tr>
        <tr><td>Tiền mặt thu vào két</td><td class="r">${fmt(result.tong_tien_mat_thu)}₫</td></tr>
        <tr><td>Tiền mặt chi ra (hoàn cọc)</td><td class="r">${fmt(result.tong_tien_mat_chi)}₫</td></tr>
        <tr><td><b>Tiền mặt kỳ vọng</b></td><td class="r"><b>${fmt(result.tien_mat_ky_vong)}₫</b></td></tr>
        <tr><td>Tiền mặt thực tế</td><td class="r">${fmt(c.tien_mat_thuc_te)}₫</td></tr>
        <tr><td><b>Chênh lệch</b></td><td class="r"><b>${fmt(result.chenh_lech)}₫</b></td></tr>
      </table>
      ${Number(result.tong_tien_chuyen_khoan_thu) > 0 || Number(result.tong_tien_chuyen_khoan_chi) > 0 ? `
      <div class="line"></div>
      <table>
        <tr><td>Thu chuyển khoản</td><td class="r">${fmt(result.tong_tien_chuyen_khoan_thu)}₫</td></tr>
        <tr><td>Chi chuyển khoản (hoàn cọc)</td><td class="r">${fmt(result.tong_tien_chuyen_khoan_chi)}₫</td></tr>
      </table>` : ''}
      ${result.ghi_chu ? `<div class="line"></div><div>Ghi chú: ${esc(result.ghi_chu)}</div>` : ''}
      <div class="line"></div>
      <div style="text-align:center">Ký nhận: _______________</div>
      <div class="muted" style="font-size:11px;text-align:center;margin-top:6px">Tiền cọc là khoản phải trả khách, chưa được tính là doanh thu.</div>
    </body></html>`;
    const w = window.open('', '_blank', 'width=380,height=640');
    if (!w) { alert('Trình duyệt chặn cửa sổ in. Hãy cho phép popup.'); return; }
    w.document.write(html);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  }

  const coTheChot = (c) => c.trang_thai === 'mo' && (role === 'admin' || c.ma_nhan_vien === ca?.ma_nhan_vien);

  return (
    <div>
      <div className="toolbar">
        <h3>⚙️ Ca làm việc</h3>
        {!ca && <button disabled={busy} onClick={() => setMoModal(true)}>+ Mở ca mới</button>}
        <button className="secondary small" onClick={load}>⟳ Làm mới</button>
      </div>
      {msg && <div className="msg err">{msg}</div>}

      {ca ? (
        <div className="card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="toolbar">
            <b className="badge b-green">● Ca # {ca.id} đang mở — {ca.ho_ten || 'Bạn'}</b>
            <span className="muted" style={{ marginLeft: 6 }}>Mở lúc: {fmtDate(ca.thoi_gian_mo)}</span>
            <button className="primary" style={{ marginLeft: 'auto' }} disabled={busy}
              onClick={() => setChotModal({ ca, thuc_te: '', ly_do: '' })}>🔒 Chốt ca</button>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
            <div>Tiền mặt đầu ca<br /><b>{fmt(ca.tien_mat_dau_ca)}₫</b></div>
            <div>Tiền mặt thu vào két<br /><b className="b-green">+{fmt(ca.tong_tien_mat_thu)}₫</b></div>
            <div>Tiền mặt chi ra<br /><b className="b-red">−{fmt(ca.tong_tien_mat_chi)}₫</b></div>
            <div>Tiền mặt kỳ vọng<br /><b>{fmt(ca.tien_mat_ky_vong)}₫</b></div>
            {Number(ca.tong_tien_chuyen_khoan_thu) > 0 && <div>Thu chuyển khoản<br /><b className="b-green">+{fmt(ca.tong_tien_chuyen_khoan_thu)}₫</b></div>}
            {Number(ca.tong_tien_chuyen_khoan_chi) > 0 && <div>Chi chuyển khoản<br /><b className="b-red">−{fmt(ca.tong_tien_chuyen_khoan_chi)}₫</b></div>}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Đây là <b>dòng tiền</b> thu vào/chi ra trong ca (đã gồm tiền cọc), dùng để đối soát két. Tiền cọc là khoản CHƯA tính doanh thu — doanh thu thực chỉ tính tiền thuê/bán.
          </div>
        </div>
      ) : (
        <div className="card msg" style={{ margin: 0, marginBottom: 12 }}>
          {role === 'admin' ? 'Đang xem danh sách ca làm việc của toàn hệ thống.' : 'Chưa có ca nào đang mở. Hãy mở ca trước khi lập phiếu tại POS.'}
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr><th>Ca</th><th>Nhân viên</th><th>Mở ca</th><th>Đầu ca</th><th>Thu TM</th><th>Chi TM</th><th>Thu CK</th><th>Chi CK</th><th>Kỳ vọng</th><th>Thực tế</th><th>Chênh lệch</th><th>Chốt ca</th><th>Ghi chú</th><th>TT</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td><b>#{c.id}</b></td>
                <td>{c.ho_ten}</td>
                <td>{fmtDate(c.thoi_gian_mo)}</td>
                <td>{fmt(c.tien_mat_dau_ca)}₫</td>
                <td>{fmt(c.tong_tien_mat_thu)}₫</td>
                <td>{fmt(c.tong_tien_mat_chi)}₫</td>
                <td>{Number(c.tong_tien_chuyen_khoan_thu) > 0 ? fmt(c.tong_tien_chuyen_khoan_thu) + '₫' : '—'}</td>
                <td>{Number(c.tong_tien_chuyen_khoan_chi) > 0 ? fmt(c.tong_tien_chuyen_khoan_chi) + '₫' : '—'}</td>
                <td>{c.tien_mat_ky_vong != null ? fmt(c.tien_mat_ky_vong) + '₫' : '—'}</td>
                <td>{c.tien_mat_thuc_te != null ? fmt(c.tien_mat_thuc_te) + '₫' : '—'}</td>
                <td>
                  {c.chenh_lech != null
                    ? <b className={Number(c.chenh_lech) === 0 ? 'b-green' : 'b-red'}>{Number(c.chenh_lech) > 0 ? '+' : ''}{fmt(c.chenh_lech)}₫</b>
                    : '—'}
                </td>
                <td>{c.thoi_gian_chot ? fmtDate(c.thoi_gian_chot) : '—'}</td>
                <td style={{ maxWidth: 160 }}>{c.ghi_chu || '—'}</td>
                <td><span className={`badge ${c.trang_thai === 'mo' ? 'b-green' : 'b-gray'}`}>{c.trang_thai === 'mo' ? 'Mở' : 'Đã chốt'}</span></td>
                <td>
                  {coTheChot(c) && (
                    <button className="small danger" disabled={busy}
                      onClick={() => setChotModal({ ca: c, thuc_te: '', ly_do: '' })}>
                      Chốt ca
                    </button>
                  )}
                  {role === 'admin' && c.ma_nhan_vien !== ca?.ma_nhan_vien && c.trang_thai === 'mo' && (
                    <button className="small danger" disabled={busy} onClick={() => setChotModal({ ca: c, thuc_te: '', ly_do: '' })}>Chốt cưỡng chế</button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={15} className="empty">Chưa có ca làm việc.</td></tr>}
          </tbody>
        </table>
      </div>

      {moModal && (
        <div className="modal-overlay" onClick={() => setMoModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Mở ca làm việc</h4>
            <p className="muted">Nhập số tiền mặt có sẵn trong két đầu ca.</p>
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.target).get('dau_ca'); moCa(v); }}>
              <div><label>Tiền mặt đầu ca (₫)</label><input name="dau_ca" type="number" min="0" defaultValue="0" required autoFocus /></div>
              <div className="full toolbar">
                <button type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận mở ca'}</button>
                <button type="button" className="secondary" onClick={() => setMoModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {chotModal && (
        <div className="modal-overlay" onClick={() => setChotModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Chốt ca # {chotModal.ca.id}</h4>
            <p className="muted">Nhân viên {chotModal.ca.ho_ten} · Mở lúc {fmtDate(chotModal.ca.thoi_gian_mo)}.<br />
              {role === 'admin' && chotModal.ca.ma_nhan_vien !== ca?.ma_nhan_vien ? <b style={{ color: '#b91c1c' }}>Đây là thao tác chốt cưỡng chế.</b> : null}
            </p>
            <div className="form-grid">
              <div>Tiền mặt kỳ vọng trước khi chốt<br /><b>{fmt(chotModal.ca.tien_mat_ky_vong ?? 0)}₫</b></div>
              <div><label>Tiền mặt thực tế trong két (₫)</label><input autoFocus type="number" min="0" value={chotModal.thuc_te} onChange={(e) => setChotModal({ ...chotModal, thuc_te: e.target.value })} placeholder="0" /></div>
              <div className="full"><label>Ghi chú / lý do chênh lệch (nếu có)</label><input value={chotModal.ly_do} onChange={(e) => setChotModal({ ...chotModal, ly_do: e.target.value })} placeholder="VD: thối nhầm tiền lẻ, ..." /></div>
            </div>
            <div className="toolbar" style={{ marginTop: 14 }}>
              <button className="primary" disabled={busy} onClick={chotCa}>{busy ? 'Đang xử lý...' : 'Xác nhận chốt ca'}</button>
              <button className="secondary" onClick={() => setChotModal(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Ca # {result.ca.id} đã chốt</h4>
            <div className="form-grid">
              <div>Tiền mặt kỳ vọng<br /><b>{fmt(result.tien_mat_ky_vong)}₫</b></div>
              <div>Tiền mặt thực tế<br /><b>{fmt(result.ca.tien_mat_thuc_te)}₫</b></div>
              <div><b>Chênh lệch</b><br />
                <b className={Number(result.chenh_lech) === 0 ? 'b-green' : 'b-red'} style={{ fontSize: 18 }}>
                  {Number(result.chenh_lech) > 0 ? '+' : ''}{fmt(result.chenh_lech)}₫</b>
              </div>
              {Number(result.tong_tien_chuyen_khoan_thu) > 0 && <div>Thu chuyển khoản<br /><b className="b-green">+{fmt(result.tong_tien_chuyen_khoan_thu)}₫</b></div>}
              {Number(result.tong_tien_chuyen_khoan_chi) > 0 && <div>Chi chuyển khoản<br /><b className="b-red">−{fmt(result.tong_tien_chuyen_khoan_chi)}₫</b></div>}
              <div>{result.ghi_chu ? 'Ghi chú: ' + result.ghi_chu : 'Không có ghi chú.'}</div>
            </div>
            <div className="toolbar" style={{ marginTop: 14 }}>
              <button onClick={inPhieu}>🖨 In phiếu bàn giao ca</button>
              <button className="secondary" onClick={() => setResult(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}