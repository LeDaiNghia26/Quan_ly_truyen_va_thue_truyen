require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { startJobs } = require('./jobs');
const authRoutes = require('./routes/authRoutes');
const theLoaiRoutes = require('./routes/theLoaiRoutes');
const truyenRoutes = require('./routes/truyenRoutes');
const khachHangRoutes = require('./routes/khachHangRoutes');
const nhanVienRoutes = require('./routes/nhanVienRoutes');
const nhaCungCapRoutes = require('./routes/nhaCungCapRoutes');
const phieuNhapKhoRoutes = require('./routes/phieuNhapKhoRoutes');
const suKienGiamGiaRoutes = require('./routes/suKienGiamGiaRoutes');
const datTruocRoutes = require('./routes/datTruocRoutes');
const phieuThueRoutes = require('./routes/phieuThueRoutes');
const phieuBanRoutes = require('./routes/phieuBanRoutes');
const phieuTraRoutes = require('./routes/phieuTraRoutes');
const thongKeRoutes = require('./routes/thongKeRoutes');
const banSaoRoutes = require('./routes/banSaoRoutes');
const yeuThichRoutes = require('./routes/yeuThichRoutes');
const danhGiaRoutes = require('./routes/danhGiaRoutes');
const cauHinhRoutes = require('./routes/cauHinhRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const thongBaoAdminRoutes = require('./routes/thongBaoAdminRoutes');
const baoTriRoutes = require('./routes/baoTriRoutes');
const caLamViecRoutes = require('./routes/caLamViecRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => res.json({ service: 'QuanLyTruyen API', version: '1.0.0', health: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/the-loai', theLoaiRoutes);
app.use('/api/truyen', truyenRoutes);
app.use('/api/khach-hang', khachHangRoutes);
app.use('/api/nhan-vien', nhanVienRoutes);
app.use('/api/nha-cung-cap', nhaCungCapRoutes);
app.use('/api/phieu-nhap-kho', phieuNhapKhoRoutes);
app.use('/api/su-kien-giam-gia', suKienGiamGiaRoutes);
app.use('/api/dat-truoc', datTruocRoutes);
app.use('/api/phieu-thue', phieuThueRoutes);
app.use('/api/phieu-ban', phieuBanRoutes);
app.use('/api/phieu-tra', phieuTraRoutes);
app.use('/api/thong-ke', thongKeRoutes);
app.use('/api/yeu-thich', yeuThichRoutes);
app.use('/api/danh-gia', danhGiaRoutes);
app.use('/api/bansao', banSaoRoutes);
app.use('/api/cau-hinh', cauHinhRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/thong-bao-admin', thongBaoAdminRoutes);
app.use('/api/bao-tri', baoTriRoutes);
app.use('/api/ca-lam-viec', caLamViecRoutes);
app.use('/api/audit-log', auditLogRoutes);

app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy đường dẫn.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  startJobs();
});
