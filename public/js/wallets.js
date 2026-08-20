document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const tableBody = document.getElementById('walletsTableBody');

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

  function escapeHtml(text) {
    if (text == null || text === '') return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function shortAddr(s, n) {
    if (!s) return '—';
    const t = String(s);
    if (t.length <= (n || 14)) return escapeHtml(t);
    return escapeHtml(t.slice(0, 6) + '…' + t.slice(-4));
  }

  function imgCell(url) {
    if (!url) return '';
    return '<br><img src="' + escapeHtml(url) + '" class="qr-thumb" alt="QR">';
  }

  await loadWallets();

  async function loadWallets() {
    try {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center py-4"><i class="fa fa-spinner fa-spin"></i> Loading wallets...</td></tr>';

      const res = await api.get('/wallets');
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to load wallets');
      }

      if (data.admin) {
        const name = data.admin.fullname || data.admin.email || 'Admin';
        const elName = document.getElementById('admin-sidebar-name');
        const elEmail = document.getElementById('admin-sidebar-email');
        const elTop = document.getElementById('top-admin-name');
        if (elName) elName.innerHTML = '<b>' + escapeHtml(name) + '</b>';
        if (elEmail) {
          elEmail.innerHTML = '<i class="fa fa-envelope-o"></i> ' + escapeHtml(data.admin.email || '');
        }
        if (elTop) elTop.textContent = name;
      }

      renderTable(data.wallets || []);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        logoutAdmin();
        return;
      }
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center py-4 text-danger">' +
        escapeHtml((err.response && err.response.data && err.response.data.message) || err.message || 'Failed to load wallets') +
        '</td></tr>';
    }
  }

  function renderTable(wallets) {
    if (!wallets.length) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center py-4">No wallets found</td></tr>';
      return;
    }

    let html = '';
    wallets.forEach((w, index) => {
      const updaterName = w.updatedBy ? w.updatedBy.fullname : '—';
      const updaterEmail = w.updatedBy ? w.updatedBy.email : '';
      const bankLine =
        (w.bank_name || '—') +
        (w.account_no ? '<br><small>' + escapeHtml(w.account_no) + '</small>' : '');

      html +=
        '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td>' + escapeHtml(w.bank_name || '') +
        (w.account_name ? '<br><small>' + escapeHtml(w.account_name) + '</small>' : '') +
        (w.account_no ? '<br><small class="text-secondary">' + escapeHtml(w.account_no) + '</small>' : '') +
        '</td>' +
        '<td class="address-cell" title="' + escapeHtml(w.btc_address) + '">' +
        shortAddr(w.btc_address) + imgCell(w.btc_image) +
        '</td>' +
        '<td class="address-cell" title="' + escapeHtml(w.eth_address) + '">' +
        shortAddr(w.eth_address) + imgCell(w.eth_image) +
        '</td>' +
        '<td class="address-cell" title="' + escapeHtml(w.usdt_address) + '">' +
        shortAddr(w.usdt_address) + imgCell(w.usdt_image) +
        '</td>' +
        '<td>' + escapeHtml(w.cashapp || '—') + imgCell(w.cashapp_image) + '</td>' +
        '<td>' + escapeHtml(w.paypal || '—') + imgCell(w.paypal_image) + '</td>' +
        '<td><div>' + escapeHtml(updaterName) + '</div>' +
        '<small class="text-secondary">' + escapeHtml(updaterEmail) + '</small></td>' +
        '<td><div class="d-flex gap-1 flex-wrap">' +
        '<a href="edit-wallet.html?id=' + encodeURIComponent(w._id) + '" class="btn btn-sm btn-primary" title="Edit"><i class="bi bi-pencil"></i></a>' +
        '<button type="button" class="btn btn-sm btn-danger delete-btn" data-id="' + escapeHtml(w._id) + '" title="Delete"><i class="bi bi-trash"></i></button>' +
        '</div></td>' +
        '</tr>';
    });

    tableBody.innerHTML = html;
    attachDeleteListeners();
  }

  function attachDeleteListeners() {
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'This wallet will be permanently deleted.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, delete it!',
          background: '#1a1a2e',
          color: '#fff'
        });
        if (!result.isConfirmed) return;

        try {
          const res = await api.delete('/deleteWallet/' + id);
          if (res.data && res.data.success) {
            await Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: res.data.message || 'Wallet deleted',
              background: '#1a1a2e',
              color: '#fff',
              timer: 1800,
              showConfirmButton: false
            });
            await loadWallets();
          } else {
            throw new Error((res.data && res.data.message) || 'Delete failed');
          }
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to delete',
            background: '#1a1a2e',
            color: '#fff'
          });
        }
      });
    });
  }
});