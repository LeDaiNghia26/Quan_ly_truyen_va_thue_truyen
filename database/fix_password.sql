-- Cập nhật mật khẩu mặc định "123456" (bcrypt) cho tài khoản mẫu
USE quanlytruyen;
UPDATE taikhoan SET mat_khau = '$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be' WHERE vai_tro IN ('admin','staff','customer') AND email IN ('admin@shop.com','nhanvien@shop.com','khach@shop.com');