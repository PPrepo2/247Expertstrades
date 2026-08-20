document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const editCard = document.getElementById('editCard');
  const form = document.getElementById('editWalletForm');
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

  function getId() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (id) return id;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'editWallet' || p === 'edit-wallet');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val != null ? String(val) : '';
  }

  function showPreview(previewId, imgId, url) {
    const wrap = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    if (!wrap || !img) return;
    if (url) {
      img.src = url;
      wrap.classList.remove('d-none');
    } else {
      wrap.classList.add('d-none');
    }
  }

  const walletId = getId();
  if (!walletId) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    errorState.textContent = 'No wallet ID. Open from Wallets list.';
    return;
  }

  try {
    const res = await api.get('/editWallet/' + walletId);
    if (!res.data || !res.data.success) {
      throw new Error((res.data && res.data.message) || 'Failed to load wallet');
    }

    const w = res.data.wallet || {};
    const admin = res.data.admin || {};

    const nameEl = document.getElementById('admin-sidebar-name');
    const emailEl = document.getElementById('admin-sidebar-email');
    const topName = document.getElementById('top-admin-name');
    const adminName = admin.fullname || admin.email || 'Admin';
    if (nameEl) nameEl.innerHTML = '<b>' + adminName + '</b>';
    if (emailEl) {
      emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + (admin.email || '');
    }
    if (topName) topName.textContent = adminName;

    setVal('bank_name', w.bank_name);
    setVal('account_name', w.account_name);
    setVal('account_no', w.account_no);
    setVal('sortcode', w.sortcode);
    setVal('swift_code', w.swift_code);
    setVal('btc_address', w.btc_address);
    setVal('eth_address', w.eth_address);
    setVal('usdt_address', w.usdt_address);
    setVal('cashapp', w.cashapp);
    setVal('paypal', w.paypal);

    showPreview('btc_image_preview', 'btc_image_img', w.btc_image);
    showPreview('eth_image_preview', 'eth_image_img', w.eth_image);
    showPreview('usdt_image_preview', 'usdt_image_img', w.usdt_image);
    showPreview('cashapp_image_preview', 'cashapp_image_img', w.cashapp_image);
    showPreview('paypal_image_preview', 'paypal_image_img', w.paypal_image);

    loadingState.classList.add('d-none');
    editCard.classList.remove('d-none');
  } catch (err) {
    console.error(err);
    if (err.response && err.response.status === 401) {
      logoutAdmin();
      return;
    }
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    errorState.textContent =
      (err.response && err.response.data && err.response.data.message) ||
      err.message ||
      'Failed to load wallet';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const conf = await Swal.fire({
      title: 'Update wallet?',
      text: 'Save these payment details?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#286090',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update',
      background: '#1a1a2e',
      color: '#fff'
    });
    if (!conf.isConfirmed) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Updating...';

    const fd = new FormData();
    fd.append('bank_name', document.getElementById('bank_name').value.trim());
    fd.append('account_name', document.getElementById('account_name').value.trim());
    fd.append('account_no', document.getElementById('account_no').value.trim());
    fd.append('sortcode', document.getElementById('sortcode').value.trim());
    fd.append('swift_code', document.getElementById('swift_code').value.trim());
    fd.append('btc_address', document.getElementById('btc_address').value.trim());
    fd.append('eth_address', document.getElementById('eth_address').value.trim());
    fd.append('usdt_address', document.getElementById('usdt_address').value.trim());
    fd.append('cashapp', document.getElementById('cashapp').value.trim());
    fd.append('paypal', document.getElementById('paypal').value.trim());

    const fileFields = ['btc_image', 'eth_image', 'usdt_image', 'cashapp_image', 'paypal_image'];
    fileFields.forEach((name) => {
      const input = document.getElementById(name);
      if (input && input.files && input.files[0]) {
        fd.append(name, input.files[0]);
      }
    });

    try {
      const r = await api.post('/edit-wallet/' + walletId, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (r.data && r.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: r.data.message || 'Wallet updated successfully',
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: '#286090'
        });
        window.location.href = 'wallets.html';
      } else {
        throw new Error((r.data && r.data.message) || 'Update failed');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          (err.response && err.response.data && err.response.data.message) ||
          err.message ||
          'Failed to update wallet',
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: '#d33'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Update Wallet';
    }
  });
});