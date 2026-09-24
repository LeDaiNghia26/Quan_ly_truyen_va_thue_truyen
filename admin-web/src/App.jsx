import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Truyen from './pages/Truyen';
import TheLoai from './pages/TheLoai';
import KhachHang from './pages/KhachHang';
import NhanVien from './pages/NhanVien';
import NhaCungCap from './pages/NhaCungCap';
import PhieuNhapKho from './pages/PhieuNhapKho';
import SuKienGiamGia from './pages/SuKienGiamGia';
import DatTruoc from './pages/DatTruoc';
import PhieuThue from './pages/PhieuThue';
import PhieuBan from './pages/PhieuBan';
import PhieuTra from './pages/PhieuTra';
import POS from './pages/POS';
import BanSao from './pages/BanSao';
import HoTro from './pages/HoTro';
import ThongKe from './pages/ThongKe';
import CauHinhHeThong from './pages/CauHinhHeThong';
import BaoTri from './pages/BaoTri';
import CaLamViec from './pages/CaLamViec';
import AuditLog from './pages/AuditLog';

function Protected({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function RequireRole({ roles, children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!roles.includes(user.user?.vai_tro)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="truyen"
          element={<RequireRole roles={['admin', 'staff']}><Truyen /></RequireRole>}
        />
        <Route
          path="tra-cuu-truyen"
          element={<RequireRole roles={['admin', 'staff']}><Truyen /></RequireRole>}
        />
        <Route path="the-loai" element={<TheLoai />} />
        <Route
          path="khach-hang"
          element={<RequireRole roles={['admin']}><KhachHang /></RequireRole>}
        />
        <Route
          path="nhan-vien"
          element={<RequireRole roles={['admin']}><NhanVien /></RequireRole>}
        />
        <Route
          path="nha-cung-cap"
          element={<RequireRole roles={['admin']}><NhaCungCap /></RequireRole>}
        />
        <Route
          path="phieu-nhap-kho"
          element={<RequireRole roles={['admin']}><PhieuNhapKho /></RequireRole>}
        />
        <Route
          path="su-kien-giam-gia"
          element={<RequireRole roles={['admin']}><SuKienGiamGia /></RequireRole>}
        />
        <Route
          path="thong-ke"
          element={<RequireRole roles={['admin']}><ThongKe /></RequireRole>}
        />
        <Route
          path="cau-hinh"
          element={<RequireRole roles={['admin']}><CauHinhHeThong /></RequireRole>}
        />
        <Route path="dat-truoc" element={<DatTruoc />} />
        <Route path="phieu-thue" element={<PhieuThue />} />
        <Route path="phieu-ban" element={<PhieuBan />} />
        <Route path="phieu-tra" element={<PhieuTra />} />
        <Route path="pos" element={<POS />} />
        <Route
          path="ca-lam-viec"
          element={<RequireRole roles={['admin', 'staff']}><CaLamViec /></RequireRole>}
        />
        <Route
          path="audit-log"
          element={<RequireRole roles={['admin']}><AuditLog /></RequireRole>}
        />
        <Route path="bansao" element={<BanSao />} />
        <Route path="bao-tri" element={<BaoTri />} />
        <Route path="ho-tro" element={<HoTro />} />
      </Route>
    </Routes>
  );
}