document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('addWalletForm');
  const submitBtn = document.getElementById('submitBtn');

  (function () {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('menuToggleBtn');
    function openS() {
      if (sidebar) sidebar.classList.add('visible');
      if (overlay) overlay.classList.add('active');
    }
    function closeS() {
      if (sidebar) sidebar.classList.remove('visible');
      if (overlay) overlay.classList.remove('active');
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar && sidebar.classList.contains('visible') ? closeS() : openS();
      });
    }
    if (overlay) overlay.addEventListener('click', closeS);
  })();

  function logoutAdmin() {
    if (typeof logout === 'function') logout();
    else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
  }
  const lo1 = document.getElementById('adminLogoutBtn');
  const lo2 = document.getElementById('topLogoutBtn');
  if (lo1) lo1.addEventListener('click', (e) => { e.preventDefault(); logoutAdmin(); });
  if (lo2) lo2.addEventListener('click', (e) => { e.preventDefault(); logoutAdmin(); });

  try {
    const res = await api.get('/addWallet');
    if (res.data && res.data.success && res.data.admin) {
      const admin = res.data.admin;
      const name = admin.fullname || admin.email || 'Admin';
      const nameEl = document.getElementById('admin-sidebar-name');
      const emailEl = document.getElementById('admin-sidebar-email');
      const topName = document.getElementById('top-admin-name');
      if (nameEl) nameEl.innerHTML = '<b>' + name + '</b>';
      if (emailEl) {
        emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + (admin.email || '');
      }
      if (topName) topName.textContent = name;
    }
  } catch (err) {
    if (err.response && err.response.status === 401) {
      logoutAdmin();
      return;
    }
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (currentUser) {
      const name = currentUser.fullname || currentUser.email || 'Admin';
      const nameEl = document.getElementById('admin-sidebar-name');
      const emailEl = document.getElementById('admin-sidebar-email');
      const topName = document.getElementById('top-admin-name');
      if (nameEl) nameEl.innerHTML = '<b>' + name + '</b>';
      if (emailEl) {
        emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + (currentUser.email || '');
      }
      if (topName) topName.textContent = name;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const conf = await Swal.fire({
      title: 'Create wallet?',
      text: 'Save these payment details as a new wallet?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#286090',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, create',
      background: '#1a1a2e',
      color: '#fff'
    });
    if (!conf.isConfirmed) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating...';

    const fd = new FormData();
    fd.append('bank_name', document.getElementById('bank_name').value.trim());
    fd.append('account_name', document.getElementById('account_name').value.trim());
    fd.append('account_no', document.getElementById('account_no').value.trim());
    fd.append('sortcode', document.getElementById('sortcode').value.trim());
    fd.append('swift_code', document.getElementById('swift_code').value.trim());
    fd.append('btc_address', document.getElementById('btc_address').value.trim());
    fd.append('eth_address', document.getElementById('eth_address').value.trim());
    fd.append('usdt_address', document.getElementById('usdt_address').value.trim());
    fd.append('solana_address', document.getElementById('solana_address').value.trim());
    fd.append('tron_address', document.getElementById('tron_address').value.trim());
    fd.append('xrp_address', document.getElementById('xrp_address').value.trim());
    fd.append('cashapp', document.getElementById('cashapp').value.trim());
    fd.append('paypal', document.getElementById('paypal').value.trim());

    ['btc_image', 'eth_image', 'usdt_image', 'cashapp_image', 'paypal_image', 'solana_image', 'tron_image', 'xrp_image'].forEach((name) => {
    const input = document.getElementById(name);
    if (input && input.files && input.files[0]) {
      fd.append(name, input.files[0]);
    }
       });

    try {
      const r = await api.post('/add-wallet', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (r.data && r.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Created',
          text: r.data.message || 'Wallet created successfully',
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: '#286090'
        });
        window.location.href = 'wallets.html';
      } else {
        throw new Error((r.data && r.data.message) || 'Create failed');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          (err.response && err.response.data && err.response.data.message) ||
          err.message ||
          'Failed to create wallet',
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: '#d33'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add Wallet';
    }
  });
});