import React, { useState } from 'react';
import QRCode from 'qrcode';
import api, { getErrorMessage } from '../api';
import { Badge, fmt, fmtDate } from '../ui';

export default function HoTro() {
  const [tab, setTab] = useState('tim');
  const [form, setForm] = useState({ ho_ten: '', so_dien_thoai: '', email: '' });
  const [msg, setMsg] = useState('');
  const [created, setCreated] = useState(null);
  const [sdt, setSdt] = useState('');
  const [lichsu, setLichsu] = useState(null);
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function taoTaiKhoan(e) {
    e.preventDefault();
    setMsg(''); setBusy(true);
    try {
      const r = await api.post('/khach-hang/tao-tai-quay', form);
      setCreated(r.data);
      setForm({ ho_ten: '', so_dien_thoai: '', email: '' });
      let url;
      try { url = await QRCode.toDataURL(r.data.ma_thanh_vien, { width: 240, margin: 1 }); } catch (qerr) { url = null; }
      setQr(url);
    } catch (e2) { setMsg(getErrorMessage(e2)); }
    finally { setBusy(false); }
  }

  async function traCuu(e) {
    e.preventDefault();
    setMsg(''); setBusy(true);
    try {
      const r = await api.get('/khach-hang/lich-su', { params: { q: sdt } });
      setLichsu(r.data);
      if (r.data.khach) {
        try { setQr(await QRCode.toDataURL(sdt.replace(/[^0-9]/g, '').slice(-10), { width: 200, margin: 1 })); } catch (qerr) { setQr(null); }
      } else { setQr(null); }
    } catch (e2) { setMsg(getErrorMessage(e2)); }
    finally { setBusy(false); }
  }

  function inQR(khach, ma) {
    if (!qr) { alert('Không tạo được mã QR.'); return; }
    const w = window.open('', '_blank', 'width=320,height=420');
    if (!w) { alert('Cho phép popup để in.'); return; }
    const html = `<html><head><meta charset="utf-8"><title>Thẻ thành viên</title><style>
      body{font-family:Arial;display:flex;flex-direction:column;align-items:center;padding:24px;text-align:center}
      h2{margin:0 0 4px} img{max-width:220px;margin:12px 0} .muted{color:#555;font-size:13px}
    </style></head><body>
      <h2>📚 Thẻ thành viên</h2>
      <p class="muted">${khach || ''}</p>
      <img src="${qr}" alt="QR" />
      <p class="muted">Mã thành viên: <b>${ma}</b><br/>Xuất trình mã này khi thuê/mua tại quầy</p>
    </body></html>`;
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 250);
  }

  return (
    <div>
      <div className="toolbar">
        <h3>🤝 Hỗ trợ & Đăng ký khách tại quầy</h3>
        <button className={tab === 'tim' ? 'primary small' : 'secondary small'} onClick={() => setTab('tim')}>Tra cứu lịch sử</button>
        <button className={tab === 'tao' ? 'primary small' : 'secondary small'} onClick={() => setTab('tao')}>Tạo tài khoản nhanh</button>
      </div>
      {msg && <div className={`msg ${msg.includes('thành công') ? 'ok' : 'err'}`}>{msg}</div>}

      {tab === 'tao' && (
        <div className="card">
          <h4>Tạo tài khoản khách tại quầy</h4>
          <form onSubmit={taoTaiKhoan} className="form-grid">
            <div className="full"><label>Số điện thoại *</label><input required value={form.so_dien_thoai} onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })} placeholder="090xxxxxxx" /></div>
            <div className="full"><label>Họ và tên</label><input value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} placeholder="Tên khách" /></div>
            <div className="full"><label>Email (không bắt buộc)</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="khach@email.com" /></div>
            <div className="full toolbar"><button disabled={busy} type="submit">{busy ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              <span className="muted">Mật khẩu mặc định: <b>123456</b></span></div>
          </form>
          {created && (
            <div className="msg ok" style={{ marginTop: 12 }}>
              ✔ Đã tạo khách hàng <b>ID {created.id}</b> — SĐT <b>{created.ma_thanh_vien}</b>.
              {qr && <button className="small" style={{ marginLeft: 10 }} onClick={() => inQR('Khách hàng mới', created.ma_thanh_vien)}>🖨 In mã QR thành viên</button>}
            </div>
          )}
        </div>
      )}

      {tab === 'tim' && (
        <div className="card">
          <h4>Tra cứu lịch sử khách theo SĐT</h4>
          <form onSubmit={traCuu} className="form-grid">
            <div className="full toolbar">
              <input required value={sdt} onChange={(e) => setSdt(e.target.value)} placeholder="Nhập SĐT khách... (VD: 0900000003)" style={{ margin: 0, width: 260 }} />
              <button disabled={busy}>{busy ? 'Đang tra...' : 'Tra cứu'}</button>
            </div>
          </form>
          {lichsu && !lichsu.khach && <p className="msg">Không tìm thấy khách với SĐT này.</p>}
          {lichsu?.khach && (
            <>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <b>{lichsu.khach.ho_ten}</b> <Badge type="hang" value={lichsu.khach.hang_thanh_vien} />
                <span className="muted">{lichsu.khach.diem_tich_luy} điểm</span>
                {qr && <button className="small" style={{ marginLeft: 'auto' }} onClick={() => inQR(lichsu.khach.ho_ten, lichsu.khach.so_dien_thoai)}>🖨 In thẻ QR thành viên</button>}
              </div>
              <h4 style={{ marginTop: 12 }}>Lịch sử thuê ({lichsu.thue.length})</h4>
              <table>
                <thead><tr><th>Bản sao</th><th>Truyện</th><th>Ngày thuê</th><th>Hẹn trả</th><th>Đơn giá</th><th>Cọc</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {lichsu.thue.map((x) => (
                    <tr key={x.id}>
                      <td>{x.ma_ban_sao}</td><td>{x.ten_truyen}</td>
                      <td>{x.ngay_thue}</td><td>{x.ngay_hen_tra ? String(x.ngay_hen_tra).slice(0, 10) : '—'}</td>
                      <td>{fmt(x.don_gia)}₫</td><td>{fmt(x.tien_coc)}₫</td>
                      <td><Badge type="trang_thai_ct" value={x.trang_thai} /></td>
                    </tr>
                  ))}
                  {lichsu.thue.length === 0 && <tr><td colSpan={7} className="empty">Chưa có lịch sử thuê.</td></tr>}
                </tbody>
              </table>
              <h4 style={{ marginTop: 12 }}>Lịch sử trả ({lichsu.tra.length})</h4>
              <table>
                <thead><tr><th>Ngày trả</th><th>Truyện</th><th>Bản sao</th><th>Tình trạng</th><th>Phí phát sinh</th></tr></thead>
                <tbody>
                  {lichsu.tra.map((x, i) => (
                    <tr key={i}>
                      <td>{fmtDate(x.ngay_tra)}</td><td>{x.ten_truyen}</td><td>{x.ma_ban_sao}</td>
                      <td><Badge type="trang_thai_nhan" value={x.tinh_trang_nhan} /></td>
                      <td>{x.phi_phat_sinh > 0 ? <b style={{ color: '#b91c1c' }}>{fmt(x.phi_phat_sinh)}₫</b> : '0₫'}</td>
                    </tr>
                  ))}
                  {lichsu.tra.length === 0 && <tr><td colSpan={5} className="empty">Chưa có lịch sử trả.</td></tr>}
                </tbody>
              </table>
              <h4 style={{ marginTop: 12 }}>Lịch sử mua ({lichsu.mua.length})</h4>
              <table>
                <thead><tr><th>Ngày bán</th><th>Truyện</th><th>Bản sao</th><th>Giá gốc</th><th>Giảm</th><th>Thanh toán</th></tr></thead>
                <tbody>
                  {lichsu.mua.map((x, i) => (
                    <tr key={i}>
                      <td>{String(x.ngay_ban)}</td><td>{x.ten_truyen}</td><td>{x.ma_ban_sao}</td>
                      <td>{fmt(x.gia_goc)}₫</td><td>{fmt((x.thanh_tien || 0) > 0 ? Math.max(0, (x.gia_goc || 0) - (x.thanh_tien || 0)) : 0)}₫</td>
                      <td><b>{fmt(x.thanh_tien)}₫</b></td>
                    </tr>
                  ))}
                  {lichsu.mua.length === 0 && <tr><td colSpan={6} className="empty">Chưa có lịch sử mua.</td></tr>}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}