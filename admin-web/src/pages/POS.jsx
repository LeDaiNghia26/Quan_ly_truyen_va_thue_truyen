import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { fmt, fmtDate, Badge } from '../ui';

const HANG_NHAN = { thuong: 'Thường', than_thiet: 'Thân thiết', vip: 'VIP' };

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function beep(kind = 'ok') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    if (kind === 'err') {
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) { /* audio không khả dụng */ }
}

export default function POS() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const donTruoc = params.get('don');

  const [loai, setLoai] = useState('thue');
  const [khach, setKhach] = useState(null);
  const [sdtInput, setSdtInput] = useState('');
  const [khachLe, setKhachLe] = useState({ ten: '', sdt: '' });
  const [rows, setRows] = useState([]);
  const [suKiens, setSuKiens] = useState([]);
  const [maSuKien, setMaSuKien] = useState('');   // voucher áp cho cả phiếu
  const [maDatTruoc, setMaDatTruoc] = useState(null);
  const [dtKhoa, setDtKhoa] = useState(null);
  const [scan, setScan] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [tienTra, setTienTra] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [ca, setCa] = useState(null);
  const [phuongThuc, setPhuongThuc] = useState('tien_mat');
  const scanRef = useRef(null);

  // % giảm theo hạng và giá trị quy đổi điểm phải lấy từ cấu hình server.
  // Hardcode ở client làm số tiền hiển thị lệch với số tiền server thực tính khi lập phiếu.
  const [giamHangTheoHang, setGiamHangTheoHang] = useState({});
  const [tienMoiDiem, setTienMoiDiem] = useState(200);

  useEffect(() => { scanRef.current?.focus(); }, []);
  useEffect(() => {
    api.get('/su-kien-giam-gia/cong-khai').then((r) => setSuKiens(r.data.filter((s) => s.trang_thai === 'hoat_dong'))).catch(() => {});
    api.get('/ca-lam-viec/hien-tai').then((r) => setCa(r.data)).catch(() => {});
    api.get('/cau-hinh').then((r) => {
      const map = {};
      for (const t of (r.data.hang_thanh_vien || [])) map[t.ma_hang] = Number(t.phan_tram_giam) || 0;
      setGiamHangTheoHang(map);
      const qd = (r.data.quy_doi || []).find((x) => x.ten_quy_tac === 'tien_moi_diem');
      if (qd) setTienMoiDiem(Number(qd.gia_tri) || 200);
    }).catch(() => {});
  }, []);

  // Nạp đơn đặt trước khi mở từ màn hình Đặt trước
  useEffect(() => {
    if (!donTruoc) return;
    (async () => {
      try {
        const dt = (await api.get(`/dat-truoc/${donTruoc}`)).data;
        if (dt.trang_thai !== 'cho_nhan') { setMsg(`Đơn ${donTruoc} đã được xử lý (trạng thái: ${dt.trang_thai}).`); return; }
        setLoai(dt.loai);
        setMaDatTruoc(dt.id);
        // Giữ các giá trị đã khóa lúc đặt (gia_goc, so_tien_giam, phan_tram_giam_hang,
        // tien_coc, diem_su_dung) để số tiền hiển thị khớp với số tiền server sẽ tính.
        setDtKhoa({
          gia_goc: dt.gia_goc,
          so_tien_giam: dt.so_tien_giam,
          phan_tram_giam_hang: dt.phan_tram_giam_hang,
          tien_coc: dt.tien_coc,
          diem_su_dung: dt.diem_su_dung,
        });
        setMaSuKien(dt.ma_su_kien ? String(dt.ma_su_kien) : '');
        setKhach({ id: dt.ma_khach_hang, ho_ten: dt.ho_ten, hang_thanh_vien: dt.hang_thanh_vien, diem_tich_luy: dt.diem_tich_luy });
        const built = (dt.chi_tiet || []).map((ct, i) => ({
          ma_ban_sao: ct.ma_ban_sao,
          ma_ban_sao_str: ct.ma_ban_sao_str,
          ma_truyen: ct.ma_truyen,
          tap: ct.tap,
          ten_truyen: ct.ten_truyen,
          gia_thue: Number(ct.gia_thue || 0),
          gia_ban: Number(ct.gia_ban || 0),
          // Cọc và đơn giá phải lấy giá trị ĐÃ KHÓA lúc đặt, không phải giá hiện tại
          // của truyện (ct.* đến từ bảng truyen và sẽ đổi nếu quản trị sửa giá).
          tien_coc: Number(dt.tien_coc || ct.tien_coc || 0),
          don_gia: Number(dt.loai === 'thue' ? (dt.gia_goc ?? ct.gia_thue) : ct.gia_thue),
          ngay_hen_tra: todayPlus(3),
          diem_su_dung: i === 0 ? Number(dt.diem_su_dung || 0) : 0,
        }));
        for (const row of built) {
          try {
            // B7: cho đổi bản sao khác cùng truyện/tập đang sẵn sàng
            const bsList = (await api.get('/bansao', { params: { ma_truyen: row.ma_truyen } })).data;
            const held = bsList.find((b) => b.id === row.ma_ban_sao);
            const tap = held ? held.tap : row.tap;
            row.ban_sao_options = bsList.filter((b) => b.ma_truyen === row.ma_truyen && b.tap === tap && ['san_sang', 'dang_giu'].includes(b.trang_thai));
          } catch (e) { row.ban_sao_options = []; }
        }
        setRows(built);
        setMsg(`Đã nạp đơn đặt trước #${donTruoc} (${dt.loai === 'thue' ? 'Thuê' : 'Mua'}) — khách: ${dt.ho_ten}`);
      } catch (e) { setMsg(getErrorMessage(e)); }
    })();
  }, [donTruoc]);

  function addBanSao(bs) {
    if (!['san_sang', 'dang_giu'].includes(bs.trang_thai)) {
      beep('err'); setMsg(`Bản sao ${bs.ma_ban_sao} ở trạng thái "${bs.trang_thai}", không bán/thuê được.`); return;
    }
    if (rows.some((r) => r.ma_ban_sao === bs.id)) {
      beep('err'); setMsg(`Bản sao ${bs.ma_ban_sao} đã có trong giao dịch.`); return;
    }
    const giaThue = Number(bs.gia_thue || 0);
    const giaBan = Number(bs.gia_ban || 0);
    setRows((prev) => [...prev, {
      ma_ban_sao: bs.id,
      ma_ban_sao_str: bs.ma_ban_sao,
      ten_truyen: bs.ten_truyen,
      tac_gia: bs.tac_gia,
      gia_thue: giaThue,
      gia_ban: giaBan,
      tien_coc: Number(bs.tien_coc || bs.gia_ban || 0),
      don_gia: giaThue,
      ngay_hen_tra: todayPlus(3),
      diem_su_dung: 0,
    }]);
    beep('ok');
    setMsg('');
    setScan('');
    setTimeout(() => scanRef.current?.focus(), 50);
  }

  async function onScanEnter(e) {
    if (e.key !== 'Enter') return;
    const ma = scan.trim();
    if (!ma) return;
    try {
      const r = await api.get(`/bansao/tim-theo-ma/${encodeURIComponent(ma)}`);
      addBanSao(r.data);
    } catch (err) {
      const m = err.response?.data?.message || 'Không tìm thấy bản sao.';
      beep('err'); setMsg(m);
    }
  }

  async function timKhach() {
    const q = sdtInput.replace(/[^0-9]/g, '');
    if (q.length < 9) { setMsg('Nhập số điện thoại khách (9-10 số).'); return; }
    try {
      const r = await api.get('/khach-hang/tim', { params: { q } });
      if (!r.data) {
        setKhach(null);
        setKhachLe({ ...khachLe, sdt: q });
        setMsg(`Không tìm thấy tài khoản ${q}. Lập phiếu cho khách vãng lai?`);
        return;
      }
      setKhach(r.data);
      setKhachLe({ ten: '', sdt: '' });
      setMsg('');
      beep('ok');
    } catch (e) {
      setMsg(getErrorMessage(e));
      beep('err');
    }
  }

  // Ước tính giá/đơn thuê sau voucher (để hiển thị; hóa đơn lấy số liệu chính thức từ server)
  function giamVoucherTri(gia) {
    const sk = suKiens.find((s) => String(s.id) === String(maSuKien));
    if (!sk) return 0;
    const z = sk.kieu_giam === 'phan_tram' ? (gia * Number(sk.gia_tri)) / 100 : Number(sk.gia_tri);
    return Math.min(Math.max(z, 0), gia);
  }

  const totals = useMemo(() => {
    let tongCoc = 0, tongThu = 0;
    const hang = khach ? khach.hang_thanh_vien : null;
    // Đơn đặt trước đã khóa giá/giảm/điểm lúc đặt: hiển thị đúng những giá trị đó
    // (dt.* do server khóa), không tính lại theo cấu hình hiện tại.
    const giamHangLock = maDatTruoc ? Number(dtKhoa?.phan_tram_giam_hang || 0) : null;
    const diemDonLock = maDatTruoc ? Number(dtKhoa?.diem_su_dung || 0) : null;
    let diemConLai = Number(khach?.diem_tich_luy || 0);
    let diemDonConLai = diemDonLock;
    for (const r of rows) {
      tongCoc += Number(r.tien_coc || 0);
      if (loai === 'thue') {
        // Server (phieuThueController.js:138): donGia = gia_goc - so_tien_giam
        const giaGoc = maDatTruoc ? Number(dtKhoa?.gia_goc ?? r.gia_thue ?? 0) : Number(r.don_gia || 0);
        const giam = maDatTruoc
          ? Number(dtKhoa?.so_tien_giam || 0)
          : giamVoucherTri(Number(r.don_gia || 0));
        tongThu += Math.max(0, giaGoc - giam);
      } else {
        const giaGoc = maDatTruoc ? Number(dtKhoa?.gia_goc ?? r.gia_ban ?? 0) : Number(r.gia_ban || 0);
        const pct = giamHangLock !== null ? giamHangLock : (hang ? (giamHangTheoHang[hang] || 0) : 0);
        const giamHang = (giaGoc * pct) / 100;
        const giamSK = maDatTruoc
          ? Number(dtKhoa?.so_tien_giam || 0)
          : giamVoucherTri(giaGoc);
        let thanhTien = Math.max(0, giaGoc - giamHang - giamSK);
        // Server (phieuBanController.js:112-118): chỉ VIP, cap theo điểm khách,
        // số tiền còn lại và số điểm đã cam kết nếu là đơn đặt trước.
        let diem = 0;
        if (hang === 'vip') {
          const diemYeuCau = diemDonLock !== null ? diemDonConLai : Number(r.diem_su_dung || 0);
          const cap = Math.min(diemYeuCau, diemConLai, Math.floor(thanhTien / tienMoiDiem));
          diem = Math.max(0, cap);
          thanhTien = Math.max(0, thanhTien - diem * tienMoiDiem);
          diemConLai -= diem;
          if (diemDonConLai !== null) diemDonConLai -= diem;
        }
        tongThu += thanhTien;
      }
    }
    return { tongCoc, tongThu, tongTra: tongCoc + tongThu };
  }, [rows, loai, khach, maSuKien, suKiens, maDatTruoc, dtKhoa, giamHangTheoHang, tienMoiDiem]);

  function setRow(i, k, v) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  }

  async function hoanTat() {
    if (rows.length === 0) { setMsg('Chưa có bản sao nào.'); return; }
    if (!ca) { setMsg('Chưa mở ca làm việc. Hãy bấm "Mở ca" trước khi lập phiếu.'); return; }
    setBusy(true);
    setMsg('');
    try {
      const chung = {
        ma_dat_truoc: maDatTruoc,
        ma_khach_hang: khach ? khach.id : null,
        ten_khach_le: khach ? null : (khachLe.ten || null),
        sdt_khach_le: khach ? null : (khachLe.sdt || null),
        phuong_thuc_thanh_toan: phuongThuc,
      };
      let id;
      if (loai === 'thue') {
        const r = await api.post('/phieu-thue', {
          ...chung,
          ma_su_kien: maSuKien ? Number(maSuKien) : null,
          chi_tiet: rows.map((x) => ({
            ma_ban_sao: x.ma_ban_sao,
            don_gia: Number(x.don_gia || 0),
            tien_coc: Number(x.tien_coc || 0),
            ngay_hen_tra: x.ngay_hen_tra,
            tinh_trang_giao: 'moi',
            ma_su_kien: maSuKien ? Number(maSuKien) : undefined,
          })),
        });
        id = r.data.id;
      } else {
        const r = await api.post('/phieu-ban', {
          ...chung,
          ma_su_kien: maSuKien ? Number(maSuKien) : null,
          chi_tiet: rows.map((x) => ({ ma_ban_sao: x.ma_ban_sao, diem_su_dung: Number(x.diem_su_dung || 0) })),
        });
        id = r.data.id;
      }
      const phi = await (loai === 'thue' ? api.get(`/phieu-thue/${id}`) : api.get(`/phieu-ban/${id}`));
      beep('ok');
      setReceipt({ phi: phi.data, loai, phuong_thuc: phuongThuc });
      resetForm();
    } catch (e) {
      beep('err');
      setMsg(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setRows([]);
    setKhach(null);
    setKhachLe({ ten: '', sdt: '' });
    setSdtInput('');
    setMaDatTruoc(null);
    setDtKhoa(null);
    setMaSuKien('');
    setTienTra('');
  }

  // F9 hoàn tất
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F9') { e.preventDefault(); if (!busy) hoanTat(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, rows, loai, khach, khachLe, maSuKien, maDatTruoc, suKiens, ca, phuongThuc]);

  const tienThua = useMemo(() => {
    const t = Number(tienTra) || 0;
    return t >= totals.tongTra ? t - totals.tongTra : null;
  }, [tienTra, totals.tongTra]);

  return (
    <div className="pos-wrap">
      <div className="toolbar">
        <h3>💻 POS — Lập phiếu {loai === 'thue' ? 'thuê' : 'bán'}</h3>
        <div className="pos-loai">
          <button className={loai === 'thue' ? 'primary small' : 'secondary small'} disabled={!!maDatTruoc}
            onClick={() => { setLoai('thue'); setMsg(''); }}>Thuê</button>
          <button className={loai === 'mua' ? 'primary small' : 'secondary small'} disabled={!!maDatTruoc}
            onClick={() => { setLoai('mua'); setMsg(''); }}>Mua</button>
        </div>
        {maDatTruoc && <span className="badge b-blue">Đơn # {maDatTruoc}</span>}
        {ca
          ? <span className="badge b-green" title={`Mở lúc ${fmtDate(ca.thoi_gian_mo)} · Kỳ vọng ${fmt(ca.tien_mat_ky_vong)}₫`}>Ca #{ca.id} · Đầu {fmt(ca.tien_mat_dau_ca)}₫</span>
          : <span className="badge b-red">Chưa mở ca</span>}
        <span className="muted" style={{ marginLeft: 'auto' }}>F9 = Hoàn tất & In hóa đơn</span>
      </div>

      {!ca && (
        <div className="msg err">
          Chưa mở ca làm việc — POS sẽ bị chặn khi lập phiếu.{' '}
          <button className="primary small" onClick={() => navigate('/ca-lam-viec')}>⚙️ Mở ca ngay</button>
        </div>
      )}

      {msg && <div className={`msg ${msg.startsWith('Không tìm') || msg.includes('không') || msg.includes('đã') ? 'err' : ''}`}>{msg}</div>}

      <div className="pos-grid">
        <div>
          <div className="card">
            <h4>👤 Khách hàng</h4>
            {khach ? (
              <div className="pos-khach">
                <div style={{ minWidth: 0 }}>
                  <b>{khach.ho_ten}</b> <Badge type="hang" value={khach.hang_thanh_vien} />
                  <div className="muted">{khach.so_dien_thoai} · {fmt(khach.diem_tich_luy)} điểm {khach.hang_thanh_vien === 'vip' ? `(1 điểm = ${fmt(tienMoiDiem)}đ)` : ''}</div>
                </div>
                <button className="secondary small" disabled={!!maDatTruoc} onClick={() => setKhach(null)}>Bỏ chọn</button>
              </div>
            ) : (
              <div className="form-grid">
                <div>
                  <label>SĐT khách (Enter để tra)</label>
                  <input value={sdtInput} onChange={(e) => setSdtInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && timKhach()} placeholder="090xxxxxxx" />
                </div>
                <button className="secondary small" style={{ alignSelf: 'end' }} onClick={timKhach}>Tra thành viên</button>
                <div><label>Khách vãng lai — tên</label><input value={khachLe.ten} onChange={(e) => setKhachLe({ ...khachLe, ten: e.target.value })} placeholder="Tên khách lẻ" /></div>
                <div><label>SĐT khách lẻ</label><input value={khachLe.sdt} onChange={(e) => setKhachLe({ ...khachLe, sdt: e.target.value })} placeholder="090xxxxxxx" /></div>
              </div>
            )}
          </div>

          <div className="card">
            <h4>🔍 Quét bản sao</h4>
            <input
              ref={scanRef}
              autoFocus
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={onScanEnter}
              placeholder="Quét / nhập mã bản sao rồi nhấn Enter (VD: DRM-001)"
              style={{ width: '100%', fontSize: 16 }}
            />
          </div>

          <div className="card">
            <h4>🎫 Voucher / chương trình giảm giá</h4>
            <select value={maSuKien} onChange={(e) => setMaSuKien(e.target.value)} style={{ width: '100%' }} disabled={!!maDatTruoc}>
              <option value="">-- Không áp mã --</option>
              {suKiens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ten_su_kien} — {s.kieu_giam === 'phan_tram' ? `-${s.gia_tri}%` : `-${fmt(s.gia_tri)}₫`} ({s.pham_vi === 'toan_bo' ? 'toàn bộ' : 'theo thể loại'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <h4>🛒 Bảng giao dịch — {rows.length} bản</h4>
          {rows.length === 0 ? (
            <p className="empty">Chưa có bản sao. Quét mã ở bên trái để thêm.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bản sao</th><th>Truyện</th><th>{loai === 'thue' ? 'Đơn giá/ngày' : 'Giá bán'}</th>
                  {loai === 'thue' && <th>Cọc</th>}
                  {loai === 'thue' && <th>Ngày hẹn trả</th>}
                  {loai === 'mua' && <th>Điểm dùng (VIP)</th>}
                  <th>Thành tiền ≈</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  // Cùng công thức với `totals` để từng dòng khớp tổng và khớp server.
                  const hang = khach ? khach.hang_thanh_vien : null;
                  const giaGoc = maDatTruoc
                    ? Number(dtKhoa?.gia_goc ?? (loai === 'thue' ? r.gia_thue : r.gia_ban) ?? 0)
                    : (loai === 'thue' ? Number(r.don_gia || 0) : Number(r.gia_ban || 0));
                  const gia = giaGoc;
                  const pct = maDatTruoc ? Number(dtKhoa?.phan_tram_giam_hang || 0) : (hang ? (giamHangTheoHang[hang] || 0) : 0);
                  const giamHang = loai === 'mua' ? (gia * pct) / 100 : 0;
                  const giamSK = maDatTruoc ? Number(dtKhoa?.so_tien_giam || 0) : giamVoucherTri(gia);
                  let diem = 0;
                  if (loai === 'mua' && hang === 'vip') {
                    const diemYeuCau = maDatTruoc ? Number(dtKhoa?.diem_su_dung || 0) : Number(r.diem_su_dung || 0);
                    diem = Math.max(0, Math.min(diemYeuCau, Number(khach?.diem_tich_luy || 0), Math.floor(Math.max(0, gia - giamHang - giamSK) / tienMoiDiem)));
                  }
                  const thanhTien = loai === 'thue'
                    ? Math.max(0, gia - giamSK)
                    : Math.max(0, gia - giamHang - giamSK - diem * tienMoiDiem);
                  return (
                    <tr key={i}>
                      <td>
                        {maDatTruoc && r.ban_sao_options && r.ban_sao_options.length > 1 ? (
                          <>
                            <select value={r.ma_ban_sao} style={{ marginBottom: 4, width: 132 }} onChange={(e) => {
                              const id = Number(e.target.value);
                              const opt = r.ban_sao_options.find((o) => o.id === id);
                              if (!opt) return;
                              setRow(i, 'ma_ban_sao', id);
                              setRow(i, 'ma_ban_sao_str', opt.ma_ban_sao);
                            }} title="Chọn bản sao khác cùng truyện/tập (B7)">
                              {r.ban_sao_options.map((o) => (
                                <option key={o.id} value={o.id}>{o.ma_ban_sao}{o.trang_thai === 'dang_giu' ? ' (giữ)' : ''}</option>
                              ))}
                            </select>
                            <div className="muted" style={{ fontSize: 10 }}>Có thể đổi bản cùng truyện/tập</div>
                          </>
                        ) : (
                          <b>{r.ma_ban_sao_str}</b>
                        )}
                      </td>
                      <td>{r.ten_truyen}<div className="muted">{r.tac_gia || ''}</div></td>
                      <td>
                        {loai === 'thue' ? (
                          <input type="number" min="0" style={{ width: 80 }} value={r.don_gia} onChange={(e) => setRow(i, 'don_gia', e.target.value)} />
                        ) : fmt(gia)}
                      </td>
                      {loai === 'thue' && (
                        <td><input type="number" min="0" style={{ width: 90 }} value={r.tien_coc} onChange={(e) => setRow(i, 'tien_coc', e.target.value)} /></td>
                      )}
                      {loai === 'thue' && (
                        <td><input type="date" value={r.ngay_hen_tra} onChange={(e) => setRow(i, 'ngay_hen_tra', e.target.value)} /></td>
                      )}
                      {loai === 'mua' && (
                        <td>
                          <input type="number" min="0" style={{ width: 80 }} disabled={!(khach && khach.hang_thanh_vien === 'vip')} title={khach?.hang_thanh_vien === 'vip' ? `1 điểm = ${fmt(tienMoiDiem)}đ (tối đa ${fmt(Math.floor(Math.max(0, gia - giamHang - giamSK) / tienMoiDiem))} điểm)` : 'Chỉ khách VIP'} value={r.diem_su_dung} onChange={(e) => setRow(i, 'diem_su_dung', e.target.value)} />
                        </td>
                      )}
                      <td><b>{fmt(thanhTien)}₫</b></td>
                      <td><button className="small danger" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>Xóa</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="pos-totals">
            {loai === 'thue' && <div><span>Tổng cọc</span><b>{fmt(totals.tongCoc)}₫</b></div>}
            <div><span>{loai === 'thue' ? 'Tổng tiền thuê' : 'Tổng tiền mua'}</span><b>{fmt(totals.tongThu)}₫</b></div>
            <div className="pos-grand"><span>Khách phải trả</span><b>{fmt(totals.tongTra)}₫</b></div>
            <div className="pos-cash">
              <span>Phương thức</span>
              <select value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value)} style={{ width: 150 }}>
                <option value="tien_mat">💵 Tiền mặt</option>
                <option value="chuyen_khoan">🏦 Chuyển khoản</option>
              </select>
            </div>
            {phuongThuc === 'tien_mat' ? (
              <>
                <div className="pos-cash">
                  <span>Tiền khách đưa</span>
                  <input type="number" min="0" value={tienTra} onChange={(e) => setTienTra(e.target.value)} placeholder="0" style={{ width: 120 }} />
                </div>
                <div className="pos-grand"><span>Tiền thừa</span><b className={tienThua === null ? 'muted' : 'b-green'}>{tienThua === null ? '—' : fmt(tienThua) + '₫'}</b></div>
              </>
            ) : (
              <div className="pos-grand"><span>Tiền thừa</span><b className="muted">—</b></div>
            )}
            <button className="primary" style={{ width: '100%', padding: 12, fontSize: 16 }} disabled={busy || rows.length === 0} onClick={hoanTat}>
              {busy ? 'Đang xử lý...' : 'Hoàn tất & In Hóa đơn (F9)'}
            </button>
          </div>
        </div>
      </div>

      {receipt && <ReceiptModal receipt={receipt} khach={khach || khachLe} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function ReceiptModal({ receipt, onClose }) {
  const { phi, loai, phuong_thuc } = receipt;
  const tenPhuongThuc = phuong_thuc === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt';
  const rows = loai === 'thue' ? phi.chi_tiet : phi.chi_tiet;

  let tongCoc = 0, tongThu = 0;
  for (const r of rows) {
    if (loai === 'thue') {
      tongCoc += Number(r.tien_coc || 0);
      tongThu += Number(r.don_gia || 0);
    } else {
      tongThu += Number(r.thanh_tien || 0);
    }
  }

  function inHoaDon() {
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const tenKhach = phi.ho_ten || phi.ten_khach_le || 'Khách lẻ';
    const sdt = phi.sdt_khach_le || '';
    const now = new Date().toLocaleString('vi-VN');
    let html = `<html><head><meta charset="utf-8"><title>Hóa đơn</title><style>
      body{font-family:Consolas,monospace;width:300px;margin:0 auto;padding:12px;font-size:13px;color:#111}
      h2{text-align:center;margin:4px 0 2px}h3{text-align:center;margin:2px 0 8px;font-weight:normal}
      .line{border-top:1px dashed #444;margin:6px 0}
      table{width:100%;border-collapse:collapse}
      td{padding:2px;vertical-align:top}.r{text-align:right;white-space:nowrap}
      .total{font-weight:bold}
    </style></head><body>
      <h2>📚 Quản lý truyện</h2>
      <h3>${loai === 'thue' ? 'PHIẾU THUÊ #' : 'HÓA ĐƠN BÁN #'}${esc(phi.id)}</h3>
      <div>Khách: <b>${esc(tenKhach)}</b></div>
      <div>${sdt ? 'SĐT: ' + esc(sdt) : ''} Ngày: ${esc(now)}</div>
      <table>
        <tr><th>Bản sao</th><th>Truyện</th><th class="r">Tiền</th></tr>
        ${rows.map((r) => {
          const str = r.ma_ban_sao_str || r.ma_ban_sao;
          const tien = loai === 'thue' ? r.don_gia : r.thanh_tien;
          const phu = loai === 'thue'
            ? (r.ma_su_kien ? ' (SK)' : '')
            : [r.phan_tram_giam_hang ? ` -${r.phan_tram_giam_hang}%` : '', r.diem_da_dung ? ` -${r.diem_da_dung}đ` : ''].join('');
          return `<tr><td>${esc(str)}</td><td>${esc(r.ten_truyen)}${esc(phu)}</td><td class="r">${Number(tien || 0).toLocaleString('vi-VN')}</td></tr>`;
        })}
      </table>
      <div class="line"></div>
      ${loai === 'thue' ? `<div class="total">Tổng cọc: ${tongCoc.toLocaleString('vi-VN')}₫</div>` : ''}
      <div class="total">${loai === 'thue' ? 'Tiền thuê' : 'TỔNG TIỀN'}: <b>${tongThu.toLocaleString('vi-VN')}₫</b></div>
      ${loai === 'thue' ? `<div>Tổng phải trả: ${(tongCoc + tongThu).toLocaleString('vi-VN')}₫</div>` : ''}
      <div>Thanh toán: <b>${esc(tenPhuongThuc)}</b></div>
      <div class="line"></div>
      <div style="text-align:center;margin-top:8px">— Cảm ơn quý khách! —</div>
    </body></html>`;
    const w = window.open('', '_blank', 'width=380,height=600');
    if (!w) { alert('Trình duyệt chặn cửa sổ in. Hãy cho phép popup.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: 620 }}>
        <div className="toolbar">
          <h3>{loai === 'thue' ? `Phiếu thuê #${phi.id}` : `Hóa đơn bán #${phi.id}`} — thành công</h3>
          <button className="secondary" onClick={onClose}>Đóng</button>
        </div>
        <div className="form-grid">
          <div>Khách: <b>{phi.ho_ten || phi.ten_khach_le || '—'}</b></div>
          <div>Nhân viên: <b>{phi.nhan_vien}</b></div>
          <div>Ngày: {fmtDate(loai === 'thue' ? phi.ngay_thue : phi.ngay_ban)}</div>
          <div>Thanh toán: <b>{tenPhuongThuc}</b></div>
          <div>Số đầu: <b>{rows.length}</b></div>
        </div>
        <table>
          <thead><tr><th>Bản sao</th><th>Truyện</th>{loai === 'thue' && <th>Hẹn trả</th>}<th className="r">Tiền</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.ma_ban_sao_str || r.ma_ban_sao}</td>
                <td>{r.ten_truyen}{loai === 'mua' && (r.phan_tram_giam_hang ? <div className="muted">giảm hạng {r.phan_tram_giam_hang}% {r.diem_da_dung ? `, dùng ${r.diem_da_dung} điểm` : ''}</div> : r.diem_da_dung ? <div className="muted">dùng {r.diem_da_dung} điểm</div> : null)}</td>
                {loai === 'thue' && <td>{r.ngay_hen_tra}</td>}
                <td className="r">{fmt(loai === 'thue' ? r.don_gia : r.thanh_tien)}₫</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loai === 'thue' && <p className="toolbar"><b>Tổng cọc: {fmt(tongCoc)}₫</b> · <b>Tiền thuê: {fmt(tongThu)}₫</b> · <b className="b-green">Phải trả: {fmt(tongCoc + tongThu)}₫</b></p>}
        {loai === 'mua' && <p className="toolbar"><b className="b-green">Tổng thu: {fmt(tongThu)}₫</b></p>}
        <div className="pos-cash"><span>Xin in hóa đơn cho khách:</span><button onClick={inHoaDon}>🖨 In hóa đơn</button></div>
      </div>
    </div>
  );
}