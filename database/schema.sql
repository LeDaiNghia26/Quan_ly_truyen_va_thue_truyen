-- ============================================================
-- ỨNG DỤNG QUẢN LÝ TRUYỆN VÀ CHO THUÊ TRUYỆN
-- Database: quanlytruyen | MySQL 8.4
-- ============================================================

CREATE DATABASE IF NOT EXISTS quanlytruyen
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quanlytruyen;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS YeuThich;
DROP TABLE IF EXISTS DanhGia;
DROP TABLE IF EXISTS MaXacThuc;
DROP TABLE IF EXISTS LichSuDiem;
DROP TABLE IF EXISTS KhachHangSoThich;
DROP TABLE IF EXISTS ThongBao;
DROP TABLE IF EXISTS TruyenTheLoai;
DROP TABLE IF EXISTS PhieuBaoTri;
DROP TABLE IF EXISTS ThongBaoAdmin;
DROP TABLE IF EXISTS QuyDoiDiem;
DROP TABLE IF EXISTS HangThanhVien;
DROP TABLE IF EXISTS SuKienGiamGia;
DROP TABLE IF EXISTS ChiTietPhieuBan;
DROP TABLE IF EXISTS PhieuBan;
DROP TABLE IF EXISTS PhieuTra;
DROP TABLE IF EXISTS ChiTietPhieuThue;
DROP TABLE IF EXISTS PhieuThue;
DROP TABLE IF EXISTS ChiTietDatTruoc;
DROP TABLE IF EXISTS DatTruoc;
DROP TABLE IF EXISTS BanSao;
DROP TABLE IF EXISTS ChiTietPhieuNhapKho;
DROP TABLE IF EXISTS PhieuNhapKho;
DROP TABLE IF EXISTS NhaCungCap;
DROP TABLE IF EXISTS Truyen;
DROP TABLE IF EXISTS TheLoai;
DROP TABLE IF EXISTS QuanTriVien;
DROP TABLE IF EXISTS NhanVien;
DROP TABLE IF EXISTS KhachHang;
DROP TABLE IF EXISTS TaiKhoan;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. TÀI KHOẢN
-- ------------------------------------------------------------
CREATE TABLE TaiKhoan (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(100) UNIQUE,
  so_dien_thoai VARCHAR(15) UNIQUE,
  mat_khau      VARCHAR(255) NOT NULL,
  vai_tro       ENUM('admin','staff','customer') NOT NULL,
  trang_thai    ENUM('hoat_dong','khoa') DEFAULT 'hoat_dong',
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. KHÁCH HÀNG
-- ------------------------------------------------------------
CREATE TABLE KhachHang (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan  INT UNIQUE NOT NULL,
  ho_ten        VARCHAR(100) NOT NULL,
  dia_chi       VARCHAR(255),
  ngay_sinh     DATE,
  anh_dai_dien  VARCHAR(255),
  diem_tich_luy INT NOT NULL DEFAULT 0,
  tong_diem_tich_luy INT NOT NULL DEFAULT 0,
  hang_thanh_vien ENUM('thuong','than_thiet','vip') DEFAULT 'thuong',
  FOREIGN KEY (ma_tai_khoan) REFERENCES TaiKhoan(id)
);

-- ------------------------------------------------------------
-- 3. NHÂN VIÊN
-- ------------------------------------------------------------
CREATE TABLE NhanVien (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan INT UNIQUE NOT NULL,
  ho_ten       VARCHAR(100) NOT NULL,
  chuc_vu      VARCHAR(50),
  FOREIGN KEY (ma_tai_khoan) REFERENCES TaiKhoan(id)
);

-- ------------------------------------------------------------
-- 4. QUẢN TRỊ VIÊN
-- ------------------------------------------------------------
CREATE TABLE QuanTriVien (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan INT UNIQUE NOT NULL,
  ho_ten       VARCHAR(100) NOT NULL,
  chuc_vu      VARCHAR(50),
  FOREIGN KEY (ma_tai_khoan) REFERENCES TaiKhoan(id)
);

-- ------------------------------------------------------------
-- 5. THỂ LOẠI
-- ------------------------------------------------------------
CREATE TABLE TheLoai (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ten_the_loai  VARCHAR(100) UNIQUE NOT NULL,
  mo_ta         VARCHAR(255),
  trang_thai    ENUM('hoat_dong','ngung_hoat_dong') DEFAULT 'hoat_dong'
);

-- ------------------------------------------------------------
-- 6. TRUYỆN
-- ------------------------------------------------------------
CREATE TABLE Truyen (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ten_truyen  VARCHAR(150) NOT NULL,
  ma_viet_tat VARCHAR(20) UNIQUE,
  loai        ENUM('TRUYEN_TRANH','TIEU_THUYET','TRUYEN_NGAN','LIGHT_NOVEL') NOT NULL DEFAULT 'TRUYEN_TRANH',
  tac_gia     VARCHAR(100),
  nha_xuat_ban VARCHAR(150),
  nam_xuat_ban INT,
  gia_thue    DECIMAL(10,2) NOT NULL,
  gia_ban     DECIMAL(10,2) NOT NULL,
  tien_coc    DECIMAL(10,2) NOT NULL DEFAULT 0,
  luot_thue   INT NOT NULL DEFAULT 0,
  luot_mua    INT NOT NULL DEFAULT 0,
  anh_bia     VARCHAR(255),
  mo_ta       TEXT,
  trang_thai  ENUM('hoat_dong','ngung_kinh_doanh') DEFAULT 'hoat_dong'
);

-- ------------------------------------------------------------
-- 7. BẢN SAO TRUYỆN
-- ------------------------------------------------------------
CREATE TABLE BanSao (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  ma_ban_sao         VARCHAR(30) UNIQUE NOT NULL,
  ma_truyen          INT NOT NULL,
  ma_chi_tiet_nhap   INT,
  tap                INT NOT NULL DEFAULT 1,
  vi_tri_ke          VARCHAR(50),
  tinh_trang_hien_tai ENUM('moi','tot','cu','hu_hong') DEFAULT 'moi',
  trang_thai         ENUM('san_sang','dang_giu','dang_cho_thue','da_ban','ngung_luu_hanh','bao_tri') DEFAULT 'san_sang',
  ngay_nhap          DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_truyen) REFERENCES Truyen(id)
);

-- ------------------------------------------------------------
-- 8. NHÀ CUNG CẤP
-- ------------------------------------------------------------
CREATE TABLE NhaCungCap (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ten_ncc       VARCHAR(150) NOT NULL,
  dia_chi       VARCHAR(255),
  so_dien_thoai VARCHAR(15),
  email         VARCHAR(100),
  trang_thai    ENUM('hoat_dong','ngung_hop_tac') DEFAULT 'hoat_dong'
);

-- ------------------------------------------------------------
-- 9. PHIẾU NHẬP KHO
-- ------------------------------------------------------------
CREATE TABLE PhieuNhapKho (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ma_ncc           INT NOT NULL,
  ma_quan_tri_vien INT NOT NULL,
  ngay_nhap        DATETIME DEFAULT CURRENT_TIMESTAMP,
  tong_tien        DECIMAL(12,2),
  FOREIGN KEY (ma_ncc) REFERENCES NhaCungCap(id),
  FOREIGN KEY (ma_quan_tri_vien) REFERENCES QuanTriVien(id)
);

-- ------------------------------------------------------------
-- 10. CHI TIẾT PHIẾU NHẬP KHO
-- ------------------------------------------------------------
CREATE TABLE ChiTietPhieuNhapKho (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_phieu_nhap INT NOT NULL,
  ma_truyen     INT NOT NULL,
  tap           INT NOT NULL DEFAULT 1,
  so_luong      INT NOT NULL,
  gia_nhap      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (ma_phieu_nhap) REFERENCES PhieuNhapKho(id),
  FOREIGN KEY (ma_truyen) REFERENCES Truyen(id)
);

-- ------------------------------------------------------------
-- 11. ĐẶT TRƯỚC
-- ------------------------------------------------------------
CREATE TABLE DatTruoc (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT NOT NULL,
  loai          ENUM('thue','mua') NOT NULL,
  ngay_dat      DATETIME DEFAULT CURRENT_TIMESTAMP,
  han_nhan      DATETIME NOT NULL,
  khung_gio     VARCHAR(30),
  ma_su_kien    INT,
  diem_su_dung  INT NOT NULL DEFAULT 0,
  so_tien_giam  DECIMAL(12,2) NOT NULL DEFAULT 0,
  gia_goc       DECIMAL(12,2) NOT NULL DEFAULT 0,
  phan_tram_giam_hang DECIMAL(5,2) NOT NULL DEFAULT 0,
  tien_coc      DECIMAL(12,2) NOT NULL DEFAULT 0,
  trang_thai    ENUM('cho_nhan','da_xac_nhan','da_huy','qua_han') DEFAULT 'cho_nhan',
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id)
);

-- ------------------------------------------------------------
-- 12. CHI TIẾT ĐẶT TRƯỚC
-- ------------------------------------------------------------
CREATE TABLE ChiTietDatTruoc (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_dat_truoc  INT NOT NULL,
  ma_ban_sao    INT NOT NULL,
  FOREIGN KEY (ma_dat_truoc) REFERENCES DatTruoc(id),
  FOREIGN KEY (ma_ban_sao) REFERENCES BanSao(id)
);

-- ------------------------------------------------------------
-- 13. PHIẾU THUÊ
-- ------------------------------------------------------------
CREATE TABLE PhieuThue (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT,
  ten_khach_le  VARCHAR(100),
  sdt_khach_le  VARCHAR(15),
  ma_nhan_vien  INT NOT NULL,
  ma_dat_truoc  INT,
  ngay_thue     DATETIME DEFAULT CURRENT_TIMESTAMP,
  trang_thai    VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
  phuong_thuc_thanh_toan ENUM('tien_mat','chuyen_khoan') NOT NULL DEFAULT 'tien_mat',
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id),
  FOREIGN KEY (ma_nhan_vien) REFERENCES NhanVien(id),
  FOREIGN KEY (ma_dat_truoc) REFERENCES DatTruoc(id)
);

-- ------------------------------------------------------------
-- 14. CHI TIẾT PHIẾU THUÊ
-- ------------------------------------------------------------
CREATE TABLE ChiTietPhieuThue (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  ma_phieu_thue   INT NOT NULL,
  ma_ban_sao      INT NOT NULL,
  ma_su_kien      INT,
  don_gia         DECIMAL(10,2) NOT NULL,
  tien_coc        DECIMAL(10,2) NOT NULL DEFAULT 0,
  ngay_hen_tra    DATE NOT NULL,
  tinh_trang_giao ENUM('moi','tot','cu') NOT NULL,
  trang_thai      ENUM('dang_thue','da_tra','mat') DEFAULT 'dang_thue',
  FOREIGN KEY (ma_phieu_thue) REFERENCES PhieuThue(id),
  FOREIGN KEY (ma_ban_sao) REFERENCES BanSao(id)
);

-- ------------------------------------------------------------
-- 15. PHIẾU TRẢ
-- ------------------------------------------------------------
CREATE TABLE PhieuTra (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  ma_chi_tiet_phieu_thue INT UNIQUE NOT NULL,
  ngay_tra             DATETIME DEFAULT CURRENT_TIMESTAMP,
  tinh_trang_nhan      ENUM('tot','tre_han','hu_nhe','hu_nang_mat') NOT NULL,
  phi_phat_sinh        DECIMAL(10,2) DEFAULT 0,
  so_tien_hoan_coc     DECIMAL(10,2) NOT NULL DEFAULT 0,
  so_tien_khach_tra_them DECIMAL(10,2) NOT NULL DEFAULT 0,
  ghi_chu              VARCHAR(255),
  phuong_thuc_thanh_toan ENUM('tien_mat','chuyen_khoan') NOT NULL DEFAULT 'tien_mat',
  FOREIGN KEY (ma_chi_tiet_phieu_thue) REFERENCES ChiTietPhieuThue(id)
);

-- ------------------------------------------------------------
-- 16. PHIẾU BÁN
-- ------------------------------------------------------------
CREATE TABLE PhieuBan (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT,
  ten_khach_le  VARCHAR(100),
  sdt_khach_le  VARCHAR(15),
  ma_nhan_vien  INT NOT NULL,
  ma_dat_truoc  INT,
  ngay_ban      DATETIME DEFAULT CURRENT_TIMESTAMP,
  trang_thai    VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
  phuong_thuc_thanh_toan ENUM('tien_mat','chuyen_khoan') NOT NULL DEFAULT 'tien_mat',
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id),
  FOREIGN KEY (ma_nhan_vien) REFERENCES NhanVien(id),
  FOREIGN KEY (ma_dat_truoc) REFERENCES DatTruoc(id)
);

-- ------------------------------------------------------------
-- 17. CHI TIẾT PHIẾU BÁN
-- ------------------------------------------------------------
CREATE TABLE ChiTietPhieuBan (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  ma_phieu_ban         INT NOT NULL,
  ma_ban_sao           INT NOT NULL,
  ma_su_kien           INT,
  gia_goc              DECIMAL(10,2) NOT NULL,
  phan_tram_giam_hang  DECIMAL(5,2) DEFAULT 0,
  so_tien_giam_su_kien DECIMAL(10,2) DEFAULT 0,
  diem_da_dung         INT DEFAULT 0,
  thanh_tien           DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (ma_phieu_ban) REFERENCES PhieuBan(id),
  FOREIGN KEY (ma_ban_sao) REFERENCES BanSao(id)
);

-- ------------------------------------------------------------
-- 18. CHƯƠNG TRÌNH GIẢM GIÁ
-- ------------------------------------------------------------
CREATE TABLE SuKienGiamGia (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ten_su_kien      VARCHAR(150) NOT NULL,
  kieu_giam        ENUM('phan_tram','so_tien') NOT NULL,
  gia_tri          DECIMAL(10,2) NOT NULL,
  pham_vi          ENUM('toan_bo','the_loai','truyen') NOT NULL,
  ma_the_loai      INT,
  ma_truyen        INT,
  ngay_bat_dau     DATETIME NOT NULL,
  ngay_ket_thuc    DATETIME NOT NULL,
  ma_quan_tri_vien INT NOT NULL,
  trang_thai       ENUM('hoat_dong','ket_thuc','huy') DEFAULT 'hoat_dong',
  FOREIGN KEY (ma_the_loai) REFERENCES TheLoai(id),
  FOREIGN KEY (ma_truyen) REFERENCES Truyen(id),
  FOREIGN KEY (ma_quan_tri_vien) REFERENCES QuanTriVien(id)
);

-- ------------------------------------------------------------
-- 19. YÊU THÍCH (WISHLIST)
-- ------------------------------------------------------------
CREATE TABLE YeuThich (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT NOT NULL,
  ma_truyen     INT NOT NULL,
  ngay_them     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_yeu_thich (ma_khach_hang, ma_truyen),
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id),
  FOREIGN KEY (ma_truyen) REFERENCES Truyen(id)
);

-- ------------------------------------------------------------
-- 20. ĐÁNH GIÁ
-- ------------------------------------------------------------
CREATE TABLE DanhGia (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT NOT NULL,
  ma_truyen     INT NOT NULL,
  so_sao        TINYINT NOT NULL,
  noi_dung      VARCHAR(500),
  ngay_danh_gia DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_danh_gia (ma_khach_hang, ma_truyen),
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id),
  FOREIGN KEY (ma_truyen) REFERENCES Truyen(id)
);

-- ------------------------------------------------------------
-- 21. MÃ XÁC THỰC OTP
-- ------------------------------------------------------------
CREATE TABLE MaXacThuc (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  so_dien_thoai VARCHAR(15) NOT NULL,
  ma_otp        VARCHAR(10) NOT NULL,
  loai          ENUM('dang_ky','quen_mat_khau') NOT NULL,
  han           DATETIME NOT NULL,
  da_dung       TINYINT NOT NULL DEFAULT 0,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 22. LỊCH SỬ ĐIỂM TÍCH LŨY
-- ------------------------------------------------------------
CREATE TABLE LichSuDiem (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT NOT NULL,
  so_diem       INT NOT NULL,
  ly_do         VARCHAR(255) NOT NULL,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id)
);

-- ------------------------------------------------------------
-- 23. SỞ THÍCH THỂ LOẠI CỦA KHÁCH HÀNG
-- ------------------------------------------------------------
CREATE TABLE KhachHangSoThich (
  ma_khach_hang INT NOT NULL,
  ma_the_loai   INT NOT NULL,
  PRIMARY KEY (ma_khach_hang, ma_the_loai),
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id),
  FOREIGN KEY (ma_the_loai) REFERENCES TheLoai(id)
);

-- ------------------------------------------------------------
-- 24. THÔNG BÁO
-- ------------------------------------------------------------
CREATE TABLE ThongBao (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang INT NOT NULL,
  tieu_de       VARCHAR(150) NOT NULL,
  noi_dung      VARCHAR(500) NOT NULL,
  loai          ENUM('tra_sach','dat_truoc','khuyen_mai') DEFAULT 'dat_truoc',
  ma_tham_chieu  INT,
  da_doc        TINYINT NOT NULL DEFAULT 0,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_thong_bao_kh (ma_khach_hang, loai, ma_tham_chieu),
  FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(id)
);

-- ------------------------------------------------------------
-- 25. TRUYỆN - THỂ LOẠI (quan hệ N-N: một truyện có nhiều thể loại)
-- ------------------------------------------------------------
CREATE TABLE TruyenTheLoai (
  ma_truyen   INT NOT NULL,
  ma_the_loai INT NOT NULL,
  PRIMARY KEY (ma_truyen, ma_the_loai),
  FOREIGN KEY (ma_truyen) REFERENCES Truyen(id),
  FOREIGN KEY (ma_the_loai) REFERENCES TheLoai(id)
);

-- ------------------------------------------------------------
-- 26. HẠNG THÀNH VIÊN (cấu hình)
-- ------------------------------------------------------------
CREATE TABLE HangThanhVien (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  ma_hang        VARCHAR(20) UNIQUE NOT NULL,
  ten_hang       VARCHAR(50) NOT NULL,
  nguong_diem    INT NOT NULL DEFAULT 0,
  phan_tram_giam DECIMAL(5,2) NOT NULL DEFAULT 0,
  thu_tu         INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- 27. QUY TẮC QUY ĐỔI ĐIỂM (cấu hình)
-- ------------------------------------------------------------
CREATE TABLE QuyDoiDiem (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ten_quy_tac VARCHAR(50) UNIQUE NOT NULL,
  gia_tri     DECIMAL(12,2) NOT NULL,
  mo_ta       VARCHAR(255)
);

-- ------------------------------------------------------------
-- 28. THÔNG BÁO QUẢN TRỊ
-- ------------------------------------------------------------
CREATE TABLE ThongBaoAdmin (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tieu_de       VARCHAR(150) NOT NULL,
  noi_dung      VARCHAR(500) NOT NULL,
  loai          ENUM('het_hang','hong_mat','doanh_thu','he_thong','huy_phieu') DEFAULT 'he_thong',
  ma_tham_chieu INT,
  da_doc        TINYINT NOT NULL DEFAULT 0,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tb_admin (loai, da_doc)
);

-- ------------------------------------------------------------
-- 29. PHIẾU BẢO TRÌ (chi phí)
-- ------------------------------------------------------------
CREATE TABLE PhieuBaoTri (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ma_ban_sao       INT NOT NULL,
  ngay             DATE NOT NULL,
  chi_phi          DECIMAL(12,2) NOT NULL DEFAULT 0,
  noi_dung         VARCHAR(255),
  ma_quan_tri_vien INT NOT NULL,
  ngay_tao         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ma_ban_sao) REFERENCES BanSao(id),
  FOREIGN KEY (ma_quan_tri_vien) REFERENCES QuanTriVien(id)
);

-- Khóa ngoại bổ sung cho BanSao (đặt sau khi ChiTietPhieuNhapKho tồn tại)
ALTER TABLE BanSao
  ADD CONSTRAINT fk_ban_sao_nhap
  FOREIGN KEY (ma_chi_tiet_nhap) REFERENCES ChiTietPhieuNhapKho(id);

-- Khóa ngoại bổ sung cho DatTruoc (đặt sau khi SuKienGiamGia tồn tại)
ALTER TABLE DatTruoc
  ADD CONSTRAINT fk_dat_truoc_su_kien
  FOREIGN KEY (ma_su_kien) REFERENCES SuKienGiamGia(id);

-- Lưu ý: MySQL không hỗ trợ partial index nên không thể unique chỉ trên các dòng "đang giữ".
-- Việc chống đặt trùng được xử lý ở tầng ứng dụng qua BanSao.trang_thai = 'dang_giu'.
CREATE INDEX idx_chitiet_dat_truoc_ban_sao ON ChiTietDatTruoc (ma_ban_sao);

-- ------------------------------------------------------------
-- 30. CA LÀM VIỆC (Mở ca / Chốt ca quầy của nhân viên)
-- ------------------------------------------------------------
CREATE TABLE CaLamViec (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  ma_nhan_vien        INT NOT NULL,
  thoi_gian_mo        DATETIME DEFAULT CURRENT_TIMESTAMP,
  tien_mat_dau_ca     DECIMAL(12,2) NOT NULL DEFAULT 0,
  thoi_gian_chot      DATETIME,
  tien_mat_thuc_te    DECIMAL(12,2),
  tong_tien_mat_thu   DECIMAL(12,2) NOT NULL DEFAULT 0,
  tong_tien_mat_chi   DECIMAL(12,2) NOT NULL DEFAULT 0,
  tong_tien_chuyen_khoan_thu DECIMAL(12,2) NOT NULL DEFAULT 0,
  tong_tien_chuyen_khoan_chi DECIMAL(12,2) NOT NULL DEFAULT 0,
  tien_mat_ky_vong    DECIMAL(12,2),
  chenh_lech          DECIMAL(12,2) NOT NULL DEFAULT 0,
  ghi_chu             VARCHAR(255),
  trang_thai          ENUM('mo','da_chot') NOT NULL DEFAULT 'mo',
  FOREIGN KEY (ma_nhan_vien) REFERENCES NhanVien(id)
);

-- ------------------------------------------------------------
-- 31. AUDIT LOG (Nhật ký hệ thống — truy vết hành động + lý do)
-- ------------------------------------------------------------
CREATE TABLE AuditLog (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ma_tai_khoan  INT,
  vai_tro       VARCHAR(10),
  hanh_dong     VARCHAR(100) NOT NULL,
  doi_tuong     VARCHAR(100),
  id_doi_tuong  INT,
  ly_do         VARCHAR(500),
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_hanh_dong (hanh_dong),
  KEY idx_audit_ngay (ngay_tao)
);