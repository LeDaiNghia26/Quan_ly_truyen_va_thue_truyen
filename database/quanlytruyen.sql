-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: quanlytruyen
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditlog`
--

DROP TABLE IF EXISTS `auditlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditlog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `vai_tro` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hanh_dong` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `doi_tuong` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_doi_tuong` int DEFAULT NULL,
  `ly_do` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_hanh_dong` (`hanh_dong`),
  KEY `idx_audit_ngay` (`ngay_tao`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlog`
--

LOCK TABLES `auditlog` WRITE;
/*!40000 ALTER TABLE `auditlog` DISABLE KEYS */;
INSERT INTO `auditlog` VALUES (1,1,'admin','mo_ca','ca_lam_viec',1,'Tiền mặt đầu ca: 0','2026-09-29 09:22:49'),(2,2,'staff','huy_dat_truoc','dat_truoc',8,'Don tao khi kiem thu, huy ngay','2026-10-03 10:24:43'),(3,2,'staff','huy_dat_truoc','dat_truoc',7,'Don tao khi kiem thu, huy ngay','2026-10-03 10:24:43'),(4,2,'staff','huy_dat_truoc','dat_truoc',6,'Don tao khi kiem thu, huy ngay','2026-10-03 10:24:43'),(5,2,'staff','huy_dat_truoc','dat_truoc',12,'Don tao khi kiem thu, huy ngay','2026-10-03 10:30:06'),(6,2,'staff','huy_dat_truoc','dat_truoc',11,'Don tao khi kiem thu, huy ngay','2026-10-03 10:30:06'),(7,2,'staff','huy_dat_truoc','dat_truoc',10,'Don tao khi kiem thu, huy ngay','2026-10-03 10:30:06'),(8,2,'staff','mo_ca','ca_lam_viec',2,'Tiền mặt đầu ca: 0','2026-10-03 11:54:54');
/*!40000 ALTER TABLE `auditlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bansao`
--

DROP TABLE IF EXISTS `bansao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bansao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_ban_sao` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_truyen` int NOT NULL,
  `ma_chi_tiet_nhap` int DEFAULT NULL,
  `tap` int NOT NULL DEFAULT '1',
  `vi_tri_ke` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tinh_trang_hien_tai` enum('moi','tot','cu','hu_hong') COLLATE utf8mb4_unicode_ci DEFAULT 'moi',
  `trang_thai` enum('san_sang','dang_giu','dang_cho_thue','da_ban','ngung_luu_hanh','bao_tri') COLLATE utf8mb4_unicode_ci DEFAULT 'san_sang',
  `ngay_nhap` datetime DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_ban_sao` (`ma_ban_sao`),
  KEY `ma_truyen` (`ma_truyen`),
  KEY `fk_ban_sao_nhap` (`ma_chi_tiet_nhap`),
  CONSTRAINT `bansao_ibfk_1` FOREIGN KEY (`ma_truyen`) REFERENCES `truyen` (`id`),
  CONSTRAINT `fk_ban_sao_nhap` FOREIGN KEY (`ma_chi_tiet_nhap`) REFERENCES `chitietphieunhapkho` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bansao`
--

LOCK TABLES `bansao` WRITE;
/*!40000 ALTER TABLE `bansao` DISABLE KEYS */;
INSERT INTO `bansao` VALUES (1,'DRM-T01-001',1,1,1,'Kệ A1','moi','san_sang','2026-09-28 22:14:44','2026-10-03 12:01:44'),(2,'DRM-T01-002',1,1,1,'Kệ A1','moi','san_sang','2026-09-28 22:14:44','2026-10-03 10:30:06'),(3,'DRM-T01-003',1,1,1,'Kệ A1','cu','san_sang','2026-09-28 22:14:44','2026-10-03 10:30:06'),(4,'CN-T95-001',2,2,95,'Kệ A2','moi','san_sang','2026-09-28 22:14:44','2026-10-03 11:55:50'),(5,'CN-T95-002',2,2,95,'Kệ A2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(6,'NGK-T01-001',3,3,1,'Kệ B1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(7,'NGK-T01-002',3,3,1,'Kệ B1','cu','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(8,'SHL-T01-001',4,4,1,'Kệ B2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(9,'OPN-T01-001',5,5,1,'Kệ C1','moi','san_sang','2026-09-28 22:14:44','2026-10-03 10:20:06'),(10,'OPN-T01-002',5,5,1,'Kệ C1','moi','dang_cho_thue','2026-09-28 22:14:44','2026-09-29 09:23:07'),(11,'NRT-T01-001',6,6,1,'Kệ C2','moi','san_sang','2026-09-28 22:14:44','2026-09-29 09:16:34'),(12,'NRT-T01-002',6,6,1,'Kệ C2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(13,'DRB-T01-001',7,7,1,'Kệ C3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(14,'DRB-T01-002',7,7,1,'Kệ C3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(15,'KMY-T01-001',8,8,1,'Kệ C4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(16,'KMY-T01-002',8,8,1,'Kệ C4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(17,'TLM-T01-001',9,9,1,'Kệ D1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(18,'TLM-T01-002',9,9,1,'Kệ D1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(19,'DNT-T01-001',10,10,1,'Kệ D2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(20,'DNT-T01-002',10,10,1,'Kệ D2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(21,'TDT-T01-001',11,11,1,'Kệ D3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(22,'TDT-T01-002',11,11,1,'Kệ D3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(23,'TCB-T01-001',12,12,1,'Kệ D4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(24,'TCB-T01-002',12,12,1,'Kệ D4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(25,'DML-T01-001',13,13,1,'Kệ E1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(26,'DML-T01-002',13,13,1,'Kệ E1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(27,'KGD-T01-001',14,14,1,'Kệ E2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(28,'KGD-T01-002',14,14,1,'Kệ E2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(29,'HPB-T01-001',15,15,1,'Kệ E3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(30,'HPB-T01-002',15,15,1,'Kệ E3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(31,'SDO-T01-001',16,16,1,'Kệ E4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(32,'SDO-T01-002',16,16,1,'Kệ E4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(33,'NGN-T01-001',17,17,1,'Kệ F1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(34,'NGN-T01-002',17,17,1,'Kệ F1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(35,'CTV-T01-001',18,18,1,'Kệ F2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(36,'CTV-T01-002',18,18,1,'Kệ F2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(37,'TLC-T01-001',19,19,1,'Kệ F3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(38,'TLC-T01-002',19,19,1,'Kệ F3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(39,'CTG-T01-001',20,20,1,'Kệ F4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(40,'CTG-T01-002',20,20,1,'Kệ F4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(41,'RNY-T01-001',21,21,1,'Kệ G1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(42,'RNY-T01-002',21,21,1,'Kệ G1','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(43,'CCN-T01-001',22,22,1,'Kệ G2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(44,'CCN-T01-002',22,22,1,'Kệ G2','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(45,'MBY-T01-001',23,23,1,'Kệ G3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(46,'MBY-T01-002',23,23,1,'Kệ G3','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(47,'TVT-T01-001',24,24,1,'Kệ G4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44'),(48,'TVT-T01-002',24,24,1,'Kệ G4','moi','san_sang','2026-09-28 22:14:44','2026-09-28 22:14:44');
/*!40000 ALTER TABLE `bansao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calamviec`
--

DROP TABLE IF EXISTS `calamviec`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calamviec` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_nhan_vien` int NOT NULL,
  `thoi_gian_mo` datetime DEFAULT CURRENT_TIMESTAMP,
  `tien_mat_dau_ca` decimal(12,2) NOT NULL DEFAULT '0.00',
  `thoi_gian_chot` datetime DEFAULT NULL,
  `tien_mat_thuc_te` decimal(12,2) DEFAULT NULL,
  `tong_tien_mat_thu` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tong_tien_mat_chi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tong_tien_chuyen_khoan_thu` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tong_tien_chuyen_khoan_chi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tien_mat_ky_vong` decimal(12,2) DEFAULT NULL,
  `chenh_lech` decimal(12,2) NOT NULL DEFAULT '0.00',
  `ghi_chu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('mo','da_chot') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mo',
  PRIMARY KEY (`id`),
  KEY `ma_nhan_vien` (`ma_nhan_vien`),
  CONSTRAINT `calamviec_ibfk_1` FOREIGN KEY (`ma_nhan_vien`) REFERENCES `nhanvien` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calamviec`
--

LOCK TABLES `calamviec` WRITE;
/*!40000 ALTER TABLE `calamviec` DISABLE KEYS */;
INSERT INTO `calamviec` VALUES (1,2,'2026-09-29 09:22:49',0.00,NULL,NULL,0.00,0.00,0.00,0.00,NULL,0.00,NULL,'mo'),(2,1,'2026-10-03 11:54:54',0.00,'2026-10-03 11:55:40',NULL,0.00,0.00,0.00,0.00,NULL,0.00,NULL,'mo');
/*!40000 ALTER TABLE `calamviec` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitietdattruoc`
--

DROP TABLE IF EXISTS `chitietdattruoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitietdattruoc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_dat_truoc` int NOT NULL,
  `ma_ban_sao` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_dat_truoc` (`ma_dat_truoc`),
  KEY `idx_chitiet_dat_truoc_ban_sao` (`ma_ban_sao`),
  CONSTRAINT `chitietdattruoc_ibfk_1` FOREIGN KEY (`ma_dat_truoc`) REFERENCES `dattruoc` (`id`),
  CONSTRAINT `chitietdattruoc_ibfk_2` FOREIGN KEY (`ma_ban_sao`) REFERENCES `bansao` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietdattruoc`
--

LOCK TABLES `chitietdattruoc` WRITE;
/*!40000 ALTER TABLE `chitietdattruoc` DISABLE KEYS */;
INSERT INTO `chitietdattruoc` VALUES (1,1,9),(2,2,4),(3,3,10),(4,4,11),(5,5,1),(6,6,1),(7,7,2),(8,8,3),(9,9,1),(10,10,1),(11,11,2),(12,12,3);
/*!40000 ALTER TABLE `chitietdattruoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitietphieuban`
--

DROP TABLE IF EXISTS `chitietphieuban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitietphieuban` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_phieu_ban` int NOT NULL,
  `ma_ban_sao` int NOT NULL,
  `ma_su_kien` int DEFAULT NULL,
  `gia_goc` decimal(10,2) NOT NULL,
  `phan_tram_giam_hang` decimal(5,2) DEFAULT '0.00',
  `so_tien_giam_su_kien` decimal(10,2) DEFAULT '0.00',
  `diem_da_dung` int DEFAULT '0',
  `thanh_tien` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_phieu_ban` (`ma_phieu_ban`),
  KEY `ma_ban_sao` (`ma_ban_sao`),
  CONSTRAINT `chitietphieuban_ibfk_1` FOREIGN KEY (`ma_phieu_ban`) REFERENCES `phieuban` (`id`),
  CONSTRAINT `chitietphieuban_ibfk_2` FOREIGN KEY (`ma_ban_sao`) REFERENCES `bansao` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietphieuban`
--

LOCK TABLES `chitietphieuban` WRITE;
/*!40000 ALTER TABLE `chitietphieuban` DISABLE KEYS */;
/*!40000 ALTER TABLE `chitietphieuban` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitietphieunhapkho`
--

DROP TABLE IF EXISTS `chitietphieunhapkho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitietphieunhapkho` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_phieu_nhap` int NOT NULL,
  `ma_truyen` int NOT NULL,
  `tap` int NOT NULL DEFAULT '1',
  `so_luong` int NOT NULL,
  `gia_nhap` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_phieu_nhap` (`ma_phieu_nhap`),
  KEY `ma_truyen` (`ma_truyen`),
  CONSTRAINT `chitietphieunhapkho_ibfk_1` FOREIGN KEY (`ma_phieu_nhap`) REFERENCES `phieunhapkho` (`id`),
  CONSTRAINT `chitietphieunhapkho_ibfk_2` FOREIGN KEY (`ma_truyen`) REFERENCES `truyen` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietphieunhapkho`
--

LOCK TABLES `chitietphieunhapkho` WRITE;
/*!40000 ALTER TABLE `chitietphieunhapkho` DISABLE KEYS */;
INSERT INTO `chitietphieunhapkho` VALUES (1,1,1,1,3,10000.00),(2,1,2,95,2,12000.00),(3,1,3,1,2,50000.00),(4,1,4,1,1,70000.00),(5,2,5,1,2,9000.00),(6,2,6,1,2,8000.00),(7,2,7,1,2,8000.00),(8,2,8,1,2,9000.00),(9,2,9,1,2,45000.00),(10,2,10,1,2,55000.00),(11,2,11,1,2,48000.00),(12,2,12,1,2,52000.00),(13,2,13,1,2,35000.00),(14,2,14,1,2,49000.00),(15,3,15,1,2,52000.00),(16,3,16,1,2,48000.00),(17,3,17,1,2,22000.00),(18,3,18,1,2,26000.00),(19,3,19,1,2,45000.00),(20,3,20,1,2,78000.00),(21,3,21,1,2,60000.00),(22,3,22,1,2,52000.00),(23,3,23,1,2,68000.00),(24,3,24,1,2,33000.00);
/*!40000 ALTER TABLE `chitietphieunhapkho` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitietphieuthue`
--

DROP TABLE IF EXISTS `chitietphieuthue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitietphieuthue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_phieu_thue` int NOT NULL,
  `ma_ban_sao` int NOT NULL,
  `ma_su_kien` int DEFAULT NULL,
  `don_gia` decimal(10,2) NOT NULL,
  `tien_coc` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ngay_hen_tra` date NOT NULL,
  `tinh_trang_giao` enum('moi','tot','cu') COLLATE utf8mb4_unicode_ci NOT NULL,
  `trang_thai` enum('dang_thue','da_tra','mat') COLLATE utf8mb4_unicode_ci DEFAULT 'dang_thue',
  PRIMARY KEY (`id`),
  KEY `ma_phieu_thue` (`ma_phieu_thue`),
  KEY `ma_ban_sao` (`ma_ban_sao`),
  CONSTRAINT `chitietphieuthue_ibfk_1` FOREIGN KEY (`ma_phieu_thue`) REFERENCES `phieuthue` (`id`),
  CONSTRAINT `chitietphieuthue_ibfk_2` FOREIGN KEY (`ma_ban_sao`) REFERENCES `bansao` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietphieuthue`
--

LOCK TABLES `chitietphieuthue` WRITE;
/*!40000 ALTER TABLE `chitietphieuthue` DISABLE KEYS */;
INSERT INTO `chitietphieuthue` VALUES (1,1,10,NULL,7000.00,20000.00,'2026-10-02','moi','dang_thue');
/*!40000 ALTER TABLE `chitietphieuthue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danhgia`
--

DROP TABLE IF EXISTS `danhgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhgia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int NOT NULL,
  `ma_truyen` int NOT NULL,
  `so_sao` tinyint NOT NULL,
  `noi_dung` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_danh_gia` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_danh_gia` (`ma_khach_hang`,`ma_truyen`),
  KEY `ma_truyen` (`ma_truyen`),
  CONSTRAINT `danhgia_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`),
  CONSTRAINT `danhgia_ibfk_2` FOREIGN KEY (`ma_truyen`) REFERENCES `truyen` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhgia`
--

LOCK TABLES `danhgia` WRITE;
/*!40000 ALTER TABLE `danhgia` DISABLE KEYS */;
INSERT INTO `danhgia` VALUES (1,1,1,5,'Truyện rất hay, con mình rất thích.','2026-09-28 22:14:44'),(2,1,2,4,'Nội dung hấp dẫn, bản in đẹp.','2026-09-28 22:14:44'),(3,1,3,5,'Một cuốn sách đáng đọc một lần trong đời.','2026-09-28 22:14:44'),(4,1,5,5,'Hài hước, vui nhộn, con mình thích mê.','2026-09-28 22:14:44'),(5,1,6,4,'Cốt truyện cuốn hút, mang đậm chất ninja.','2026-09-28 22:14:44');
/*!40000 ALTER TABLE `danhgia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dattruoc`
--

DROP TABLE IF EXISTS `dattruoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dattruoc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int NOT NULL,
  `loai` enum('thue','mua') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_dat` datetime DEFAULT CURRENT_TIMESTAMP,
  `han_nhan` datetime NOT NULL,
  `khung_gio` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_su_kien` int DEFAULT NULL,
  `diem_su_dung` int NOT NULL DEFAULT '0',
  `so_tien_giam` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gia_goc` decimal(12,2) NOT NULL DEFAULT '0.00',
  `phan_tram_giam_hang` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tien_coc` decimal(12,2) NOT NULL DEFAULT '0.00',
  `trang_thai` enum('cho_nhan','da_xac_nhan','da_huy','qua_han') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_nhan',
  PRIMARY KEY (`id`),
  KEY `ma_khach_hang` (`ma_khach_hang`),
  KEY `fk_dat_truoc_su_kien` (`ma_su_kien`),
  CONSTRAINT `dattruoc_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`),
  CONSTRAINT `fk_dat_truoc_su_kien` FOREIGN KEY (`ma_su_kien`) REFERENCES `sukiengiamgia` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dattruoc`
--

LOCK TABLES `dattruoc` WRITE;
/*!40000 ALTER TABLE `dattruoc` DISABLE KEYS */;
INSERT INTO `dattruoc` VALUES (1,1,'thue','2026-09-29 09:14:10','2026-09-29 23:59:00',NULL,NULL,0,0.00,7000.00,0.00,20000.00,'qua_han'),(2,1,'mua','2026-09-29 09:14:17','2026-09-29 23:59:00',NULL,NULL,0,0.00,18000.00,10.00,18000.00,'qua_han'),(3,1,'thue','2026-09-29 09:15:09','2026-09-29 23:59:00',NULL,NULL,0,0.00,7000.00,0.00,20000.00,'da_xac_nhan'),(4,1,'mua','2026-09-29 09:16:16','2026-09-29 23:59:00',NULL,NULL,0,0.00,18000.00,10.00,18000.00,'da_huy'),(5,1,'thue','2026-10-03 10:23:34','2026-12-01 16:00:00','14:00-16:00',NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(6,1,'thue','2026-10-03 10:23:34','2026-12-01 23:59:00',NULL,NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(7,1,'thue','2026-10-03 10:23:34','2026-12-01 23:59:00',NULL,NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(8,1,'thue','2026-10-03 10:23:34','2026-12-01 23:59:00',NULL,NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(9,1,'thue','2026-10-03 10:29:27','2026-12-01 16:00:00','14:00-16:00',NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(10,1,'thue','2026-10-03 10:29:28','2026-12-01 23:59:00',NULL,NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(11,1,'thue','2026-10-03 10:29:28','2026-12-01 23:59:00',NULL,NULL,0,0.00,5000.00,0.00,15000.00,'da_huy'),(12,1,'thue','2026-10-03 10:29:28','2026-12-01 23:59:00',NULL,NULL,0,0.00,5000.00,0.00,15000.00,'da_huy');
/*!40000 ALTER TABLE `dattruoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hangthanhvien`
--

DROP TABLE IF EXISTS `hangthanhvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hangthanhvien` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_hang` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_hang` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nguong_diem` int NOT NULL DEFAULT '0',
  `phan_tram_giam` decimal(5,2) NOT NULL DEFAULT '0.00',
  `thu_tu` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_hang` (`ma_hang`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hangthanhvien`
--

LOCK TABLES `hangthanhvien` WRITE;
/*!40000 ALTER TABLE `hangthanhvien` DISABLE KEYS */;
INSERT INTO `hangthanhvien` VALUES (1,'thuong','Thường',0,0.00,1),(2,'than_thiet','Thân thiết',50,5.00,2),(3,'vip','VIP',100,10.00,3);
/*!40000 ALTER TABLE `hangthanhvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khachhang`
--

DROP TABLE IF EXISTS `khachhang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khachhang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `anh_dai_dien` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diem_tich_luy` int NOT NULL DEFAULT '0',
  `tong_diem_tich_luy` int NOT NULL DEFAULT '0',
  `hang_thanh_vien` enum('thuong','than_thiet','vip') COLLATE utf8mb4_unicode_ci DEFAULT 'thuong',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `khachhang_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `taikhoan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khachhang`
--

LOCK TABLES `khachhang` WRITE;
/*!40000 ALTER TABLE `khachhang` DISABLE KEYS */;
INSERT INTO `khachhang` VALUES (1,3,'Vũ Ngọc Vy','Hà Nội',NULL,NULL,141,141,'vip');
/*!40000 ALTER TABLE `khachhang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khachhangsothich`
--

DROP TABLE IF EXISTS `khachhangsothich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khachhangsothich` (
  `ma_khach_hang` int NOT NULL,
  `ma_the_loai` int NOT NULL,
  PRIMARY KEY (`ma_khach_hang`,`ma_the_loai`),
  KEY `ma_the_loai` (`ma_the_loai`),
  CONSTRAINT `khachhangsothich_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`),
  CONSTRAINT `khachhangsothich_ibfk_2` FOREIGN KEY (`ma_the_loai`) REFERENCES `theloai` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khachhangsothich`
--

LOCK TABLES `khachhangsothich` WRITE;
/*!40000 ALTER TABLE `khachhangsothich` DISABLE KEYS */;
INSERT INTO `khachhangsothich` VALUES (1,1),(1,2);
/*!40000 ALTER TABLE `khachhangsothich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichsudiem`
--

DROP TABLE IF EXISTS `lichsudiem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichsudiem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int NOT NULL,
  `so_diem` int NOT NULL,
  `ly_do` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ma_khach_hang` (`ma_khach_hang`),
  CONSTRAINT `lichsudiem_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichsudiem`
--

LOCK TABLES `lichsudiem` WRITE;
/*!40000 ALTER TABLE `lichsudiem` DISABLE KEYS */;
INSERT INTO `lichsudiem` VALUES (1,1,7,'Tích điểm khi thuê sách (+7)','2026-09-29 09:23:07'),(2,1,14,'Tích điểm khi mua sách (+14)','2026-10-03 11:54:54');
/*!40000 ALTER TABLE `lichsudiem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maxacthuc`
--

DROP TABLE IF EXISTS `maxacthuc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maxacthuc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_otp` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai` enum('dang_ky','quen_mat_khau') COLLATE utf8mb4_unicode_ci NOT NULL,
  `han` datetime NOT NULL,
  `da_dung` tinyint NOT NULL DEFAULT '0',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maxacthuc`
--

LOCK TABLES `maxacthuc` WRITE;
/*!40000 ALTER TABLE `maxacthuc` DISABLE KEYS */;
/*!40000 ALTER TABLE `maxacthuc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhacungcap`
--

DROP TABLE IF EXISTS `nhacungcap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhacungcap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_ncc` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('hoat_dong','ngung_hop_tac') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhacungcap`
--

LOCK TABLES `nhacungcap` WRITE;
/*!40000 ALTER TABLE `nhacungcap` DISABLE KEYS */;
INSERT INTO `nhacungcap` VALUES (1,'NXB Kim Đồng','Hà Nội','0240000001','nxbkimdong@example.com','hoat_dong'),(2,'Nhà sách FAHASA','TP. HCM','0280000002','fahasa@example.com','hoat_dong'),(3,'NXB Trẻ','TP. HCM','0280000003','nxbtre@example.com','hoat_dong'),(4,'NXB Văn Học','Hà Nội','0240000004','nxbvanhoc@example.com','hoat_dong'),(5,'NXB Hội Nhà Văn','Hà Nội','0240000005','hoinhavan@example.com','hoat_dong');
/*!40000 ALTER TABLE `nhacungcap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhanvien`
--

DROP TABLE IF EXISTS `nhanvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhanvien` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chuc_vu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `nhanvien_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `taikhoan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhanvien`
--

LOCK TABLES `nhanvien` WRITE;
/*!40000 ALTER TABLE `nhanvien` DISABLE KEYS */;
INSERT INTO `nhanvien` VALUES (1,2,'Nguyễn Đức Định','Nhân viên bán hàng'),(2,1,'Tài khoản Quản trị','Quản trị viên');
/*!40000 ALTER TABLE `nhanvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieuban`
--

DROP TABLE IF EXISTS `phieuban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieuban` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int DEFAULT NULL,
  `ten_khach_le` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdt_khach_le` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_nhan_vien` int NOT NULL,
  `ma_dat_truoc` int DEFAULT NULL,
  `ngay_ban` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hoat_dong',
  `phuong_thuc_thanh_toan` enum('tien_mat','chuyen_khoan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tien_mat',
  PRIMARY KEY (`id`),
  KEY `ma_khach_hang` (`ma_khach_hang`),
  KEY `ma_nhan_vien` (`ma_nhan_vien`),
  KEY `ma_dat_truoc` (`ma_dat_truoc`),
  CONSTRAINT `phieuban_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`),
  CONSTRAINT `phieuban_ibfk_2` FOREIGN KEY (`ma_nhan_vien`) REFERENCES `nhanvien` (`id`),
  CONSTRAINT `phieuban_ibfk_3` FOREIGN KEY (`ma_dat_truoc`) REFERENCES `dattruoc` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieuban`
--

LOCK TABLES `phieuban` WRITE;
/*!40000 ALTER TABLE `phieuban` DISABLE KEYS */;
/*!40000 ALTER TABLE `phieuban` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieubaotri`
--

DROP TABLE IF EXISTS `phieubaotri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieubaotri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_ban_sao` int NOT NULL,
  `ngay` date NOT NULL,
  `chi_phi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `noi_dung` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_quan_tri_vien` int NOT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ma_ban_sao` (`ma_ban_sao`),
  KEY `ma_quan_tri_vien` (`ma_quan_tri_vien`),
  CONSTRAINT `phieubaotri_ibfk_1` FOREIGN KEY (`ma_ban_sao`) REFERENCES `bansao` (`id`),
  CONSTRAINT `phieubaotri_ibfk_2` FOREIGN KEY (`ma_quan_tri_vien`) REFERENCES `quantrivien` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieubaotri`
--

LOCK TABLES `phieubaotri` WRITE;
/*!40000 ALTER TABLE `phieubaotri` DISABLE KEYS */;
INSERT INTO `phieubaotri` VALUES (1,3,'2026-01-10',15000.00,'Keo gáy, thay bìa cho bản sao cũ',1,'2026-09-28 22:14:44');
/*!40000 ALTER TABLE `phieubaotri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieunhapkho`
--

DROP TABLE IF EXISTS `phieunhapkho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieunhapkho` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_ncc` int NOT NULL,
  `ma_quan_tri_vien` int NOT NULL,
  `ngay_nhap` datetime DEFAULT CURRENT_TIMESTAMP,
  `tong_tien` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_ncc` (`ma_ncc`),
  KEY `ma_quan_tri_vien` (`ma_quan_tri_vien`),
  CONSTRAINT `phieunhapkho_ibfk_1` FOREIGN KEY (`ma_ncc`) REFERENCES `nhacungcap` (`id`),
  CONSTRAINT `phieunhapkho_ibfk_2` FOREIGN KEY (`ma_quan_tri_vien`) REFERENCES `quantrivien` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieunhapkho`
--

LOCK TABLES `phieunhapkho` WRITE;
/*!40000 ALTER TABLE `phieunhapkho` DISABLE KEYS */;
INSERT INTO `phieunhapkho` VALUES (1,1,1,'2026-09-28 22:14:44',224000.00),(2,1,1,'2026-09-28 22:14:44',636000.00),(3,3,1,'2026-09-28 22:14:44',968000.00);
/*!40000 ALTER TABLE `phieunhapkho` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieuthue`
--

DROP TABLE IF EXISTS `phieuthue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieuthue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int DEFAULT NULL,
  `ten_khach_le` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdt_khach_le` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_nhan_vien` int NOT NULL,
  `ma_dat_truoc` int DEFAULT NULL,
  `ngay_thue` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hoat_dong',
  `phuong_thuc_thanh_toan` enum('tien_mat','chuyen_khoan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tien_mat',
  PRIMARY KEY (`id`),
  KEY `ma_khach_hang` (`ma_khach_hang`),
  KEY `ma_nhan_vien` (`ma_nhan_vien`),
  KEY `ma_dat_truoc` (`ma_dat_truoc`),
  CONSTRAINT `phieuthue_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`),
  CONSTRAINT `phieuthue_ibfk_2` FOREIGN KEY (`ma_nhan_vien`) REFERENCES `nhanvien` (`id`),
  CONSTRAINT `phieuthue_ibfk_3` FOREIGN KEY (`ma_dat_truoc`) REFERENCES `dattruoc` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieuthue`
--

LOCK TABLES `phieuthue` WRITE;
/*!40000 ALTER TABLE `phieuthue` DISABLE KEYS */;
INSERT INTO `phieuthue` VALUES (1,1,NULL,NULL,2,3,'2026-09-29 09:23:07','hoat_dong','tien_mat');
/*!40000 ALTER TABLE `phieuthue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieutra`
--

DROP TABLE IF EXISTS `phieutra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieutra` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_chi_tiet_phieu_thue` int NOT NULL,
  `ngay_tra` datetime DEFAULT CURRENT_TIMESTAMP,
  `tinh_trang_nhan` enum('tot','tre_han','hu_nhe','hu_nang_mat') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phi_phat_sinh` decimal(10,2) DEFAULT '0.00',
  `so_tien_hoan_coc` decimal(10,2) NOT NULL DEFAULT '0.00',
  `so_tien_khach_tra_them` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ghi_chu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phuong_thuc_thanh_toan` enum('tien_mat','chuyen_khoan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tien_mat',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_chi_tiet_phieu_thue` (`ma_chi_tiet_phieu_thue`),
  CONSTRAINT `phieutra_ibfk_1` FOREIGN KEY (`ma_chi_tiet_phieu_thue`) REFERENCES `chitietphieuthue` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieutra`
--

LOCK TABLES `phieutra` WRITE;
/*!40000 ALTER TABLE `phieutra` DISABLE KEYS */;
/*!40000 ALTER TABLE `phieutra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quantrivien`
--

DROP TABLE IF EXISTS `quantrivien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quantrivien` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chuc_vu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `quantrivien_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `taikhoan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quantrivien`
--

LOCK TABLES `quantrivien` WRITE;
/*!40000 ALTER TABLE `quantrivien` DISABLE KEYS */;
INSERT INTO `quantrivien` VALUES (1,1,'Lê Đại Nghĩa','Quản trị viên');
/*!40000 ALTER TABLE `quantrivien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quydoidiem`
--

DROP TABLE IF EXISTS `quydoidiem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quydoidiem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_quy_tac` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gia_tri` decimal(12,2) NOT NULL,
  `mo_ta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_quy_tac` (`ten_quy_tac`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quydoidiem`
--

LOCK TABLES `quydoidiem` WRITE;
/*!40000 ALTER TABLE `quydoidiem` DISABLE KEYS */;
INSERT INTO `quydoidiem` VALUES (1,'tien_moi_diem',200.00,'Số tiền (VNĐ) được giảm khi dùng 1 điểm');
/*!40000 ALTER TABLE `quydoidiem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sukiengiamgia`
--

DROP TABLE IF EXISTS `sukiengiamgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sukiengiamgia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_su_kien` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kieu_giam` enum('phan_tram','so_tien') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gia_tri` decimal(10,2) NOT NULL,
  `pham_vi` enum('toan_bo','the_loai','truyen') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_the_loai` int DEFAULT NULL,
  `ma_truyen` int DEFAULT NULL,
  `ngay_bat_dau` datetime NOT NULL,
  `ngay_ket_thuc` datetime NOT NULL,
  `ma_quan_tri_vien` int NOT NULL,
  `trang_thai` enum('hoat_dong','ket_thuc','huy') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  PRIMARY KEY (`id`),
  KEY `ma_the_loai` (`ma_the_loai`),
  KEY `ma_truyen` (`ma_truyen`),
  KEY `ma_quan_tri_vien` (`ma_quan_tri_vien`),
  CONSTRAINT `sukiengiamgia_ibfk_1` FOREIGN KEY (`ma_the_loai`) REFERENCES `theloai` (`id`),
  CONSTRAINT `sukiengiamgia_ibfk_2` FOREIGN KEY (`ma_truyen`) REFERENCES `truyen` (`id`),
  CONSTRAINT `sukiengiamgia_ibfk_3` FOREIGN KEY (`ma_quan_tri_vien`) REFERENCES `quantrivien` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sukiengiamgia`
--

LOCK TABLES `sukiengiamgia` WRITE;
/*!40000 ALTER TABLE `sukiengiamgia` DISABLE KEYS */;
INSERT INTO `sukiengiamgia` VALUES (1,'Khai trương - giảm 10%','phan_tram',10.00,'the_loai',2,NULL,'2026-01-01 00:00:00','2026-12-31 00:00:00',1,'hoat_dong'),(2,'Tết 2026 - giảm 20k','so_tien',20000.00,'toan_bo',NULL,NULL,'2026-01-25 00:00:00','2026-02-10 00:00:00',1,'ket_thuc');
/*!40000 ALTER TABLE `sukiengiamgia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taikhoan`
--

DROP TABLE IF EXISTS `taikhoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taikhoan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vai_tro` enum('admin','staff','customer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `trang_thai` enum('hoat_dong','khoa') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `so_dien_thoai` (`so_dien_thoai`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taikhoan`
--

LOCK TABLES `taikhoan` WRITE;
/*!40000 ALTER TABLE `taikhoan` DISABLE KEYS */;
INSERT INTO `taikhoan` VALUES (1,'admin@shop.com','0900000001','$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be','admin','hoat_dong','2026-09-28 22:14:44'),(2,'nhanvien@shop.com','0900000002','$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be','staff','hoat_dong','2026-09-28 22:14:44'),(3,'khach@shop.com','0900000003','$2a$10$jTLDCryFX/tdx7hqRmRWbezpbHJNiyppwxV560EdMnEtf021Jc7be','customer','hoat_dong','2026-09-28 22:14:44');
/*!40000 ALTER TABLE `taikhoan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theloai`
--

DROP TABLE IF EXISTS `theloai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theloai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_the_loai` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('hoat_dong','ngung_hoat_dong') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_the_loai` (`ten_the_loai`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--

LOCK TABLES `theloai` WRITE;
/*!40000 ALTER TABLE `theloai` DISABLE KEYS */;
INSERT INTO `theloai` VALUES (1,'Hành động','Truyện có nhiều pha hành động, võ thuật, rượt đuổi','hoat_dong'),(2,'Trinh thám','Điều tra, phá án, bí ẩn','hoat_dong'),(3,'Hài hước','Gây cười, hài hước','hoat_dong'),(4,'Kinh dị','Rùng rợn, hồi hộp, ma quái','hoat_dong'),(5,'Phiêu lưu','Hành trình khám phá, mạo hiểm','hoat_dong'),(6,'Viễn tưởng','Khoa học viễn tưởng, tương lai','hoat_dong'),(7,'Tình cảm','Lãng mạn, tình cảm','hoat_dong'),(8,'Văn học thiếu nhi','Phù hợp cho trẻ em, thiếu nhi','hoat_dong'),(9,'Tâm lý / Triết lý','Chiều sâu tâm lý, triết lý sống','hoat_dong');
/*!40000 ALTER TABLE `theloai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thongbao`
--

DROP TABLE IF EXISTS `thongbao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thongbao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int NOT NULL,
  `tieu_de` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai` enum('tra_sach','dat_truoc','khuyen_mai') COLLATE utf8mb4_unicode_ci DEFAULT 'dat_truoc',
  `ma_tham_chieu` int DEFAULT NULL,
  `da_doc` tinyint NOT NULL DEFAULT '0',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_thong_bao_kh` (`ma_khach_hang`,`loai`,`ma_tham_chieu`),
  CONSTRAINT `thongbao_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongbao`
--

LOCK TABLES `thongbao` WRITE;
/*!40000 ALTER TABLE `thongbao` DISABLE KEYS */;
INSERT INTO `thongbao` VALUES (1,1,'Đặt trước thành công','Đơn đặt trước thuê \"One Piece - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',1,0,'2026-09-29 09:14:10'),(2,1,'Đặt trước thành công','Đơn đặt trước mua \"Conan - Tập 95\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',2,0,'2026-09-29 09:14:17'),(3,1,'Đặt trước thành công','Đơn đặt trước thuê \"One Piece - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',3,0,'2026-09-29 09:15:09'),(4,1,'Đặt trước thành công','Đơn đặt trước mua \"Naruto - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',4,0,'2026-09-29 09:16:16'),(5,1,'Sách đã sẵn sàng','Nhân viên đã xác nhận đơn đặt trước. Vui lòng đến quầy lấy sách!','dat_truoc',3,0,'2026-09-29 09:23:07'),(6,1,'Đơn đặt trước hết hạn','Đơn đặt trước #1 của bạn đã quá hạn giữ sách (2 giờ kể từ giờ hẹn lấy) và bị hủy tự động. Bạn có thể đặt lại bất cứ lúc nào!','dat_truoc',1,0,'2026-10-03 10:20:06'),(7,1,'Đơn đặt trước hết hạn','Đơn đặt trước #2 của bạn đã quá hạn giữ sách (2 giờ kể từ giờ hẹn lấy) và bị hủy tự động. Bạn có thể đặt lại bất cứ lúc nào!','dat_truoc',2,0,'2026-10-03 10:20:06'),(8,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',5,0,'2026-10-03 10:23:34'),(9,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',6,0,'2026-10-03 10:23:34'),(10,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',7,0,'2026-10-03 10:23:34'),(11,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',8,0,'2026-10-03 10:23:34'),(12,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',9,0,'2026-10-03 10:29:27'),(13,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',10,0,'2026-10-03 10:29:28'),(14,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',11,0,'2026-10-03 10:29:28'),(15,1,'Đặt trước thành công','Đơn đặt trước thuê \"Doraemon - Tập 1\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',12,0,'2026-10-03 10:29:28'),(16,1,'Đặt trước thành công','Đơn đặt trước mua \"Conan - Tập 95\" đã được ghi nhận. Giá cam kết giữ nguyên theo lúc đặt. Vui lòng đến quầy đúng giờ hẹn.','dat_truoc',13,0,'2026-10-03 11:49:41'),(17,1,'Đơn mua đã hoàn tất','Nhân viên đã xác nhận và lập phiếu bán cho đơn đặt trước của bạn.','dat_truoc',13,0,'2026-10-03 11:54:54');
/*!40000 ALTER TABLE `thongbao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thongbaoadmin`
--

DROP TABLE IF EXISTS `thongbaoadmin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thongbaoadmin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai` enum('het_hang','hong_mat','doanh_thu','he_thong','huy_phieu') COLLATE utf8mb4_unicode_ci DEFAULT 'he_thong',
  `ma_tham_chieu` int DEFAULT NULL,
  `da_doc` tinyint NOT NULL DEFAULT '0',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tb_admin` (`loai`,`da_doc`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongbaoadmin`
--

LOCK TABLES `thongbaoadmin` WRITE;
/*!40000 ALTER TABLE `thongbaoadmin` DISABLE KEYS */;
INSERT INTO `thongbaoadmin` VALUES (1,'Tồn kho thấp','Đầu truyện \"Sherlock Holmes trọn bộ\" chỉ còn 1 bản sẵn sàng.','het_hang',4,0,'2026-09-28 22:14:44'),(2,'Có sách hỏng/mất mới','Ghi nhận báo hỏng/mất trong ngày, cần kiểm tra và xử lý.','hong_mat',NULL,0,'2026-09-28 22:14:44'),(3,'Tồn kho thấp','Đầu truyện \"Conan - Tập 95\" chỉ còn 1 bản sẵn sàng.','het_hang',2,0,'2026-09-29 09:28:20'),(4,'Tồn kho thấp','Đầu truyện \"One Piece - Tập 1\" chỉ còn 0 bản sẵn sàng.','het_hang',5,0,'2026-09-29 09:28:20');
/*!40000 ALTER TABLE `thongbaoadmin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `truyen`
--

DROP TABLE IF EXISTS `truyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `truyen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_truyen` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_viet_tat` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai` enum('TRUYEN_TRANH','TIEU_THUYET','TRUYEN_NGAN','LIGHT_NOVEL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRUYEN_TRANH',
  `tac_gia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nha_xuat_ban` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nam_xuat_ban` int DEFAULT NULL,
  `gia_thue` decimal(10,2) NOT NULL,
  `gia_ban` decimal(10,2) NOT NULL,
  `tien_coc` decimal(10,2) NOT NULL DEFAULT '0.00',
  `luot_thue` int NOT NULL DEFAULT '0',
  `luot_mua` int NOT NULL DEFAULT '0',
  `anh_bia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` enum('hoat_dong','ngung_kinh_doanh') COLLATE utf8mb4_unicode_ci DEFAULT 'hoat_dong',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_viet_tat` (`ma_viet_tat`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `truyen`
--

LOCK TABLES `truyen` WRITE;
/*!40000 ALTER TABLE `truyen` DISABLE KEYS */;
INSERT INTO `truyen` VALUES (1,'Doraemon - Tập 1','DRM','TRUYEN_TRANH','Fujiko F. Fujio','NXB Kim Đồng',2015,5000.00,15000.00,15000.00,35,12,'doraemon1.jpg','Truyện tranh thiếu nhi kinh điển của Nhật Bản. Chú mèo máy Doraemon đến từ tương lai giúp đỡ cậu bé Nobita qua các bảo bối kỳ diệu.','hoat_dong'),(2,'Conan - Tập 95','CN','TRUYEN_TRANH','Gosho Aoyama','NXB Kim Đồng',2019,6000.00,18000.00,18000.00,28,10,'conan95.jpg','Thám tử học sinh cấp 2. Shinichi bị teo nhỏ thành Conan và luôn đối mặt những vụ án hóc búa.','hoat_dong'),(3,'Nhà giả kim','NGK','TIEU_THUYET','Paulo Coelho','NXB Văn Học',2013,10000.00,90000.00,90000.00,15,20,'nhagiakim.jpg','Tiểu thuyết nổi tiếng thế giới. Hành trình của chàng chăn cừu Santiago đi tìm kho báu và ý nghĩa cuộc đời.','hoat_dong'),(4,'Sherlock Holmes trọn bộ','SHL','TIEU_THUYET','Arthur Conan Doyle','NXB Trẻ',2016,15000.00,120000.00,120000.00,10,6,'sherlock.jpg','Tuyển tập truyện trinh thám kinh điển về vị thám tử tài ba Sherlock Holmes đầy đủ các tập.','hoat_dong'),(5,'One Piece - Tập 1','OPN','TRUYEN_TRANH','Oda Eiichiro','NXB Kim Đồng',2017,7000.00,20000.00,20000.00,41,18,'onepiece1.jpg','Hành trình trở thành Vua Hải Tặc của cậu bé Luffy cùng băng Mũ Rơm, khám phá Đại Hải Trình đầy sóng gió.','hoat_dong'),(6,'Naruto - Tập 1','NRT','TRUYEN_TRANH','Masashi Kishimoto','NXB Kim Đồng',2018,6000.00,18000.00,18000.00,32,15,'naruto1.jpg','Naruto là cậu nhóc hiếu động mang trong mình Cửu Vĩ hồ ly, khát khao trở thành Hokage vĩ đại nhất làng Lá.','hoat_dong'),(7,'Dragon Ball - Tập 1','DRB','TRUYEN_TRANH','Akira Toriyama','NXB Kim Đồng',2017,6000.00,18000.00,18000.00,30,14,'dragonball1.jpg','Son Goku cùng bạn bè săn tìm 7 viên ngọc rồng, chiến đấu với những kẻ thù hung hãn bảo vệ Trái Đất.','hoat_dong'),(8,'Kimetsu no Yaiba - Tập 1','KMY','TRUYEN_TRANH','Koyoharu Gotouge','NXB Kim Đồng',2020,7000.00,20000.00,20000.00,26,11,'kimetsu1.jpg','Tanjiro trở thành thợ săn quỷ để tìm cách trả lại hình người cho em gái Nezuko bị biến thành quỷ.','hoat_dong'),(9,'Tớ là Mèo','TLM','TIEU_THUYET','Natsume Soseki','NXB Hội Nhà Văn',2014,10000.00,85000.00,85000.00,9,8,'tomela.jpg','Tiểu thuyết kinh điển Nhật Bản kể qua con mắt tinh nghịch của chú mèo vô danh quan sát xã hội thời Minh Trị.','hoat_dong'),(10,'Đắc Nhân Tâm','DNT','TIEU_THUYET','Dale Carnegie','NXB Trẻ',2015,12000.00,110000.00,110000.00,18,25,'dacthantam.jpg','Cuốn sách nổi tiếng về nghệ thuật ứng xử, giao tiếp và chinh phục lòng người, dành cho mọi đối tượng.','hoat_dong'),(11,'Thép đã tôi thế đấy','TDT','TIEU_THUYET','Nikolai Ostrovsky','NXB Văn Học',2012,10000.00,95000.00,95000.00,7,10,'theptoidothe.jpg','Tiểu thuyết về người chiến sĩ kiên cường, ý chí thép vượt qua nghịch cảnh, từng làm rung động các thế hệ bạn đọc.','hoat_dong'),(12,'Totto-chan bên cửa sổ','TCB','TIEU_THUYET','Tetsuko Kuroyanagi','NXB Văn Học',2016,12000.00,105000.00,105000.00,11,14,'tottochan.jpg','Nhật ký của cô bé Totto-chan ở trường Tomoe, nơi những đứa trẻ được học cách tự do tỏa sáng.','hoat_dong'),(13,'Dế Mèn phiêu lưu ký','DML','TIEU_THUYET','Tô Hoài','NXB Kim Đồng',2018,9000.00,70000.00,70000.00,16,22,'demen.jpg','Tác phẩm văn học thiếu nhi kinh điển của Việt Nam về cuộc phiêu lưu và bài học lớn lên của chú Dế Mèn.','hoat_dong'),(14,'Không gia đình','KGD','TIEU_THUYET','Hector Malot','NXB Kim Đồng',2017,11000.00,98000.00,98000.00,8,9,'khonggiadinh.jpg','Hành trình phiêu lưu đầy cảm động của cậu bé Rémi bị thất lạc gia đình trong thời gian dài.','hoat_dong'),(15,'Hoàng tử bé','HPB','TIEU_THUYET','Antoine de Saint-Exupéry','NXB Hội Nhà Văn',2019,12000.00,90000.00,90000.00,13,19,'hoangtube.jpg','Câu chuyện ngụ ngôn triết lý dịu dàng về tình bạn, tình yêu và ý nghĩa của sự trưởng thành.','hoat_dong'),(16,'Số đỏ','SDO','TIEU_THUYET','Vũ Trọng Phụng','NXB Văn Học',2011,10000.00,88000.00,88000.00,6,8,'sodo.jpg','Tác phẩm trào phúng xuất sắc mỉa mai xã hội thượng lưu Việt Nam những năm 1930 qua nhân vật Xuân Tóc Đỏ.','hoat_dong'),(17,'Truyện ngụ ngôn Aesop','NGN','TRUYEN_NGAN','Aesop','NXB Kim Đồng',2016,5000.00,45000.00,45000.00,20,26,'ngungon.jpg','Hơn 100 truyện ngụ ngôn ngắn gọn, sâu sắc về bài học cuộc sống qua loài vật, phù hợp mọi lứa tuổi.','hoat_dong'),(18,'Truyện cổ tích Việt Nam chọn lọc','CTV','TRUYEN_NGAN','Nhiều tác giả','NXB Kim Đồng',2019,6000.00,55000.00,55000.00,25,30,'cotichvn.jpg','Tuyển tập các câu chuyện cổ tích quen thuộc gắn liền tuổi thơ người Việt: Tấm Cám, Cây tre trăm đốt, Thạch Sanh...','hoat_dong'),(19,'Những tấm lòng cao cả','TLC','TIEU_THUYET','Edmondo De Amicis','NXB Kim Đồng',2015,10000.00,85000.00,85000.00,12,16,'tamlongcaoca.jpg','Nhật ký của cậu bé Enrico về tình thầy trò, tình bạn và lòng nhân ái trong nhà trường.','hoat_dong'),(20,'Cuốn theo chiều gió','CTG','TIEU_THUYET','Margaret Mitchell','NXB Văn Học',2010,15000.00,150000.00,150000.00,14,12,'cuontheochiogio.jpg','Bộ tiểu thuyết nổi tiếng nhất nước Mỹ về nàng Scarlett O’Hara giữa cuộc Nội chiến tàn khốc.','hoat_dong'),(21,'Rừng Na Uy','RNY','TIEU_THUYET','Haruki Murakami','NXB Hội Nhà Văn',2013,13000.00,115000.00,115000.00,10,13,'rungnauy.jpg','Tiểu thuyết tình yêu đầy ám ảnh của Haruki Murakami về ký ức tuổi trẻ, mất mát và hồi ức.','hoat_dong'),(22,'Cây cam ngọt của tôi','CCN','TIEU_THUYET','José Mauro de Vasconcelos','NXB Hội Nhà Văn',2018,12000.00,100000.00,100000.00,21,18,'caycamngot.jpg','Câu chuyện rưng rưng nước mắt về cậu bé Zezé nghèo khó và người bạn đặc biệt là cây cam ngọt.','hoat_dong'),(23,'Moby Dick','MBY','TIEU_THUYET','Herman Melville','NXB Văn Học',2012,14000.00,130000.00,130000.00,5,7,'mobydick.jpg','Đại sử thi về chuyến đi săn cá voi trắng Moby Dick, biểu tượng của tham vọng và bi kịch con người.','hoat_dong'),(24,'Trở về tuổi thơ','TVT','TRUYEN_NGAN','Nguyễn Nhật Ánh','NXB Trẻ',2020,8000.00,65000.00,65000.00,19,24,'trovetuoitho.jpg','Tuyển tập truyện ngắn Nguyễn Nhật Ánh chở cả bầu trời ký ức tuổi học trò cho bạn đọc.','hoat_dong');
/*!40000 ALTER TABLE `truyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `truyentheloai`
--

DROP TABLE IF EXISTS `truyentheloai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `truyentheloai` (
  `ma_truyen` int NOT NULL,
  `ma_the_loai` int NOT NULL,
  PRIMARY KEY (`ma_truyen`,`ma_the_loai`),
  KEY `ma_the_loai` (`ma_the_loai`),
  CONSTRAINT `truyentheloai_ibfk_1` FOREIGN KEY (`ma_truyen`) REFERENCES `truyen` (`id`),
  CONSTRAINT `truyentheloai_ibfk_2` FOREIGN KEY (`ma_the_loai`) REFERENCES `theloai` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `truyentheloai`
--

LOCK TABLES `truyentheloai` WRITE;
/*!40000 ALTER TABLE `truyentheloai` DISABLE KEYS */;
INSERT INTO `truyentheloai` VALUES (2,1),(5,1),(6,1),(7,1),(8,1),(2,2),(4,2),(1,3),(2,3),(9,3),(16,3),(8,4),(3,5),(4,5),(5,5),(6,5),(8,5),(13,5),(14,5),(23,5),(1,6),(7,6),(10,7),(11,7),(12,7),(14,7),(19,7),(20,7),(21,7),(22,7),(1,8),(12,8),(13,8),(14,8),(15,8),(17,8),(18,8),(19,8),(22,8),(24,8),(3,9),(9,9),(10,9),(11,9),(15,9),(16,9),(17,9),(21,9),(23,9),(24,9);
/*!40000 ALTER TABLE `truyentheloai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yeuthich`
--

DROP TABLE IF EXISTS `yeuthich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yeuthich` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_khach_hang` int NOT NULL,
  `ma_truyen` int NOT NULL,
  `ngay_them` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_yeu_thich` (`ma_khach_hang`,`ma_truyen`),
  KEY `ma_truyen` (`ma_truyen`),
  CONSTRAINT `yeuthich_ibfk_1` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khachhang` (`id`),
  CONSTRAINT `yeuthich_ibfk_2` FOREIGN KEY (`ma_truyen`) REFERENCES `truyen` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yeuthich`
--

LOCK TABLES `yeuthich` WRITE;
/*!40000 ALTER TABLE `yeuthich` DISABLE KEYS */;
INSERT INTO `yeuthich` VALUES (1,1,1,'2026-09-28 22:14:44'),(2,1,2,'2026-09-28 22:14:44'),(3,1,5,'2026-09-28 22:14:44');
/*!40000 ALTER TABLE `yeuthich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'quanlytruyen'
--

--
-- Dumping routines for database 'quanlytruyen'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-07 10:38:58
