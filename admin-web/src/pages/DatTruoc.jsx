import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { Badge, fmt, fmtDate } from '../ui';

const TRANG_THAI_KEYS = ['cho_nhan', 'da_xac_nhan', 'da_huy', 'qua_han'];
const TT_LABEL = {
  cho_nhan: 'Chờ nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_huy: 'Đã hủy',
  qua_han: 'Quá hạn',
};

export default function DatTruoc() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [active, setActive] = useState('cho_nhan');
  const [scan, setScan] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [lyDoHop, setLyDoHop] = useState('');
  const [lyDoMsg, setLyDoMsg] = useState('');
  const [busyLyDo, setBusyLyDo] = useState(false);
  // Giá trị quy đổi điểm lấy từ cấu hình server (không hardcode 200).
  const [tienMoiDiem, setTienMoiDiem] = useState(200);

  async function load() {
    try { const r = await api.get('/dat-truoc'); setItems(r.data); } catch (e) { setMsg(getErrorMessage(e)); }
  }
  useEffect(() => {
    load();
    api.get('/cau-hinh').then((r) => {
      const qd = (r.data.quy_doi || []).find((x) => x.ten_quy_tac === 'tien_moi_diem');
      if (qd) setTienMoiDiem(Number(qd.gia_tri) || 200);
    }).catch(() => {});
  }, []);

  const counted = useMemo(() => {
    const c = {};
    for (const k of TRANG_THAI_KEYS) c[k] = items.filter((i) => i.trang_thai === k).length;
    return c;
  }, [items]);

  const list = items.filter((i) => i.trang_thai === active);

  async function openDetail(id) {
    setScan('');
    setMsg('');
    try {
      const r = await api.get(`/dat-truoc/${id}`);
      setDetail(r.data);
    } catch (e) { setMsg(getErrorMessage(e)); }
  }

  async function onScanEnter(e) {
    if (e.key !== 'Enter') return;
    const raw = scan.trim();
    if (!raw) return;
    const id = String(raw).replace(/[^0-9]/g, '').slice(0, 8);
    if (!id) { setMsg('Không đọc được mã.'); return; }
    await openDetail(id || 0);
    const found = items.find((i) => String(i.id) === String(Number(id) || id));
    if (found) setActive(found.trang_thai);
  }

  const [huyOpen, setHuyOpen] = useState(false);

  async function huyDon() {
    if (!detail || detail.trang_thai !== 'cho_nhan') return;
    setHuyOpen(true);
    setLyDoHop('');
    setLyDoMsg('');
  }

  async function xacNhanHuyDon() {
    const lyDo = (lyDoHop || '').trim();
    if (!lyDo) { setLyDoMsg('Vui lòng nhập lý do hủy đơn đặt trước.'); return; }
    setBusyLyDo(true);
    try {
      await api.post(`/dat-truoc/${detail.id}/huy`, { ly_do: lyDo });
      setHuyOpen(false);
      setMsg('Đã hủy đơn. Bản sao được trả về kho.');
      setDetail(null); await load();
    } catch (e) { setLyDoMsg(getErrorMessage(e)); }
    finally { setBusyLyDo(false); }
  }

  async function autoExpire() {
    setBusy(true);
    try {
      const r = await api.get('/dat-truoc/auto-expire');
      setMsg(r.data.message); await load();
    } catch (e) { setMsg(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="toolbar">
        <h3>📅 Xử lý đặt trước tại quầy</h3>
        <input value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={onScanEnter}
          placeholder="Quét QR / nhập mã đơn rồi Enter" style={{ margin: 0, width: 240 }} />
        <button className="secondary" disabled={busy} onClick={autoExpire}>Xử lý đơn quá hạn</button>
      </div>
      {msg && <div className="msg">{msg}</div>}

      <div className="toolbar">
        {TRANG_THAI_KEYS.map((k) => (
          <button key={k} className={active === k ? 'primary small' : 'secondary small'} onClick={() => setActive(k)}>
            {TT_LABEL[k]} ({counted[k] || 0})
          </button>
        ))}
      </div>

      <div className="pos-grid">
        <div className="card">
          <table>
            <thead><tr><th>ID</th><th>Khách</th><th>Loại</th><th>Truyện</th><th>Hạn nhận</th><th></th></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} style={{ background: detail?.id === d.id ? '#eef2ff' : undefined }}>
                  <td>{d.id}</td>
                  <td>{d.ho_ten}</td>
                  <td><Badge type="loai" value={d.loai} /></td>
                  <td>{d.danh_sach_truyen}</td>
                  <td>{fmtDate(d.han_nhan)}</td>
                  <td><button className="small" onClick={() => openDetail(d.id)}>Xem / xử lý</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="empty">Không có đơn ở trạng thái này.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          {!detail ? (
            <p className="empty">Quét mã đơn hoặc bấm "Xem / xử lý" để mở chi tiết.<br /><small className="muted">Mã QR trên app khách hàng chứa số đơn đặt trước.</small></p>
          ) : (
            <>
              <h4>Đơn # {detail.id} — <Badge type="trang_thai_dt" value={detail.trang_thai} /></h4>
              <div className="form-grid">
                <div>Khách: <b>{detail.ho_ten}</b></div>
                <div>Loại: <Badge type="loai" value={detail.loai} /></div>
                <div>Hạng / điểm: <b>{detail.hang_thanh_vien}</b> / <b>{detail.diem_tich_luy}đ</b></div>
                <div>Hạn nhận: <b>{fmtDate(detail.han_nhan)}</b> {detail.khung_gio && <b>({detail.khung_gio})</b>}</div>
              </div>
              {detail.diem_su_dung > 0 && <p className="msg ok" style={{ margin: '10px 0' }}>Khách cam kết dùng <b>{detail.diem_su_dung} điểm</b> khi mua (giảm {fmt(detail.diem_su_dung * tienMoiDiem)}đ).</p>}
              {Number(detail.gia_goc || 0) > 0 && detail.loai === 'thue' && (
                <p className="msg ok" style={{ margin: '10px 0' }}>
                  Giá thuê cam kết: <b>{fmt(Math.max(0, Number(detail.gia_goc) - Number(detail.so_tien_giam || 0)))}₫</b>
                  {Number(detail.so_tien_giam) > 0 && <> (đã trừ voucher {fmt(detail.so_tien_giam)}₫)</>}
                  {' '}· Cọc: <b>{fmt(detail.tien_coc || 0)}₫</b>
                </p>
              )}
              {Number(detail.gia_goc || 0) > 0 && detail.loai === 'mua' && (
                <p className="msg ok" style={{ margin: '10px 0' }}>
                  Cam kết lúc đặt: giá gốc <b>{fmt(detail.gia_goc)}₫</b> - <b>{Number(detail.phan_tram_giam_hang) || 0}%</b> hạng
                  {Number(detail.so_tien_giam) > 0 && <> - voucher {fmt(detail.so_tien_giam)}₫</>}
                  {Number(detail.diem_su_dung) > 0 && <> - {detail.diem_su_dung} điểm</>}
                </p>
              )}

              <table>
                <thead><tr><th>Bản sao đang giữ</th><th>Truyện</th><th>Giá thuê</th><th>Giá bán</th></tr></thead>
                <tbody>
                  {(detail.chi_tiet || []).map((ct) => (
                    <tr key={ct.ma_ban_sao}>
                      <td><b>{ct.ma_ban_sao_str}</b></td>
                      <td>{ct.ten_truyen}</td>
                      <td>{fmt(ct.gia_thue)}₫</td>
                      <td>{fmt(ct.gia_ban)}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="toolbar" style={{ marginTop: 16 }}>
                {detail.trang_thai === 'cho_nhan' && (
                  <>
                    <button className="primary" disabled={busy} onClick={() => navigate(`/pos?don=${detail.id}`)}>
                      ➜ Chuyển thành Phiếu {detail.loai === 'thue' ? 'Thuê' : 'Bán'}
                    </button>
                    <button className="small danger" disabled={busy} onClick={huyDon}>Hủy đơn</button>
                  </>
                )}
                {detail.trang_thai !== 'cho_nhan' && <span className="muted">Đơn không còn ở trạng thái chờ nhận.</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {huyOpen && (
        <div className="modal-overlay" onClick={() => setHuyOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Hủy đơn đặt trước #{detail?.id} ({detail?.ho_ten})</h4>
            <p className="muted">Bản sao sẽ được trả về kho để cho mượn/cho mua lại. Vui lòng ghi rõ lý do.</p>
            <input autoFocus value={lyDoHop} onChange={(e) => setLyDoHop(e.target.value)} placeholder="Lý do hủy (bắt buộc): VD khách không lấy, thao tác nhầm, ..." />
            {lyDoMsg && <div className="msg err">{lyDoMsg}</div>}
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button className="danger" disabled={busyLyDo} onClick={xacNhanHuyDon}>{busyLyDo ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}</button>
              <button className="secondary" onClick={() => setHuyOpen(false)}>Thoát</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}