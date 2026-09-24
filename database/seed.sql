-- ============================================================
-- DỮ LIỆU MẪU (SEED) - quanlytruyen
-- ============================================================
USE quanlytruyen;

-- Mật khẩu mẫu: "123456" (băm bcrypt)
-- admin@shop.com / nhanvien@shop.com / khach@shop.com
-- LƯU Ý: đây là hash bcrypt THẬT của chuỗi "123456", đã kiểm chứng login thành công

-- 1. TÀI KHOẢN
INSERT INTO TaiKhoan (email, so_dien_thoai, mat_khau, vai_tro) VALUES
('admin@shop.com', '0900000001', '$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be', 'admin'),
('nhanvien@shop.com', '0900000002', '$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be', 'staff'),
('khach@shop.com', '0900000003', '$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be', 'customer');

-- 2. QUẢN TRỊ VIÊN
INSERT INTO QuanTriVien (ma_tai_khoan, ho_ten, chuc_vu) VALUES
(1, 'Lê Đại Nghĩa', 'Quản trị viên');

-- 3. NHÂN VIÊN
INSERT INTO NhanVien (ma_tai_khoan, ho_ten, chuc_vu) VALUES
(2, 'Nguyễn Đức Định', 'Nhân viên bán hàng');

-- 4. KHÁCH HÀNG
INSERT INTO KhachHang (ma_tai_khoan, ho_ten, dia_chi, diem_tich_luy, tong_diem_tich_luy, hang_thanh_vien) VALUES
(3, 'Vũ Ngọc Vy', 'Hà Nội', 120, 120, 'vip');

-- 5. THỂ LOẠI (chủ đề nội dung — GENRES)
INSERT INTO TheLoai (ten_the_loai, mo_ta) VALUES
('Hành động', 'Truyện có nhiều pha hành động, võ thuật, rượt đuổi'),
('Trinh thám', 'Điều tra, phá án, bí ẩn'),
('Hài hước', 'Gây cười, hài hước'),
('Kinh dị', 'Rùng rợn, hồi hộp, ma quái'),
('Phiêu lưu', 'Hành trình khám phá, mạo hiểm'),
('Viễn tưởng', 'Khoa học viễn tưởng, tương lai'),
('Tình cảm', 'Lãng mạn, tình cảm'),
('Văn học thiếu nhi', 'Phù hợp cho trẻ em, thiếu nhi'),
('Tâm lý / Triết lý', 'Chiều sâu tâm lý, triết lý sống');

-- 6. TRUYỆN (mỗi truyện chọn ĐÚNG 1 format: TRUYEN_TRANH / TIEU_THUYET / TRUYEN_NGAN / LIGHT_NOVEL)
INSERT INTO Truyen (ten_truyen, ma_viet_tat, loai, tac_gia, nha_xuat_ban, nam_xuat_ban, gia_thue, gia_ban, tien_coc, luot_thue, luot_mua, anh_bia, mo_ta) VALUES
('Doraemon - Tập 1', 'DRM', 'TRUYEN_TRANH', 'Fujiko F. Fujio', 'NXB Kim Đồng', 2015, 5000, 15000, 15000, 35, 12, 'doraemon1.jpg', 'Truyện tranh thiếu nhi kinh điển của Nhật Bản. Chú mèo máy Doraemon đến từ tương lai giúp đỡ cậu bé Nobita qua các bảo bối kỳ diệu.'),
('Conan - Tập 95', 'CN', 'TRUYEN_TRANH', 'Gosho Aoyama', 'NXB Kim Đồng', 2019, 6000, 18000, 18000, 28, 9, 'conan95.jpg', 'Thám tử học sinh cấp 2. Shinichi bị teo nhỏ thành Conan và luôn đối mặt những vụ án hóc búa.'),
('Nhà giả kim', 'NGK', 'TIEU_THUYET', 'Paulo Coelho', 'NXB Văn Học', 2013, 10000, 90000, 90000, 15, 20, 'nhagiakim.jpg', 'Tiểu thuyết nổi tiếng thế giới. Hành trình của chàng chăn cừu Santiago đi tìm kho báu và ý nghĩa cuộc đời.'),
('Sherlock Holmes trọn bộ', 'SHL', 'TIEU_THUYET', 'Arthur Conan Doyle', 'NXB Trẻ', 2016, 15000, 120000, 120000, 10, 6, 'sherlock.jpg', 'Tuyển tập truyện trinh thám kinh điển về vị thám tử tài ba Sherlock Holmes đầy đủ các tập.');

-- 6b. ĐA THỂ LOẠI (N-N: mỗi truyện gắn với 1 hoặc nhiều thể loại nội dung)
INSERT INTO TruyenTheLoai (ma_truyen, ma_the_loai) VALUES
(1, 3), (1, 8), (1, 6),
(2, 2), (2, 1), (2, 3),
(3, 5), (3, 9),
(4, 2), (4, 5);

-- 7. NHÀ CUNG CẤP
INSERT INTO NhaCungCap (ten_ncc, dia_chi, so_dien_thoai, email) VALUES
('NXB Kim Đồng', 'Hà Nội', '0240000001', 'nxbkimdong@example.com'),
('Nhà sách FAHASA', 'TP. HCM', '0280000002', 'fahasa@example.com');

-- 8. PHIẾU NHẬP KHO + CHI TIẾT + BẢN SAO
INSERT INTO PhieuNhapKho (ma_ncc, ma_quan_tri_vien, tong_tien) VALUES
(1, 1, 99000);

INSERT INTO ChiTietPhieuNhapKho (ma_phieu_nhap, ma_truyen, tap, so_luong, gia_nhap) VALUES
(1, 1, 1, 3, 10000),
(1, 2, 95, 2, 12000),
(1, 3, 1, 2, 50000),
(1, 4, 1, 1, 70000);

-- Bản sao: 3 Doraemon + 2 Conan + 2 Nhà giả kim + 1 Sherlock
INSERT INTO BanSao (ma_ban_sao, ma_truyen, ma_chi_tiet_nhap, tap, vi_tri_ke, tinh_trang_hien_tai, trang_thai) VALUES
('DRM-T01-001', 1, 1, 1, 'Kệ A1', 'moi', 'san_sang'),
('DRM-T01-002', 1, 1, 1, 'Kệ A1', 'moi', 'san_sang'),
('DRM-T01-003', 1, 1, 1, 'Kệ A1', 'cu', 'san_sang'),
('CN-T95-001', 2, 2, 95, 'Kệ A2', 'moi', 'san_sang'),
('CN-T95-002', 2, 2, 95, 'Kệ A2', 'moi', 'san_sang'),
('NGK-T01-001', 3, 3, 1, 'Kệ B1', 'moi', 'san_sang'),
('NGK-T01-002', 3, 3, 1, 'Kệ B1', 'cu', 'san_sang'),
('SHL-T01-001', 4, 4, 1, 'Kệ B2', 'moi', 'san_sang');

-- 9. CHƯƠNG TRÌNH GIẢM GIÁ
INSERT INTO SuKienGiamGia (ten_su_kien, kieu_giam, gia_tri, pham_vi, ma_the_loai, ngay_bat_dau, ngay_ket_thuc, ma_quan_tri_vien) VALUES
('Khai trương - giảm 10%', 'phan_tram', 10, 'the_loai', 2, '2026-01-01', '2026-12-31', 1),
('Tết 2026 - giảm 20k', 'so_tien', 20000, 'toan_bo', NULL, '2026-01-25', '2026-02-10', 1);

-- 10. SỞ THÍCH + YÊU THÍCH + ĐÁNH GIÁ MẪU (khách hàng #1 - Vũ Ngọc Vy)
INSERT INTO KhachHangSoThich (ma_khach_hang, ma_the_loai) VALUES (1, 1), (1, 2);

INSERT INTO YeuThich (ma_khach_hang, ma_truyen) VALUES (1, 1), (1, 2);

INSERT INTO DanhGia (ma_khach_hang, ma_truyen, so_sao, noi_dung) VALUES
(1, 1, 5, 'Truyện rất hay, con mình rất thích.'),
(1, 2, 4, 'Nội dung hấp dẫn, bản in đẹp.'),
(1, 3, 5, 'Một cuốn sách đáng đọc một lần trong đời.');

-- 11. CẤU HÌNH HẠNG THÀNH VIÊN
INSERT INTO HangThanhVien (ma_hang, ten_hang, nguong_diem, phan_tram_giam, thu_tu) VALUES
('thuong', 'Thường', 0, 0, 1),
('than_thiet', 'Thân thiết', 50, 5, 2),
('vip', 'VIP', 100, 10, 3);

-- 12. QUY TẮC QUY ĐỔI ĐIỂM
INSERT INTO QuyDoiDiem (ten_quy_tac, gia_tri, mo_ta) VALUES
('tien_moi_diem', 200, 'Số tiền (VNĐ) được giảm khi dùng 1 điểm');

-- 13. THÔNG BÁO QUẢN TRỊ (mẫu)
INSERT INTO ThongBaoAdmin (tieu_de, noi_dung, loai, ma_tham_chieu) VALUES
('Tồn kho thấp', 'Đầu truyện "Sherlock Holmes trọn bộ" chỉ còn 1 bản sẵn sàng.', 'het_hang', 4),
('Có sách hỏng/mất mới', 'Ghi nhận báo hỏng/mất trong ngày, cần kiểm tra và xử lý.', 'hong_mat', NULL);

-- 14. PHIẾU BẢO TRÌ (mẫu)
INSERT INTO PhieuBaoTri (ma_ban_sao, ngay, chi_phi, noi_dung, ma_quan_tri_vien) VALUES
(3, '2026-01-10', 15000, 'Keo gáy, thay bìa cho bản sao cũ', 1);