//  URL otomatis mengikuti domain tempat website ini dibuka
const API_URL = window.location.origin + '/api';

// =============================================
//  TOAST NOTIFICATION
// =============================================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');
  if (!toast) return;

  toastMsg.textContent = msg;
  toast.className = `toast toast-${type} show`;
  if (toastIcon) toastIcon.className = type === 'success' ? 'ti ti-check' : 'ti ti-x';

  setTimeout(() => toast.classList.remove('show'), 3000);
}

// =============================================
//  DATE & TIME DISPLAY
// =============================================
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function updateClock() {
  const now = new Date();
  const dayEl = document.getElementById('dateDay');
  const monthEl = document.getElementById('dateMonthYear');
  const timeEl = document.getElementById('dateTime');
  if (!dayEl) return;

  dayEl.textContent = String(now.getDate()).padStart(2, '0');
  monthEl.textContent = `${BULAN[now.getMonth()]} ${now.getFullYear()}`;
  timeEl.textContent = `${HARI[now.getDay()]} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

// =============================================
//  HANDLE LOGIN
// =============================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
      } else {
        showToast(data.message || 'Login gagal', 'error');
      }
    } catch {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
  });
}

// =============================================
//  HANDLE REGISTER
// =============================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('regNama').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const no_hp = document.getElementById('regHp').value;
    const alamat = document.getElementById('regAlamat').value;

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password, no_hp, alamat }),
      });
      const data = await res.json();
      showToast(data.message, data.success ? 'success' : 'error');
      if (data.success) {
        registerForm.reset();
        setTimeout(() => switchTab && switchTab('login'), 1500);
      }
    } catch {
      showToast('Tidak dapat terhubung ke server', 'error');
    }
  });
}

// =============================================
//  LOAD DASHBOARD
// =============================================
let allPesanan = [];

async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Set nama & role
  const namaEl = document.getElementById('namaUser');
  const roleEl = document.getElementById('roleUser');
  if (namaEl) namaEl.textContent = user.nama;
  if (roleEl) roleEl.textContent = user.role === 'admin' ? '👑 Admin' : '👤 User';

  // Set tanggal pickup otomatis hari ini
  const inputTanggal = document.getElementById('tanggalPickup');
  if (inputTanggal) {
    inputTanggal.value = new Date().toISOString().split('T')[0];
  }

  // Tampilkan form hanya untuk user
  const fiturUser = document.getElementById('fiturUser');
  if (fiturUser) {
    fiturUser.style.display = user.role === 'user' ? 'block' : 'none';
  }

  // Jalankan jam
  updateClock();
  setInterval(updateClock, 1000);

  // Fetch pesanan
  try {
    const res = await fetch(`${API_URL}/pesanan?user_id=${user.id}&role=${user.role}`);
    allPesanan = await res.json();
    renderPesanan(allPesanan, user);
    updateStats(allPesanan);
  } catch {
    showToast('Gagal memuat data pesanan', 'error');
  }
}

// =============================================
//  RENDER PESANAN
// =============================================
function renderPesanan(data, user) {
  if (!user) user = JSON.parse(localStorage.getItem('user'));
  const tbody = document.getElementById('listPesanan');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">
      <i class="ti ti-basket-off"></i> Belum ada pesanan
    </td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((p) => {
      const isAdmin = user.role === 'admin';
      const statusBadge = getStatusBadge(p.status_laundry);
      const bayarBadge =
        p.status_pembayaran === 'Lunas'
          ? `<span class="badge badge-paid"><i class="ti ti-check"></i> Lunas</span>`
          : `<span class="badge badge-unpaid"><i class="ti ti-clock"></i> Belum Lunas</span>`;

      const tglPickup = p.tanggal_pickup
        ? formatTanggal(p.tanggal_pickup)
        : '<span style="color:var(--text-300)">—</span>';

      return `<tr>
      <td><b>#${p.id}</b></td>
      <td>${p.nama || user.nama}</td>
      <td>${p.jenis_layanan}</td>
      <td>${tglPickup}</td>
      <td>${p.berat_kg ? p.berat_kg + ' kg' : '—'}</td>
      <td>${p.total_harga ? 'Rp ' + Number(p.total_harga).toLocaleString('id-ID') : '—'}</td>
      <td>${statusBadge}</td>
      <td>${bayarBadge}</td>
      <td>
        ${
          isAdmin
            ? `<div class="action-group">
               <button class="btn-sm" onclick="openModal(${p.id})">
                 <i class="ti ti-edit"></i> Update
               </button>
             </div>`
            : '<span style="color:var(--text-300);font-size:12px;">—</span>'
        }
      </td>
    </tr>`;
    })
    .join('');
}

// =============================================
//  FORMAT TANGGAL
// =============================================
function formatTanggal(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// =============================================
//  STATUS BADGE
// =============================================
function getStatusBadge(status) {
  const map = {
    'Menunggu Pickup': `<span class="badge badge-waiting"><i class="ti ti-clock"></i> Menunggu Pickup</span>`,
    'Proses Cuci': `<span class="badge badge-process"><i class="ti ti-refresh"></i> Proses Cuci</span>`,
    Selesai: `<span class="badge badge-done"><i class="ti ti-check"></i> Selesai</span>`,
    'Siap Diantar': `<span class="badge badge-delivery"><i class="ti ti-truck"></i> Siap Diantar</span>`,
  };
  return map[status] || `<span class="badge badge-waiting">${status}</span>`;
}

// =============================================
//  UPDATE STATS
// =============================================
function updateStats(data) {
  const total = document.getElementById('statTotal');
  const proses = document.getElementById('statProses');
  const selesai = document.getElementById('statSelesai');
  const belumLunas = document.getElementById('statBelumLunas');

  if (total) total.textContent = data.length;
  if (proses) proses.textContent = data.filter((p) => p.status_laundry === 'Proses Cuci').length;
  if (selesai) selesai.textContent = data.filter((p) => p.status_laundry === 'Selesai').length;
  if (belumLunas)
    belumLunas.textContent = data.filter((p) => p.status_pembayaran === 'Belum Lunas').length;
}

// =============================================
//  SEARCH / FILTER
// =============================================
function filterPesanan() {
  const user = JSON.parse(localStorage.getItem('user'));
  const query = document.getElementById('searchInput').value.toLowerCase();
  const hasil = allPesanan.filter(
    (p) =>
      String(p.id).includes(query) ||
      (p.nama || '').toLowerCase().includes(query) ||
      p.jenis_layanan.toLowerCase().includes(query) ||
      p.status_laundry.toLowerCase().includes(query) ||
      p.status_pembayaran.toLowerCase().includes(query)
  );
  renderPesanan(hasil, user);
}

// =============================================
//  CREATE PESANAN
// =============================================
const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const jenis_layanan = document.getElementById('jenisLayanan').value;
    const alamat_pickup = document.getElementById('alamatPickup').value;
    const tanggal_pickup = document.getElementById('tanggalPickup').value;

    try {
      const res = await fetch(`${API_URL}/pesanan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, jenis_layanan, alamat_pickup, tanggal_pickup }),
      });
      const data = await res.json();
      showToast(data.message || 'Pesanan berhasil dibuat!');
      orderForm.reset();
      // Reset tanggal ke hari ini setelah reset form
      document.getElementById('tanggalPickup').value = new Date().toISOString().split('T')[0];
      loadDashboard();
    } catch {
      showToast('Gagal membuat pesanan', 'error');
    }
  });
}

// =============================================
//  MODAL UPDATE (ADMIN)
// =============================================
function openModal(id) {
  const pesanan = allPesanan.find((p) => p.id === id);
  if (!pesanan) return;

  document.getElementById('updateId').value = id;
  document.getElementById('updateBerat').value = pesanan.berat_kg || '';
  document.getElementById('updateStatus').value = pesanan.status_laundry;
  document.getElementById('updatePembayaran').value = pesanan.status_pembayaran;

  document.getElementById('modalUpdate').classList.add('show');
}

function closeModal() {
  document.getElementById('modalUpdate').classList.remove('show');
}

async function submitUpdate() {
  const id = document.getElementById('updateId').value;
  const berat_kg = parseFloat(document.getElementById('updateBerat').value);
  const status_laundry = document.getElementById('updateStatus').value;
  const status_pembayaran = document.getElementById('updatePembayaran').value;

  try {
    const res = await fetch(`${API_URL}/pesanan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ berat_kg, status_laundry, status_pembayaran }),
    });
    const data = await res.json();
    showToast(data.message || 'Pesanan diperbarui!');
    closeModal();
    loadDashboard();
  } catch {
    showToast('Gagal memperbarui pesanan', 'error');
  }
}

// Tutup modal klik di luar
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modalUpdate');
  if (modal && e.target === modal) closeModal();
});

// =============================================
//  LOGOUT
// =============================================
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
