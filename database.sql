-- =============================================
--  TITIPIN LAUNDRY — Database Schema
--  Smart Laundry Pickup & Delivery System
-- =============================================

CREATE DATABASE IF NOT EXISTS titipin_laundry
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE titipin_laundry;

-- =============================================
--  TABLE: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  no_hp      VARCHAR(20)   NOT NULL,
  alamat     TEXT          NOT NULL,
  role       ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
--  TABLE: pesanan
-- =============================================
CREATE TABLE IF NOT EXISTS pesanan (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT           NOT NULL,
  jenis_layanan      VARCHAR(100)  NOT NULL,
  alamat_pickup      TEXT          NOT NULL,
  tanggal_pickup     DATE,
  berat_kg           DECIMAL(5,2)  DEFAULT 0,
  total_harga        DECIMAL(10,0) DEFAULT 0,
  status_laundry     ENUM(
    'Menunggu Pickup',
    'Proses Cuci',
    'Selesai',
    'Siap Diantar'
  ) DEFAULT 'Menunggu Pickup',
  status_pembayaran  ENUM('Belum Lunas','Lunas') DEFAULT 'Belum Lunas',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
--  AKUN ADMIN DEFAULT
--  Password: admin123
-- =============================================
INSERT INTO users (nama, email, password, no_hp, alamat, role)
VALUES (
  'Admin Titipin',
  'admin@titipin.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  '08123456789',
  'Jl. Laundry No. 1, Medan',
  'admin'
);

-- =============================================
--  DATA CONTOH PESANAN
-- =============================================
INSERT INTO users (nama, email, password, no_hp, alamat, role) VALUES
('Alya Nadhillah',   'alya@email.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '08111111111', 'Jl. Mawar No. 5, Medan', 'user'),
('Mas Ayu Cintia',   'ayu@email.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '08222222222', 'Jl. Melati No. 3, Medan', 'user'),
('Putri Habibah',    'putri@email.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '08333333333', 'Jl. Anggrek No. 7, Medan', 'user');

INSERT INTO pesanan (user_id, jenis_layanan, alamat_pickup, tanggal_pickup, berat_kg, total_harga, status_laundry, status_pembayaran) VALUES
(2, 'Cuci Kering Setrika', 'Jl. Mawar No. 5, Medan',   CURDATE(),         3.5, 24500, 'Proses Cuci',     'Belum Lunas'),
(3, 'Cuci Kering',         'Jl. Melati No. 3, Medan',  CURDATE() - 1,     2.0, 10000, 'Selesai',         'Lunas'),
(4, 'Setrika Saja',        'Jl. Anggrek No. 7, Medan', CURDATE() + 1,     0,   0,     'Menunggu Pickup', 'Belum Lunas'),
(2, 'Cuci Kering Setrika', 'Jl. Mawar No. 5, Medan',   CURDATE() - 2,     4.0, 28000, 'Siap Diantar',    'Lunas');