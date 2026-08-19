document.addEventListener('DOMContentLoaded', () => {
  if (typeof requireAuthPage === 'function') requireAuthPage();

  const state = {
    page: 1,
    status: 'all',
    search: '',
    totalPages: 1,
    total: 0
  };

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

  function escapeHtml(str) {
    if (str == null || str === '') return '—';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(v) {
    const n = Number(v);
    return isNaN(n) ? String(v || '0') : n.toFixed(2);
  }

  function formatDate(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch (e) {
      return '—';
    }
  }

  function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    let cls = 'bg-secondary';
    if (s === 'pending' || s === 'processing') cls = 'bg-warning text-dark';
    else if (s === 'approved' || s === 'completed' || s === 'success') cls = 'bg-success';
    else if (s === 'rejected' || s === 'declined') cls = 'bg-danger';
    return '<span class="badge ' + cls + '">' + escapeHtml(status || 'N/A') + '</span>';
  }

  function paymentDetails(w) {
    const t = String(w.type || '');
    if (t === 'Bitcoin' || t === 'Ethereum' || t === 'USDT' || /btc|eth|crypto/i.test(t)) {
      return '<div class="pay-details">Wallet: ' + escapeHtml(w.walletAddress || 'N/A') + '</div>';
    }
    if (t === 'CashApp' || /cashapp/i.test(t)) {
      return '<div class="pay-details">CashApp: ' + escapeHtml(w.cashAppTag || 'N/A') + '</div>';
    }
    if (t === 'PayPal' || /paypal/i.test(t)) {
      return '<div class="pay-details">PayPal: ' + escapeHtml(w.paypalEmail || 'N/A') + '</div>';
    }
    if (t === 'Bank Transfer' || /bank/i.test(t)) {
      const b = w.bankDetails || {};
      return (
        '<div class="pay-details">' +
        'Bank: ' + escapeHtml(b.bankName || b.bank_name || 'N/A') + '<br>' +
        'Acct: ' + escapeHtml(b.accountNumber || b.account_no || 'N/A') + '<br>' +
        'Country: ' + escapeHtml(b.country || 'N/A') + '<br>' +
        'Swift: ' + escapeHtml(b.swiftCode || b.swift_code || 'N/A') +
        '</div>'
      );
    }
    if (w.walletAddress) {
      return '<div class="pay-details">Wallet: ' + escapeHtml(w.walletAddress) + '</div>';
    }
    return '<span class="text-secondary">N/A</span>';
  }

  function setAdminHeader(admin) {
    if (!admin) return;
    const nameEl = document.getElementById('admin-sidebar-name');
    const emailEl = document.getElementById('admin-sidebar-email');
    const topName = document.getElementById('top-admin-name');
    if (nameEl) nameEl.innerHTML = '<b>' + escapeHtml(admin.fullname || 'Admin') + '</b>';
    if (emailEl) {
      emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + escapeHtml(admin.email || '');
    }
    if (topName) topName.textContent = admin.fullname || admin.email || 'Admin';
  }

  function renderTable(list, page, perPage) {
    const tbody = document.getElementById('withdrawalsTableBody');
    if (!list || !list.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">No withdrawals found</td></tr>';
      return;
    }
    let html = '';
    list.forEach((w, i) => {
      const sn = (page - 1) * perPage + i + 1;
      const ownerName = w.owner && w.owner.fullname ? w.owner.fullname : 'No Owner';
      const ownerEmail = w.owner && w.owner.email ? w.owner.email : '';

      html +=
        '<tr>' +
        '<td>' + sn + '</td>' +
        '<td>' +
        escapeHtml(ownerName) +
        (ownerEmail ? '<br><small class="text-secondary">' + escapeHtml(ownerEmail) + '</small>' : '') +
        (w.owner && w.owner._id
          ? '<br><a class="small" href="viewUser.html?id=' + encodeURIComponent(w.owner._id) + '">View user</a>'
          : '') +
        '</td>' +
        '<td>$' + money(w.amount) + '</td>' +
        '<td>' + escapeHtml(w.type) + '</td>' +
        '<td>' + paymentDetails(w) + '</td>' +
        '<td>' + statusBadge(w.status) + '</td>' +
        '<td>' + escapeHtml(w.narration) + '</td>' +
        '<td>' + formatDate(w.createdAt) + '</td>' +
        '<td>' + formatDate(w.updatedAt) + '</td>' +
        '<td class="text-nowrap">' +
        '<a href="editWithdrawal.html?id=' + encodeURIComponent(w._id) + '" class="btn btn-sm btn-primary me-1" title="Edit"><i class="bi bi-pencil"></i></a>' +
        '<button type="button" class="btn btn-sm btn-danger btn-delete-wd" data-id="' +
        escapeHtml(w._id) +
        '" title="Delete"><i class="bi bi-trash"></i></button>' +
        '</td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
    bindDeleteButtons();
  }

  function bindDeleteButtons() {
    document.querySelectorAll('.btn-delete-wd').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const conf = await Swal.fire({
          title: 'Delete withdrawal?',
          text: 'This cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#666',
          confirmButtonText: 'Yes, delete',
          background: '#1a1a2e',
          color: '#fff'
        });
        if (!conf.isConfirmed) return;
        try {
          await api.delete('/withdrawals-delete/' + id);
          await Swal.fire({
            icon: 'success',
            title: 'Deleted',
            background: '#1a1a2e',
            color: '#fff',
            timer: 1500,
            showConfirmButton: false
          });
          loadWithdrawals();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: (err.response && err.response.data && err.response.data.message) || err.message || 'Delete failed',
            background: '#1a1a2e',
            color: '#fff'
          });
        }
      });
    });
  }

  function renderPagination(page, totalPages) {
    const ul = document.getElementById('pagination');
    if (totalPages <= 1) {
      ul.innerHTML = '';
      return;
    }
    let html = '';
    html +=
      '<li class="page-item ' +
      (page <= 1 ? 'disabled' : '') +
      '"><a class="page-link" href="#" data-page="' +
      (page - 1) +
      '">Prev</a></li>';
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p++) {
      html +=
        '<li class="page-item ' +
        (p === page ? 'active' : '') +
        '"><a class="page-link" href="#" data-page="' +
        p +
        '">' +
        p +
        '</a></li>';
    }
    html +=
      '<li class="page-item ' +
      (page >= totalPages ? 'disabled' : '') +
      '"><a class="page-link" href="#" data-page="' +
      (page + 1) +
      '">Next</a></li>';
    ul.innerHTML = html;
    ul.querySelectorAll('a[data-page]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.getAttribute('data-page'), 10);
        if (!isNaN(p) && p >= 1 && p <= state.totalPages) {
          state.page = p;
          loadWithdrawals();
        }
      });
    });
  }

  async function loadWithdrawals() {
    const tbody = document.getElementById('withdrawalsTableBody');
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">Loading...</td></tr>';
    try {
      const params = new URLSearchParams({
        page: String(state.page),
        limit: '20',
        status: state.status,
        search: state.search,
        sort: 'createdAt',
        order: 'desc'
      });
      const res = await api.get('/allWidthdrawals?' + params.toString());
      if (!res.data || !res.data.success) {
        throw new Error((res.data && res.data.message) || 'Failed to load');
      }
      setAdminHeader(res.data.admin);
      state.totalPages = res.data.totalPages || 1;
      state.total = res.data.total || 0;
      const perPage = res.data.perPage || 20;
      renderTable(res.data.withdrawals || [], res.data.page || 1, perPage);
      renderPagination(res.data.page || 1, state.totalPages);
      document.getElementById('resultInfo').textContent =
        'Showing page ' + (res.data.page || 1) + ' of ' + state.totalPages + ' (' + state.total + ' total)';
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        logoutAdmin();
        return;
      }
      tbody.innerHTML =
        '<tr><td colspan="10" class="text-center text-danger">Failed to load withdrawals</td></tr>';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to load',
        background: '#1a1a2e',
        color: '#fff'
      });
    }
  }

  document.getElementById('searchBtn').addEventListener('click', () => {
    state.search = document.getElementById('searchInput').value.trim();
    state.status = document.getElementById('statusFilter').value;
    state.page = 1;
    loadWithdrawals();
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    state.search = '';
    state.status = 'all';
    state.page = 1;
    loadWithdrawals();
  });

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('searchBtn').click();
    }
  });

  loadWithdrawals();
});