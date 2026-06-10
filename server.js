const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); //  Sudah diganti ke bcryptjs agar aman di cloud

const app = express();
//  Port dibuat dinamis (ikut aturan Railway, kalau di laptop pakai 3000)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// =============================================
//  DATABASE CONNECTION (Dibuat otomatis mendeteksi variabel Railway)
// =============================================
const db = mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'titipin_laundry',
  port: process.env.MYSQLPORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error('❌ Koneksi DB gagal:', err);
    return;
  }
  console.log('✅ Terhubung ke MySQL Railway/Lokal');
});

// =============================================
//  HARGA PER KG
// =============================================
const HARGA = {
  'Cuci Kering Setrika': 7000,
  'Cuci Kering': 5000,
  'Setrika Saja': 4000,
};

// =============================================
//  AUTH — REGISTER
// =============================================
app.post('/api/register', async (req, res) => {
  const { nama, email, password, no_hp, alamat } = req.body;
  if (!nama || !email || !password || !no_hp || !alamat) {
    return res.json({ success: false, message: 'Semua field wajib diisi' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (nama, email, password, no_hp, alamat, role) VALUES (?,?,?,?,?,?)',
      [nama, email, hash, no_hp, alamat, 'user'],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.json({ success: false, message: 'Email sudah terdaftar' });
          return res.json({ success: false, message: 'Registrasi gagal' });
        }
        res.json({ success: true, message: 'Akun berhasil dibuat! Silakan login.' });
      }
    );
  } catch {
    res.json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// =============================================
//  AUTH — LOGIN
// =============================================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || !results.length)
      return res.json({ success: false, message: 'Email tidak ditemukan' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: 'Kata sandi salah' });

    res.json({
      success: true,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    });
  });
});

// =============================================
//  PESANAN — GET
// =============================================
app.get('/api/pesanan', (req, res) => {
  const { user_id, role } = req.query;

  const sql =
    role === 'admin'
      ? `SELECT p.*, u.nama FROM pesanan p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.id DESC`
      : `SELECT p.*, u.nama FROM pesanan p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.id DESC`;

  const params = role === 'admin' ? [] : [user_id];

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data' });
    res.json(results);
  });
});

// =============================================
//  PESANAN — CREATE
// =============================================
app.post('/api/pesanan', (req, res) => {
  const { user_id, jenis_layanan, alamat_pickup, tanggal_pickup } = req.body;
  if (!user_id || !jenis_layanan || !alamat_pickup) {
    return res.json({ success: false, message: 'Data pesanan tidak lengkap' });
  }

  const tgl = tanggal_pickup || new Date().toISOString().split('T')[0];

  db.query(
    `INSERT INTO pesanan (user_id, jenis_layanan, alamat_pickup, tanggal_pickup, status_laundry, status_pembayaran)
     VALUES (?,?,?,?,?,?)`,
    [user_id, jenis_layanan, alamat_pickup, tgl, 'Menunggu Pickup', 'Belum Lunas'],
    (err) => {
      if (err) return res.json({ success: false, message: 'Gagal membuat pesanan' });
      res.json({
        success: true,
        message: '✅ Pesanan berhasil dibuat! Kami akan segera menjemput.',
      });
    }
  );
});

// =============================================
//  PESANAN — UPDATE (Admin)
// =============================================
app.put('/api/pesanan/:id', (req, res) => {
  const { id } = req.params;
  const { berat_kg, status_laundry, status_pembayaran } = req.body;

  // Ambil jenis layanan dulu untuk hitung harga
  db.query('SELECT jenis_layanan FROM pesanan WHERE id = ?', [id], (err, rows) => {
    if (err || !rows.length)
      return res.json({ success: false, message: 'Pesanan tidak ditemukan' });

    const harga_per_kg = HARGA[rows[0].jenis_layanan] || 7000;
    const total_harga = berat_kg ? berat_kg * harga_per_kg : 0;

    db.query(
      `UPDATE pesanan SET berat_kg=?, total_harga=?, status_laundry=?, status_pembayaran=? WHERE id=?`,
      [berat_kg, total_harga, status_laundry, status_pembayaran, id],
      (err2) => {
        if (err2) return res.json({ success: false, message: 'Gagal update pesanan' });
        res.json({ success: true, message: '✅ Pesanan berhasil diperbarui!' });
      }
    );
  });
});

// =============================================
//  START SERVER
// =============================================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
