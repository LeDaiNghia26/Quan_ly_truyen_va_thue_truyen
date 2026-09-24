import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';

export default function Login() {
  const [account, setAccount] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem('token')) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { so_dien_thoai: account, email: account, mat_khau: matKhau });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(getErrorMessage(e2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Quản lý truyện</h1>
        <p>Giao diện quản trị viên &amp; nhân viên</p>
        {err && <div className="msg err">{err}</div>}
        <label>Email hoặc số điện thoại</label>
        <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="admin@shop.com" required />
        <label>Mật khẩu</label>
        <input type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} placeholder="123456" required />
        <button type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
        <p style={{ marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
          Tài khoản mẫu: admin@shop.com / nhanvien@shop.com (mật khẩu 123456)
        </p>
      </form>
    </div>
  );
}