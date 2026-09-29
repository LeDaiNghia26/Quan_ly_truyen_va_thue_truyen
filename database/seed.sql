-- ============================================================
-- DỮ LIỆU MẪU (SEED) - quanlytruyen
-- 24 truyện | 9 thể loại | 3 phiếu nhập kho | 48 bản sao
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

-- 6. TRUYỆN (24 truyện — loại: TRUYEN_TRANH / TIEU_THUYET / TRUYEN_NGAN / LIGHT_NOVEL)
INSERT INTO Truyen (ten_truyen, ma_viet_tat, loai, tac_gia, nha_xuat_ban, nam_xuat_ban, gia_thue, gia_ban, tien_coc, luot_thue, luot_mua, anh_bia, mo_ta) VALUES
('Doraemon - Tập 1', 'DRM', 'TRUYEN_TRANH', 'Fujiko F. Fujio', 'NXB Kim Đồng', 2015, 5000, 15000, 15000, 35, 12, 'doraemon1.jpg', 'Truyện tranh thiếu nhi kinh điển của Nhật Bản. Chú mèo máy Doraemon đến từ tương lai giúp đỡ cậu bé Nobita qua các bảo bối kỳ diệu.'),
('Conan - Tập 95', 'CN', 'TRUYEN_TRANH', 'Gosho Aoyama', 'NXB Kim Đồng', 2019, 6000, 18000, 18000, 28, 9, 'conan95.jpg', 'Thám tử học sinh cấp 2. Shinichi bị teo nhỏ thành Conan và luôn đối mặt những vụ án hóc búa.'),
('Nhà giả kim', 'NGK', 'TIEU_THUYET', 'Paulo Coelho', 'NXB Văn Học', 2013, 10000, 90000, 90000, 15, 20, 'nhagiakim.jpg', 'Tiểu thuyết nổi tiếng thế giới. Hành trình của chàng chăn cừu Santiago đi tìm kho báu và ý nghĩa cuộc đời.'),
('Sherlock Holmes trọn bộ', 'SHL', 'TIEU_THUYET', 'Arthur Conan Doyle', 'NXB Trẻ', 2016, 15000, 120000, 120000, 10, 6, 'sherlock.jpg', 'Tuyển tập truyện trinh thám kinh điển về vị thám tử tài ba Sherlock Holmes đầy đủ các tập.'),
('One Piece - Tập 1', 'OPN', 'TRUYEN_TRANH', 'Oda Eiichiro', 'NXB Kim Đồng', 2017, 7000, 20000, 20000, 40, 18, 'onepiece1.jpg', 'Hành trình trở thành Vua Hải Tặc của cậu bé Luffy cùng băng Mũ Rơm, khám phá Đại Hải Trình đầy sóng gió.'),
('Naruto - Tập 1', 'NRT', 'TRUYEN_TRANH', 'Masashi Kishimoto', 'NXB Kim Đồng', 2018, 6000, 18000, 18000, 32, 15, 'naruto1.jpg', 'Naruto là cậu nhóc hiếu động mang trong mình Cửu Vĩ hồ ly, khát khao trở thành Hokage vĩ đại nhất làng Lá.'),
('Dragon Ball - Tập 1', 'DRB', 'TRUYEN_TRANH', 'Akira Toriyama', 'NXB Kim Đồng', 2017, 6000, 18000, 18000, 30, 14, 'dragonball1.jpg', 'Son Goku cùng bạn bè săn tìm 7 viên ngọc rồng, chiến đấu với những kẻ thù hung hãn bảo vệ Trái Đất.'),
('Kimetsu no Yaiba - Tập 1', 'KMY', 'TRUYEN_TRANH', 'Koyoharu Gotouge', 'NXB Kim Đồng', 2020, 7000, 20000, 20000, 26, 11, 'kimetsu1.jpg', 'Tanjiro trở thành thợ săn quỷ để tìm cách trả lại hình người cho em gái Nezuko bị biến thành quỷ.'),
('Tớ là Mèo', 'TLM', 'TIEU_THUYET', 'Natsume Soseki', 'NXB Hội Nhà Văn', 2014, 10000, 85000, 85000, 9, 8, 'tomela.jpg', 'Tiểu thuyết kinh điển Nhật Bản kể qua con mắt tinh nghịch của chú mèo vô danh quan sát xã hội thời Minh Trị.'),
('Đắc Nhân Tâm', 'DNT', 'TIEU_THUYET', 'Dale Carnegie', 'NXB Trẻ', 2015, 12000, 110000, 110000, 18, 25, 'dacthantam.jpg', 'Cuốn sách nổi tiếng về nghệ thuật ứng xử, giao tiếp và chinh phục lòng người, dành cho mọi đối tượng.'),
('Thép đã tôi thế đấy', 'TDT', 'TIEU_THUYET', 'Nikolai Ostrovsky', 'NXB Văn Học', 2012, 10000, 95000, 95000, 7, 10, 'theptoidothe.jpg', 'Tiểu thuyết về người chiến sĩ kiên cường, ý chí thép vượt qua nghịch cảnh, từng làm rung động các thế hệ bạn đọc.'),
('Totto-chan bên cửa sổ', 'TCB', 'TIEU_THUYET', 'Tetsuko Kuroyanagi', 'NXB Văn Học', 2016, 12000, 105000, 105000, 11, 14, 'tottochan.jpg', 'Nhật ký của cô bé Totto-chan ở trường Tomoe, nơi những đứa trẻ được học cách tự do tỏa sáng.'),
('Dế Mèn phiêu lưu ký', 'DML', 'TIEU_THUYET', 'Tô Hoài', 'NXB Kim Đồng', 2018, 9000, 70000, 70000, 16, 22, 'demen.jpg', 'Tác phẩm văn học thiếu nhi kinh điển của Việt Nam về cuộc phiêu lưu và bài học lớn lên của chú Dế Mèn.'),
('Không gia đình', 'KGD', 'TIEU_THUYET', 'Hector Malot', 'NXB Kim Đồng', 2017, 11000, 98000, 98000, 8, 9, 'khonggiadinh.jpg', 'Hành trình phiêu lưu đầy cảm động của cậu bé Rémi bị thất lạc gia đình trong thời gian dài.'),
('Hoàng tử bé', 'HPB', 'TIEU_THUYET', 'Antoine de Saint-Exupéry', 'NXB Hội Nhà Văn', 2019, 12000, 90000, 90000, 13, 19, 'hoangtube.jpg', 'Câu chuyện ngụ ngôn triết lý dịu dàng về tình bạn, tình yêu và ý nghĩa của sự trưởng thành.'),
('Số đỏ', 'SDO', 'TIEU_THUYET', 'Vũ Trọng Phụng', 'NXB Văn Học', 2011, 10000, 88000, 88000, 6, 8, 'sodo.jpg', 'Tác phẩm trào phúng xuất sắc mỉa mai xã hội thượng lưu Việt Nam những năm 1930 qua nhân vật Xuân Tóc Đỏ.'),
('Truyện ngụ ngôn Aesop', 'NGN', 'TRUYEN_NGAN', 'Aesop', 'NXB Kim Đồng', 2016, 5000, 45000, 45000, 20, 26, 'ngungon.jpg', 'Hơn 100 truyện ngụ ngôn ngắn gọn, sâu sắc về bài học cuộc sống qua loài vật, phù hợp mọi lứa tuổi.'),
('Truyện cổ tích Việt Nam chọn lọc', 'CTV', 'TRUYEN_NGAN', 'Nhiều tác giả', 'NXB Kim Đồng', 2019, 6000, 55000, 55000, 25, 30, 'cotichvn.jpg', 'Tuyển tập các câu chuyện cổ tích quen thuộc gắn liền tuổi thơ người Việt: Tấm Cám, Cây tre trăm đốt, Thạch Sanh...'),
('Những tấm lòng cao cả', 'TLC', 'TIEU_THUYET', 'Edmondo De Amicis', 'NXB Kim Đồng', 2015, 10000, 85000, 85000, 12, 16, 'tamlongcaoca.jpg', 'Nhật ký của cậu bé Enrico về tình thầy trò, tình bạn và lòng nhân ái trong nhà trường.'),
('Cuốn theo chiều gió', 'CTG', 'TIEU_THUYET', 'Margaret Mitchell', 'NXB Văn Học', 2010, 15000, 150000, 150000, 14, 12, 'cuontheochiogio.jpg', 'Bộ tiểu thuyết nổi tiếng nhất nước Mỹ về nàng Scarlett O’Hara giữa cuộc Nội chiến tàn khốc.'),
('Rừng Na Uy', 'RNY', 'TIEU_THUYET', 'Haruki Murakami', 'NXB Hội Nhà Văn', 2013, 13000, 115000, 115000, 10, 13, 'rungnauy.jpg', 'Tiểu thuyết tình yêu đầy ám ảnh của Haruki Murakami về ký ức tuổi trẻ, mất mát và hồi ức.'),
('Cây cam ngọt của tôi', 'CCN', 'TIEU_THUYET', 'José Mauro de Vasconcelos', 'NXB Hội Nhà Văn', 2018, 12000, 100000, 100000, 21, 18, 'caycamngot.jpg', 'Câu chuyện rưng rưng nước mắt về cậu bé Zezé nghèo khó và người bạn đặc biệt là cây cam ngọt.'),
('Moby Dick', 'MBY', 'TIEU_THUYET', 'Herman Melville', 'NXB Văn Học', 2012, 14000, 130000, 130000, 5, 7, 'mobydick.jpg', 'Đại sử thi về chuyến đi săn cá voi trắng Moby Dick, biểu tượng của tham vọng và bi kịch con người.'),
('Trở về tuổi thơ', 'TVT', 'TRUYEN_NGAN', 'Nguyễn Nhật Ánh', 'NXB Trẻ', 2020, 8000, 65000, 65000, 19, 24, 'trovetuoitho.jpg', 'Tuyển tập truyện ngắn Nguyễn Nhật Ánh chở cả bầu trời ký ức tuổi học trò cho bạn đọc.');

-- 6b. ĐA THỂ LOẠI (N-N: mỗi truyện gắn với 1 hoặc nhiều thể loại nội dung)
INSERT INTO TruyenTheLoai (ma_truyen, ma_the_loai) VALUES
(1, 3), (1, 8), (1, 6),
(2, 2), (2, 1), (2, 3),
(3, 5), (3, 9),
(4, 2), (4, 5),
(5, 1), (5, 5),
(6, 1), (6, 5),
(7, 1), (7, 6),
(8, 1), (8, 4), (8, 5),
(9, 3), (9, 9),
(10, 7), (10, 9),
(11, 7), (11, 9),
(12, 7), (12, 8),
(13, 5), (13, 8),
(14, 5), (14, 7), (14, 8),
(15, 8), (15, 9),
(16, 3), (16, 9),
(17, 8), (17, 9),
(18, 8),
(19, 7), (19, 8),
(20, 7),
(21, 7), (21, 9),
(22, 7), (22, 8),
(23, 5), (23, 9),
(24, 8), (24, 9);

-- 7. NHÀ CUNG CẤP
INSERT INTO NhaCungCap (ten_ncc, dia_chi, so_dien_thoai, email) VALUES
('NXB Kim Đồng', 'Hà Nội', '0240000001', 'nxbkimdong@example.com'),
('Nhà sách FAHASA', 'TP. HCM', '0280000002', 'fahasa@example.com'),
('NXB Trẻ', 'TP. HCM', '0280000003', 'nxbtre@example.com'),
('NXB Văn Học', 'Hà Nội', '0240000004', 'nxbvanhoc@example.com'),
('NXB Hội Nhà Văn', 'Hà Nội', '0240000005', 'hoinhavan@example.com');

-- 8. PHIẾU NHẬP KHO + CHI TIẾT + BẢN SAO (48 bản sao: truyện 1-4 mỗi bộ 3/2/2/1; truyện 5-24 mỗi bộ 2)
INSERT INTO PhieuNhapKho (ma_ncc, ma_quan_tri_vien, tong_tien) VALUES
(1, 1, 224000),
(1, 1, 636000),
(3, 1, 968000);

INSERT INTO ChiTietPhieuNhapKho (ma_phieu_nhap, ma_truyen, tap, so_luong, gia_nhap) VALUES
-- Phiếu 1: truyện 1-4
(1, 1, 1, 3, 10000),
(1, 2, 95, 2, 12000),
(1, 3, 1, 2, 50000),
(1, 4, 1, 1, 70000),
-- Phiếu 2: truyện 5-14
(2, 5, 1, 2, 9000),
(2, 6, 1, 2, 8000),
(2, 7, 1, 2, 8000),
(2, 8, 1, 2, 9000),
(2, 9, 1, 2, 45000),
(2, 10, 1, 2, 55000),
(2, 11, 1, 2, 48000),
(2, 12, 1, 2, 52000),
(2, 13, 1, 2, 35000),
(2, 14, 1, 2, 49000),
-- Phiếu 3: truyện 15-24
(3, 15, 1, 2, 52000),
(3, 16, 1, 2, 48000),
(3, 17, 1, 2, 22000),
(3, 18, 1, 2, 26000),
(3, 19, 1, 2, 45000),
(3, 20, 1, 2, 78000),
(3, 21, 1, 2, 60000),
(3, 22, 1, 2, 52000),
(3, 23, 1, 2, 68000),
(3, 24, 1, 2, 33000);

INSERT INTO BanSao (ma_ban_sao, ma_truyen, ma_chi_tiet_nhap, tap, vi_tri_ke, tinh_trang_hien_tai, trang_thai) VALUES
('DRM-T01-001', 1, 1, 1, 'Kệ A1', 'moi', 'san_sang'),
('DRM-T01-002', 1, 1, 1, 'Kệ A1', 'moi', 'san_sang'),
('DRM-T01-003', 1, 1, 1, 'Kệ A1', 'cu', 'san_sang'),
('CN-T95-001', 2, 2, 95, 'Kệ A2', 'moi', 'san_sang'),
('CN-T95-002', 2, 2, 95, 'Kệ A2', 'moi', 'san_sang'),
('NGK-T01-001', 3, 3, 1, 'Kệ B1', 'moi', 'san_sang'),
('NGK-T01-002', 3, 3, 1, 'Kệ B1', 'cu', 'san_sang'),
('SHL-T01-001', 4, 4, 1, 'Kệ B2', 'moi', 'san_sang'),
('OPN-T01-001', 5, 5, 1, 'Kệ C1', 'moi', 'san_sang'),
('OPN-T01-002', 5, 5, 1, 'Kệ C1', 'moi', 'san_sang'),
('NRT-T01-001', 6, 6, 1, 'Kệ C2', 'moi', 'san_sang'),
('NRT-T01-002', 6, 6, 1, 'Kệ C2', 'moi', 'san_sang'),
('DRB-T01-001', 7, 7, 1, 'Kệ C3', 'moi', 'san_sang'),
('DRB-T01-002', 7, 7, 1, 'Kệ C3', 'moi', 'san_sang'),
('KMY-T01-001', 8, 8, 1, 'Kệ C4', 'moi', 'san_sang'),
('KMY-T01-002', 8, 8, 1, 'Kệ C4', 'moi', 'san_sang'),
('TLM-T01-001', 9, 9, 1, 'Kệ D1', 'moi', 'san_sang'),
('TLM-T01-002', 9, 9, 1, 'Kệ D1', 'moi', 'san_sang'),
('DNT-T01-001', 10, 10, 1, 'Kệ D2', 'moi', 'san_sang'),
('DNT-T01-002', 10, 10, 1, 'Kệ D2', 'moi', 'san_sang'),
('TDT-T01-001', 11, 11, 1, 'Kệ D3', 'moi', 'san_sang'),
('TDT-T01-002', 11, 11, 1, 'Kệ D3', 'moi', 'san_sang'),
('TCB-T01-001', 12, 12, 1, 'Kệ D4', 'moi', 'san_sang'),
('TCB-T01-002', 12, 12, 1, 'Kệ D4', 'moi', 'san_sang'),
('DML-T01-001', 13, 13, 1, 'Kệ E1', 'moi', 'san_sang'),
('DML-T01-002', 13, 13, 1, 'Kệ E1', 'moi', 'san_sang'),
('KGD-T01-001', 14, 14, 1, 'Kệ E2', 'moi', 'san_sang'),
('KGD-T01-002', 14, 14, 1, 'Kệ E2', 'moi', 'san_sang'),
('HPB-T01-001', 15, 15, 1, 'Kệ E3', 'moi', 'san_sang'),
('HPB-T01-002', 15, 15, 1, 'Kệ E3', 'moi', 'san_sang'),
('SDO-T01-001', 16, 16, 1, 'Kệ E4', 'moi', 'san_sang'),
('SDO-T01-002', 16, 16, 1, 'Kệ E4', 'moi', 'san_sang'),
('NGN-T01-001', 17, 17, 1, 'Kệ F1', 'moi', 'san_sang'),
('NGN-T01-002', 17, 17, 1, 'Kệ F1', 'moi', 'san_sang'),
('CTV-T01-001', 18, 18, 1, 'Kệ F2', 'moi', 'san_sang'),
('CTV-T01-002', 18, 18, 1, 'Kệ F2', 'moi', 'san_sang'),
('TLC-T01-001', 19, 19, 1, 'Kệ F3', 'moi', 'san_sang'),
('TLC-T01-002', 19, 19, 1, 'Kệ F3', 'moi', 'san_sang'),
('CTG-T01-001', 20, 20, 1, 'Kệ F4', 'moi', 'san_sang'),
('CTG-T01-002', 20, 20, 1, 'Kệ F4', 'moi', 'san_sang'),
('RNY-T01-001', 21, 21, 1, 'Kệ G1', 'moi', 'san_sang'),
('RNY-T01-002', 21, 21, 1, 'Kệ G1', 'moi', 'san_sang'),
('CCN-T01-001', 22, 22, 1, 'Kệ G2', 'moi', 'san_sang'),
('CCN-T01-002', 22, 22, 1, 'Kệ G2', 'moi', 'san_sang'),
('MBY-T01-001', 23, 23, 1, 'Kệ G3', 'moi', 'san_sang'),
('MBY-T01-002', 23, 23, 1, 'Kệ G3', 'moi', 'san_sang'),
('TVT-T01-001', 24, 24, 1, 'Kệ G4', 'moi', 'san_sang'),
('TVT-T01-002', 24, 24, 1, 'Kệ G4', 'moi', 'san_sang');

-- 9. CHƯƠNG TRÌNH GIẢM GIÁ
INSERT INTO SuKienGiamGia (ten_su_kien, kieu_giam, gia_tri, pham_vi, ma_the_loai, ngay_bat_dau, ngay_ket_thuc, ma_quan_tri_vien) VALUES
('Khai trương - giảm 10%', 'phan_tram', 10, 'the_loai', 2, '2026-01-01', '2026-12-31', 1),
('Tết 2026 - giảm 20k', 'so_tien', 20000, 'toan_bo', NULL, '2026-01-25', '2026-02-10', 1);

-- 10. SỞ THÍCH + YÊU THÍCH + ĐÁNH GIÁ MẪU (khách hàng #1 - Vũ Ngọc Vy)
INSERT INTO KhachHangSoThich (ma_khach_hang, ma_the_loai) VALUES (1, 1), (1, 2);

INSERT INTO YeuThich (ma_khach_hang, ma_truyen) VALUES (1, 1), (1, 2), (1, 5);

INSERT INTO DanhGia (ma_khach_hang, ma_truyen, so_sao, noi_dung) VALUES
(1, 1, 5, 'Truyện rất hay, con mình rất thích.'),
(1, 2, 4, 'Nội dung hấp dẫn, bản in đẹp.'),
(1, 3, 5, 'Một cuốn sách đáng đọc một lần trong đời.'),
(1, 5, 5, 'Hài hước, vui nhộn, con mình thích mê.'),
(1, 6, 4, 'Cốt truyện cuốn hút, mang đậm chất ninja.');

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