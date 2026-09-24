# Quản lý truyện và cho thuê truyện — Nhóm 3

Đồ án môn học: hệ thống quản lý cửa hàng truyện (bán + cho thuê).
Thành viên: **Lê Đại Nghĩa** (trưởng nhóm), **Nguyễn Đức Định**, **Vũ Ngọc Vy**.

## Kiến trúc

| Phần | Công nghệ | Thư mục | Đối tượng |
|---|---|---|---|
| Backend API | Node.js + Express + MySQL | `backend/` | toàn hệ thống |
| Web Admin | React + Vite | `admin-web/` | Quản trị viên, Nhân viên |
| Mobile App | React Native (Expo) | `mobile/` | Khách hàng |
| Database | MySQL 8 | `database/` | 18 bảng |

## Yêu cầu môi trường

- Node.js 18+ (đã test trên v24)
- MySQL 8 (đã test trên 8.4, service `MySQL84`)
- Điện thoại cài **Expo Go** (app Expo) để chạy mobile

## 1. Khởi tạo database

Mật khẩu MySQL root: mặc định `123456` (đổi trong biến môi trường nếu khác).

```powershell
# Tạo schema + dữ liệu mẫu (password: 123456)
mysql -u root -p < database\schema.sql
mysql -u root -p < database\seed.sql
```

> `seed.sql` đã chứa hash bcrypt **thật** của mật khẩu `123456`.
> Tài khoản mẫu:
> - `admin@shop.com` (Quản trị viên) — quyền quản lý mọi thứ
> - `nhanvien@shop.com` (Nhân viên) — lập phiếu thuê/bán/trả, đặt trước
> - `khach@shop.com` (Khách hàng hạng VIP) — dùng app mobile
> - Mật khẩu chung: `123456`

Nếu chạy lại seed trên DB đã có dữ liệu, xóa sạch trước (thứ tự xóa con trước, cha sau, tắt `FOREIGN_KEY_CHECKS`).

## 2. Chạy backend

```powershell
cd backend
npm install
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
npm.cmd run dev
```

- API chạy tại `http://localhost:5000`
- Cấu hình trong `backend\.env` (PORT=5000, DB_PASSWORD, JWT_SECRET)
- Kiểm tra nhanh: `http://localhost:5000/api/truyen`

## 3. Chạy web admin

```powershell
cd admin-web
npm install
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
npm.cmd run dev
```

- Mở `http://localhost:5173`, đăng nhập `admin@shop.com / 123456`
- Backend phải đang chạy (admin-web proxy `/api` → `localhost:5000`)

## 4. Chạy mobile app (khách hàng)

```powershell
cd mobile
npm install
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
npm.cmd start
```

- Quét QR bằng app **Expo Go** trên điện thoại (cùng mạng LAN với máy tính)
- **Trước khi chạy:** sửa địa chỉ API trong `mobile\src\api.js`

```js
// Tìm IP của máy tính bằng lệnh `ipconfig` (mục IPv4 Adapter)
const API_URL = 'http://<IP_máy_tính>:5000/api';
```

- Hoặc chạy bản web để xem nhanh: `npm.cmd web`

## Các luồng nghiệp vụ chính

1. **Nhập kho** (admin): phiếu nhập + chi tiết → tự tạo bản sao truyện
2. **Đặt trước** (khách h.mobile → nhân viên xác nhận): thuê hoặc mua
3. **Phiếu bán** (nhân viên): tự tính giảm giá hạng thành viên + sự kiện, cộng điểm, lên hạng VIP
4. **Phiếu thuê** (nhân viên): tính tiền thuê theo ngày, chuyển trạng thái bản sao
5. **Phiếu trả / báo mất** (nhân viên): tính tiền phạt trễ hạn
6. **Thống kê** (admin): doanh thu bán/cho thuê, hàng gần hết, bản sao mỗi truyện

## Cấu trúc project

```
Default Project/
├── BaoCao_QuanLyTruyen_v3.docx      # Báo cáo đồ án (nghiệp vụ gốc)
├── database/
│   ├── schema.sql                   # 18 bảng + khóa ngoại
│   └── seed.sql                     # Dữ liệu mẫu (hash bcrypt thật)
├── backend/
│   ├── .env                         # PORT, DB_PASSWORD, JWT_SECRET
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── middlewares/auth.js
│       ├── controllers/             # 13 controller nghiệp vụ
│       └── routes/                  # 13 route file
├── admin-web/
│   └── src/
│       ├── components/, pages/      # 14 trang quản trị
│       ├── Layout.jsx, ui.jsx, hooks.jsx, api.js
│       └── main.jsx, App.jsx
└── mobile/
    └── src/
        ├── api.js, AuthContext.js
        ├── navigation/AppNavigator.js
        ├── components/, screens/    # đăng nhập, tìm kiếm, đặt trước, hồ sơ...
        └── App.js
```