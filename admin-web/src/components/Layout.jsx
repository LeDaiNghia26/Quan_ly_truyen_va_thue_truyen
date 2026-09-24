import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { fmtDate } from '../ui';

const ICONS = {
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z',
  tag: 'M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  badge: 'M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  percent: 'M19 5 5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  pos: 'M8 7h8M8 11h8M8 15h5M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 7h8M8 11h8M8 15h5',
  rotate: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15',
  copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  headset: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 2.6 15a1.65 1.65 0 0 0-1.51-1H1a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 2.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 7 4.6h.09A1.65 1.65 0 0 0 8 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09A1.65 1.65 0 0 0 21 10h.09a2 2 0 1 1 0 4H21a1.65 1.65 0 0 0-1.6 1z',
  tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-2.1z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  menu: 'M3 12h18M3 6h18M3 18h18',
  alert: 'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  dot: 'M12 12h.01',
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={ICONS[name] || ICONS.dot} />
    </svg>
  );
}

const MENU = [
  { g: 'Tổng quan', roles: ['admin', 'staff'], items: [['', 'Bảng điều khiển', 'dashboard']] },
  {
    g: 'Quản trị (Admin)',
    roles: ['admin'],
    items: [
      ['truyen', 'Quản lý truyện', 'book'],
      ['the-loai', 'Thể loại', 'tag'],
      ['khach-hang', 'Khách hàng', 'users'],
      ['nhan-vien', 'Nhân viên', 'badge'],
      ['nha-cung-cap', 'Nhà cung cấp', 'truck'],
      ['phieu-nhap-kho', 'Phiếu nhập kho', 'inbox'],
      ['su-kien-giam-gia', 'Chương trình giảm giá', 'percent'],
      ['bao-tri', 'Phiếu bảo trì', 'tool'],
      ['thong-ke', 'Thống kê', 'chart'],
      ['cau-hinh', 'Cấu hình hệ thống', 'settings'],
      ['audit-log', 'Nhật ký hệ thống', 'file'],
    ],
  },
  {
    g: 'Trực quầy (Nhân viên)',
    roles: ['admin', 'staff'],
    items: [
      ['ca-lam-viec', 'Mở / Chốt ca', 'calendar'],
      ['pos', 'POS — Lập phiếu', 'pos'],
      ['tra-cuu-truyen', 'Tra cứu truyện', 'search'],
      ['dat-truoc', 'Đặt trước', 'calendar'],
      ['phieu-thue', 'Phiếu thuê', 'file'],
      ['phieu-ban', 'Phiếu bán', 'receipt'],
      ['phieu-tra', 'Phiếu trả', 'rotate'],
      ['bansao', 'Quản lý bản sao', 'copy'],
      ['ho-tro', 'Hỗ trợ khách hàng', 'headset'],
    ],
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const vaiTro = user.user?.vai_tro;
  const [showAcc, setShowAcc] = useState(false);
  const [collapsed, setCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === '1');

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem('sidebar_collapsed', c ? '0' : '1');
      return !c;
    });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  const roleLabel = vaiTro === 'admin' ? 'Quản trị viên' : vaiTro === 'staff' ? 'Nhân viên' : 'Khách hàng';

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          {!collapsed && <h2>📚 Quản lý truyện</h2>}
          <button className="icon-btn collapse" onClick={toggleCollapse} title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
            <Icon name="menu" />
          </button>
        </div>
        {MENU.filter((group) => (group.roles || []).includes(vaiTro)).map((group, i) => (
          <div key={i}>
            {!collapsed && <div className="grp">{group.g}</div>}
            {group.items.map(([path, label, icon]) => (
              <NavLink key={path} to={`/${path}`} end={path === ''} title={label}>
                <Icon name={icon} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <div className="main">
        <div className="topbar">
          <GlobalSearch navigate={navigate} />
          <div className="topbar-right">
            <NotificationBell navigate={navigate} />
            <div className="user">
              <Icon name="user" size={16} />
              {user.user?.profile?.ho_ten || user.user?.email} · <span className="chip">{roleLabel}</span>
            </div>
            <button className="secondary small" onClick={() => setShowAcc(true)}>Tài khoản</button>
            <button className="secondary small" onClick={logout}>Đăng xuất</button>
          </div>
        </div>
        <Outlet />
        {showAcc && <AccountModal onClose={() => setShowAcc(false)} vaiTro={vaiTro} />}
      </div>
    </div>
  );
}

function GlobalSearch({ navigate }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState({ truyen: [], khach: [] });
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setRes({ truyen: [], khach: [] }); return; }
    const t = setTimeout(async () => {
      try {
        const [r1, r2] = await Promise.all([
          api.get('/truyen', { params: { tu_khoa: q } }),
          api.get('/khach-hang', { params: { tu_khoa: q } }),
        ]);
        setRes({ truyen: r1.data.slice(0, 5), khach: r2.data.slice(0, 5) });
      } catch (e) { /* bỏ qua */ }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const has = res.truyen.length || res.khach.length;

  return (
    <div className="gsearch" ref={boxRef}>
      <Icon name="search" size={16} />
      <input
        placeholder="Tìm truyện, khách hàng..."
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && q.trim() && (
        <div className="gsearch-drop">
          {res.truyen.length > 0 && <div className="gs-title">Truyện</div>}
          {res.truyen.map((t) => (
            <div key={`t${t.id}`} className="gs-item" onClick={() => { navigate('/truyen'); setOpen(false); setQ(''); }}>
              <Icon name="book" size={15} /> {t.ten_truyen}
            </div>
          ))}
          {res.khach.length > 0 && <div className="gs-title">Khách hàng</div>}
          {res.khach.map((k) => (
            <div key={`k${k.id}`} className="gs-item" onClick={() => { navigate('/khach-hang'); setOpen(false); setQ(''); }}>
              <Icon name="user" size={15} /> {k.ho_ten} · {k.so_dien_thoai || k.email}
            </div>
          ))}
          {!has && <div className="gs-empty">Không tìm thấy kết quả.</div>}
        </div>
      )}
    </div>
  );
}

function NotificationBell({ navigate }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ danh_sach: [], chua_doc: 0 });
  const boxRef = useRef(null);

  async function load() {
    try { const r = await api.get('/thong-bao-admin'); setData(r.data); } catch (e) { /* bỏ qua */ }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function markAll() {
    try { await api.put('/thong-bao-admin/doc-tat-ca'); load(); } catch (e) { /* bỏ qua */ }
  }

  async function markOne(id) {
    try { await api.put(`/thong-bao-admin/${id}/doc`); load(); } catch (e) { /* bỏ qua */ }
  }

  return (
    <div className="bell" ref={boxRef}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Thông báo">
        <Icon name="bell" />
        {data.chua_doc > 0 && <span className="bell-dot">{data.chua_doc}</span>}
      </button>
      {open && (
        <div className="bell-drop">
          <div className="bell-head">
            <b>Thông báo quản trị</b>
            <button className="secondary small" onClick={markAll}>Đọc tất cả</button>
          </div>
          {data.danh_sach.length === 0 && <div className="gs-empty">Không có thông báo.</div>}
          {data.danh_sach.map((n) => (
            <div key={n.id} className={`bell-item ${n.da_doc ? '' : 'unread'}`} onClick={() => markOne(n.id)}>
              <Icon name={n.loai === 'het_hang' || n.loai === 'hong_mat' ? 'alert' : n.loai === 'doanh_thu' ? 'chart' : 'dot'} size={15} />
              <div>
                <div className="bi-title">{n.tieu_de}</div>
                <div className="bi-body">{n.noi_dung}</div>
                <div className="bi-time">{fmtDate(n.ngay_tao)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountModal({ onClose, vaiTro }) {
  const [info, setInfo] = useState(null);
  const [hoTen, setHoTen] = useState('');
  const [pw, setPw] = useState({ cu: '', moi: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/auth/me').then((r) => {
      setInfo(r.data);
      setHoTen(r.data.profile?.ho_ten || r.data.user?.email || '');
    }).catch(() => {});
  }, []);

  async function updateProfile(e) {
    e.preventDefault();
    try { await api.put('/auth/me', { ho_ten: hoTen }); setMsg({ type: 'ok', text: 'Đã cập nhật tên hiển thị.' }); }
    catch (e2) { setMsg({ type: 'err', text: getErrorMessage(e2) }); }
  }

  async function changePw(e) {
    e.preventDefault();
    try { await api.put('/auth/change-password', { mat_khau_cu: pw.cu, mat_khau_moi: pw.moi }); setPw({ cu: '', moi: '' }); setMsg({ type: 'ok', text: 'Đổi mật khẩu thành công.' }); }
    catch (e2) { setMsg({ type: 'err', text: getErrorMessage(e2) }); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="toolbar">
          <h3>Tài khoản của tôi</h3>
          <button className="secondary" onClick={onClose}>Đóng</button>
        </div>
        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        {info ? (
          <>
            <p>Email: <b>{info.user.email}</b> · SĐT: <b>{info.user.so_dien_thoai || '—'}</b> · Vai trò: <b>{vaiTro === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</b></p>
            <form className="form-grid" onSubmit={updateProfile}>
              <div><label>Tên hiển thị</label><input value={hoTen} onChange={(e) => setHoTen(e.target.value)} /></div>
              <div className="full"><button type="submit">Cập nhật</button></div>
            </form>
          </>
        ) : <p>Đang tải...</p>}
        <h4>Đổi mật khẩu</h4>
        <form className="form-grid" onSubmit={changePw}>
          <div className="full"><label>Mật khẩu cũ</label><input type="password" value={pw.cu} onChange={(e) => setPw({ ...pw, cu: e.target.value })} required /></div>
          <div className="full"><label>Mật khẩu mới</label><input type="password" value={pw.moi} onChange={(e) => setPw({ ...pw, moi: e.target.value })} required /></div>
          <div className="full"><button type="submit">Đổi mật khẩu</button></div>
        </form>
      </div>
    </div>
  );
}
