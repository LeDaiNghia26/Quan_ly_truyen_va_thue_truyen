import React, { useEffect, useMemo, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate, Badge } from '../ui';

const PHI_TRE_NGAY = 2000;

function beep(kind = 'ok') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    if (kind === 'err') { osc.frequency.value = 220; gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); osc.start(); osc.stop(ctx.currentTime + 0.4); }
    else { osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.09); gain.gain.setValueAtTime(0.25, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); osc.start(); osc.stop(ctx.currentTime + 0.35); }
  } catch (e) {}
}

export default function PhieuTra() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [scan, setScan] = useState('');
  const [kw, setKw] = useState('');
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [tts, setTts] = useState({});    // id -> tinh_trang_nhan
  const [customPhi, setCustomPhi] = useState({}); // id -> số tiền phạt nhập tay
  const [ghichus, setGhichus] = useState({});
  const [pt, setPt] = useState('tien_mat');
  const [baoMatTarget, setBaoMatTarget] = useState(null);
  const [lyDoBaoMat, setLyDoBaoMat] = useState('');
  const [baoMatMsg, setBaoMatMsg] = useState('');
  const [baoMatPT, setBaoMatPT] = useState('tien_mat');
  const scanRef = useRef(null);

  useEffect(() => { scanRef.current?.focus(); load(); loadHistory(); }, []);

  async function load() {
    setLoading(true); setMsg('');
    try {
      const r = await api.get('/phieu-tra/dang-thue');
      setRows(r.data);
    } catch (e) { setMsg(getErrorMessage(e)); }
    finally { setLoading(false); }
  }
  async function loadHistory() {
    try { const r = await api.get('/phieu-tra'); setHistory(r.data); } catch (e) {}
  }

  const list = useMemo(() => {
    const q = kw.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.ma_ban_sao || '').toLowerCase().includes(q) ||
      (r.ten_khach || '').toLowerCase().includes(q) ||
      (r.so_dien_thoai || '').toLowerCase().includes(q)
    );
  }, [rows, kw]);

  async function onScanEnter(e) {
    if (e.key !== 'Enter') return;
    const ma = scan.trim().toUpperCase();
    if (!ma) return;
    const found = rows.find((r) => r.ma_ban_sao.toUpperCase() === ma);
    if (!found) { beep('err'); setMsg(`Không tìm thấy bản sao "${ma}" đang được thuê.`); return; }
    setKw(ma);
    setActive(true);
    beep('ok');
    setMsg(`Đã tìm thấy: ${found.ten_truyen} — khách: ${found.ten_khach}`);
    setScan('');
  }

  function tinhTruoc(r) {
    const tt = tts[r.ma_chi_tiet_phieu_thue] || 'tot';
    let phi = 0, tre = 0;
    if (r.so_ngay_tre && r.so_ngay_tre > 0) {
      tre = Number(r.so_ngay_tre) * PHI_TRE_NGAY;
      phi += tre;
    }
    if (tt === 'hu_nhe') {
      const c = Number(customPhi[r.ma_chi_tiet_phieu_thue]);
      phi += (c && c > 0) ? c : 20000;
    }
    if (tt === 'hu_nang_mat') phi += Number(r.gia_ban || 0);
    return { phi, tre, tonThat: phi - tre };
  }

  async function traSach(r) {
    const tt = tts[r.ma_chi_tiet_phieu_thue] || 'tot';
    const body = { ma_chi_tiet_phieu_thue: r.ma_chi_tiet_phieu_thue, tinh_trang_nhan: tt, ghi_chu: ghichus[r.ma_chi_tiet_phieu_thue] || null, phuong_thuc_thanh_toan: pt };
    if (tt === 'hu_nhe') {
      const c = Number(customPhi[r.ma_chi_tiet_phieu_thue]);
      if (c && c > 0) body.phi_phat_sinh = c;
    }
    setBusy(true); setMsg('');
    try {
      const res = await api.post('/phieu-tra', body);
      beep('ok');
      setReceipt({ khach: r.ten_khach, ma_ban_sao: r.ma_ban_sao, ten_truyen: r.ten_truyen, tt, phi: res.data.phi_phat_sinh, tre: res.data.so_ngay_tre, hoan_coc: res.data.so_tien_hoan_coc, tra_them: res.data.so_tien_khach_tra_them, pt });
      await load(); await loadHistory();
    } catch (e) { beep('err'); setMsg(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  async function moBaoMat(r) {
    if (r.trang_thai_ct === 'mat') return;
    setBaoMatTarget(r);
    setLyDoBaoMat('');
    setBaoMatMsg('');
  }

  async function xacNhanBaoMat() {
    if (!baoMatTarget) return;
    const ld = (lyDoBaoMat || '').trim();
    if (!ld) { setBaoMatMsg('Vui lòng nhập lý do báo mất (VD: khách xác nhận làm mất, điều tra xác nhận...).'); return; }
    setBusy(true);
    try {
      await api.post('/phieu-tra/bao-mat', { ma_chi_tiet_phieu_thue: baoMatTarget.ma_chi_tiet_phieu_thue, ghi_chu: ld, phuong_thuc_thanh_toan: baoMatPT });
      beep('ok');
      setBaoMatTarget(null);
      await load(); await loadHistory();
    } catch (e) { beep('err'); setBaoMatMsg(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>📥 Nhận trả & Xử lý vi phạm</h3>
        <button className={active ? 'primary small' : 'secondary small'} disabled={busy} onClick={() => { setActive(true); load(); }}>Đang thuê ({rows.length})</button>
        <button className={!active ? 'primary small' : 'secondary small'} onClick={() => { setActive(false); loadHistory(); }}>Lịch sử trả</button>
        <button className="secondary small" onClick={() => { load(); loadHistory(); }}>⟳ Làm mới</button>
        <select value={pt} onChange={(e) => setPt(e.target.value)} style={{ width: 170 }} title="Phương thức thanh toán phụ phí / hoàn cọc">
          <option value="tien_mat">💵 PT: Tiền mặt</option>
          <option value="chuyen_khoan">🏦 PT: Chuyển khoản</option>
        </select>
      </div>

      <div className="card">
        <div className="form-grid">
          <div>
            <label>Quét mã bản sao trả (Enter)</label>
            <input ref={scanRef} value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={onScanEnter} placeholder="VD: DRM-001" autoFocus />
          </div>
          {active && <div>
            <label>Hoặc tìm khách / mã / SĐT</label>
            <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tên khách, SĐT, mã bản sao..." />
          </div>}
        </div>
        {msg && <div className={`msg ${msg.startsWith('Không') ? 'err' : ''}`}>{msg}</div>}

        {active ? (
          <>
            {list.length === 0 && <p className="empty">{loading ? 'Đang tải...' : 'Không có sách nào đang thuê.'}</p>}
            {list.map((r) => {
              const tinh = tinhTruoc(r);
              const tt = tts[r.ma_chi_tiet_phieu_thue] || 'tot';
              return (
                <div key={r.ma_chi_tiet_phieu_thue} className="card" style={{ padding: 14 }}>
                  <div className="toolbar" style={{ marginBottom: 8 }}>
                    <b>{r.ma_ban_sao}</b>
                    <Badge type="trang_thai_nhan" value={tt} />
                    <span className="muted" style={{ marginLeft: 6 }}>{r.ten_truyen}</span>
                    {r.so_ngay_tre > 0 && <Badge type="trang_thai_nhan" value={'tre_han'} />}
                    <span style={{ marginLeft: 'auto' }} className="muted">
                      Hẹn trả: {r.ngay_hen_tra} · {r.so_ngay_tre > 0
                        ? <b style={{ color: '#b91c1c' }}>Trễ {r.so_ngay_tre} ngày</b>
                        : <span>còn hạn</span>}
                    </span>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto auto', alignItems: 'end', gap: '0 12px' }}>
                    <div>
                      <label>Tình trạng nhận</label>
                      <select value={tt} onChange={(e) => setTts({ ...tts, [r.ma_chi_tiet_phieu_thue]: e.target.value })}>
                        <option value="tot">Bình thường</option>
                        <option value="tre_han">Trễ hạn</option>
                        <option value="hu_nhe">Hư nhẹ</option>
                        <option value="hu_nang_mat">Hư nặng / Mất</option>
                      </select>
                    </div>
                    {tt === 'hu_nhe' && <div>
                      <label>Phí sửa (₫, trống = 20.000)</label>
                      <input type="number" min="0" placeholder="20000" value={customPhi[r.ma_chi_tiet_phieu_thue] || ''} onChange={(e) => setCustomPhi({ ...customPhi, [r.ma_chi_tiet_phieu_thue]: e.target.value })} />
                    </div>}
                    {tt === 'hu_nang_mat' && <div><label>Bồi thường 100% giá bán</label><div style={{ fontWeight: 700, paddingBottom: 12 }}>{fmt(r.gia_ban)}₫</div></div>}
                    <div>
                      <label>Ghi chú (nếu có)</label>
                      <input value={ghichus[r.ma_chi_tiet_phieu_thue] || ''} onChange={(e) => setGhichus({ ...ghichus, [r.ma_chi_tiet_phieu_thue]: e.target.value })} placeholder="..." />
                    </div>
                    <div style={{ textAlign: 'right', paddingBottom: 12 }}>
                      <div className="muted">Tổng phát sinh dự kiến</div>
                      <b style={{ color: tinh.phi > 0 ? '#b91c1c' : '#166534', fontSize: 16 }}>{fmt(tinh.phi)}₫</b>
                      {tinh.tre > 0 && <div className="muted">(trong đó trễ: {fmt(tinh.tre)}₫)</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, paddingBottom: 12 }}>
                      <button className="primary small" disabled={busy} onClick={() => traSach(r)}>✔ Nhận trả</button>
                      <button className="small danger" disabled={busy || tt !== 'tot'} onClick={() => moBaoMat(r)}>Báo mất</button>
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    Cọc đã thu: <b>{fmt(r.tien_coc)}₫</b> ·
                    hoàn cọc dự kiến: <b className={tinh.phi > Number(r.tien_coc) ? '' : 'b-green'}>{fmt(Math.max(0, Number(r.tien_coc) - tinh.phi))}₫</b>
                    {tinh.phi > Number(r.tien_coc) && <span style={{ color: '#b91c1c' }}> · khách trả thêm: {fmt(tinh.phi - Number(r.tien_coc))}₫</span>}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <table>
            <thead><tr><th>Mã bản sao</th><th>Truyện</th><th>Khách</th><th>Ngày trả</th><th>Tình trạng</th><th>Phí phát sinh</th><th>Hoàn cọc</th><th>Khách trả thêm</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td><b>{h.ma_ban_sao_str}</b></td>
                  <td>{h.ten_truyen}</td>
                  <td>{h.ten_khach}</td>
                  <td>{fmtDate(h.ngay_tra)}</td>
                  <td><Badge type="trang_thai_nhan" value={h.tinh_trang_nhan} /></td>
                  <td>{h.phi_phat_sinh > 0 ? <b style={{ color: '#b91c1c' }}>{fmt(h.phi_phat_sinh)}₫</b> : <span className="muted">0₫</span>}</td>
                  <td>{Number(h.so_tien_hoan_coc) > 0 ? <b className="b-green">{fmt(h.so_tien_hoan_coc)}₫</b> : <span className="muted">0₫</span>}</td>
                  <td>{Number(h.so_tien_khach_tra_them) > 0 ? <b style={{ color: '#b91c1c' }}>{fmt(h.so_tien_khach_tra_them)}₫</b> : <span className="muted">0₫</span>}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={8} className="empty">Chưa có phiếu trả nào.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {receipt && (
        <div className="modal-overlay" onClick={() => setReceipt(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Biên lai trả sách</h3>
            <div className="form-grid">
              <div>Bản sao: <b>{receipt.ma_ban_sao}</b></div>
              <div>Truyện: <b>{receipt.ten_truyen}</b></div>
              <div>Khách: <b>{receipt.khach}</b></div>
              <div>Tình trạng: <Badge type="trang_thai_nhan" value={receipt.tt} /></div>
              {Number(receipt.tre) > 0 && <div>Trễ: <b>{receipt.tre} ngày</b></div>}
              <div>Phí phát sinh: <b style={{ color: '#b91c1c' }}>{fmt(receipt.phi)}₫</b></div>
              <div>Khách nhận lại (hoàn cọc): <b className="b-green">{fmt(receipt.hoan_coc)}₫</b></div>
              <div>Khách trả thêm: <b style={Number(receipt.tra_them) > 0 ? { color: '#b91c1c' } : undefined}>{fmt(receipt.tra_them)}₫</b></div>
              <div>Thanh toán: <b>{receipt.pt === 'chuyen_khoan' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}</b></div>
            </div>
            <div className="toolbar" style={{ marginTop: 14 }}>
              <button onClick={() => {
                const w = window.open('', '_blank', 'width=360,height=520');
                const html = `PHIẾU NHẬN TRẢ SÁCH\nBản sao: ${receipt.ma_ban_sao}\nTruyện: ${receipt.ten_truyen}\nKhách: ${receipt.khach}\nTình trạng: ${receipt.tt}\nPhí phát sinh: ${Number(receipt.phi).toLocaleString('vi-VN')}đ\nHoàn cọc: ${Number(receipt.hoan_coc).toLocaleString('vi-VN')}đ\nKhách trả thêm: ${Number(receipt.tra_them).toLocaleString('vi-VN')}đ\n${new Date().toLocaleString('vi-VN')}`;
                if (!w) { alert('Cho phép popup để in.'); return; }
                w.document.write(`<html><head><meta charset="utf-8"><title>Biên lai</title><style>pre{font-family:monospace;font-size:14px;margin:24px;white-space:pre-wrap}</style></head><body><pre>${html.replace(/</g, '&lt;')}</pre></body></html>`);
                w.document.close(); w.focus();
                setTimeout(() => w.print(), 250);
              }}>🖨 In biên lai</button>
              <button className="secondary" onClick={() => setReceipt(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {baoMatTarget && (
        <div className="modal-overlay" onClick={() => setBaoMatTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Báo mất "{baoMatTarget.ma_ban_sao}"</h4>
            <p className="muted">Khách sẽ bồi thường 100% giá bán ({fmt(baoMatTarget.gia_ban)}₫). Vui lòng nhập lý do báo mất — đây sẽ được ghi vào nhật ký hệ thống.</p>
            <input autoFocus value={lyDoBaoMat} onChange={(e) => setLyDoBaoMat(e.target.value)} placeholder="Lý do báo mất (bắt buộc): VD khách xác nhận làm mất, điều tra xác nhận..." />
            {baoMatMsg && <div className="msg err">{baoMatMsg}</div>}
            <label style={{ marginTop: 10 }}>Phương thức thanh toán phần chênh lệch sau bù trừ cọc</label>
            <select value={baoMatPT} onChange={(e) => setBaoMatPT(e.target.value)}>
              <option value="tien_mat">💵 Tiền mặt</option>
              <option value="chuyen_khoan">🏦 Chuyển khoản</option>
            </select>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button className="danger" disabled={busy} onClick={xacNhanBaoMat}>{busy ? 'Đang xử lý...' : 'Xác nhận báo mất'}</button>
              <button className="secondary" onClick={() => setBaoMatTarget(null)}>Thoát</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}