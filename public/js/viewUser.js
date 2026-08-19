document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') requireAuthPage();

  const content = document.getElementById('viewUserContent');

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
    if (str == null || str === '') return 'N/A';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(v) {
    const n = Number(v);
    return isNaN(n) ? '0.00' : n.toFixed(2);
  }

  function formatDate(d) {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  }

  function kycLabel(v) {
    const s = String(v || '').toLowerCase();
    if (s === 'approve' || s === 'approved') return 'Approved';
    if (s === 'pending') return 'Pending';
    return 'Not verified';
  }

  function listIds(items, amountKey) {
    if (!items || !items.length) return '';
    let html = '<ul class="activity-list">';
    items.forEach((item) => {
      const id = item._id ? String(item._id) : '—';
      const amt = amountKey && item[amountKey] != null ? ' · $' + money(item[amountKey]) : '';
      const st = item.status ? ' · ' + escapeHtml(item.status) : '';
      html += '<li>ID: ' + escapeHtml(id) + amt + st + '</li>';
    });
    html += '</ul>';
    return html;
  }

  function getUserId() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (id) return id;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('viewUser');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  }

  const userId = getUserId();
  if (!userId) {
    content.innerHTML = '<p class="text-danger">No user ID provided. Open this page from the users list.</p>';
    return;
  }

  try {
    const res = await api.get('/viewUser/' + userId);
    if (!res.data || !res.data.success) {
      throw new Error((res.data && res.data.message) || 'Failed to load user');
    }

    const user = res.data.user;
    const admin = res.data.admin || {};

    const nameEl = document.getElementById('admin-sidebar-name');
    const emailEl = document.getElementById('admin-sidebar-email');
    const topName = document.getElementById('top-admin-name');
    if (nameEl) nameEl.innerHTML = '<b>' + escapeHtml(admin.fullname || 'Admin') + '</b>';
    if (emailEl) {
      emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + escapeHtml(admin.email || '');
    }
    if (topName) topName.textContent = admin.fullname || admin.email || 'Admin';

    const deposits = user.deposits || [];
    const withdrawals = user.widthdraws || [];
    const livetrades = user.livetrades || [];
    const verified = user.verified || [];

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary flex-wrap gap-2">
        <h1 class="h2 mb-0">${escapeHtml(user.fullname)}</h1>
        <div class="text-end small text-secondary">
          <div><b>User ID:</b> ${escapeHtml(user._id)}</div>
          <div><b>Last Updated:</b> ${formatDate(user.updatedAt)}</div>
        </div>
      </div>

      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="adminDashboard.html">Dashboard</a></li>
          <li class="breadcrumb-item active" aria-current="page">${escapeHtml(user.fullname)}</li>
        </ol>
      </nav>

      <div class="btn-actions mb-4">
        <a href="editUser.html?id=${encodeURIComponent(user._id)}" class="btn btn-warning btn-sm">
          <i class="bi bi-pencil"></i> Edit
        </a>
        <a href="adminDashboard.html" class="btn btn-secondary btn-sm">
          <i class="bi bi-arrow-left"></i> Back to users
        </a>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header">Personal Information</div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Name:</b></div><div class="col-8">${escapeHtml(user.fullname)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Email:</b></div><div class="col-8">${escapeHtml(user.email)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Telephone:</b></div><div class="col-8">${escapeHtml(user.tel)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Country:</b></div><div class="col-8">${escapeHtml(user.country)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Gender:</b></div><div class="col-8">${escapeHtml(user.gender)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Joined:</b></div><div class="col-8">${formatDate(user.createdAt)}</div></div>
              </li>
            </ul>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header">Account Information</div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Balance:</b></div><div class="col-8">$${money(user.balance)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Profit:</b></div><div class="col-8">$${money(user.profit)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Bonus:</b></div><div class="col-8">$${money(user.bonus)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Role:</b></div><div class="col-8">${user.role === 1 ? 'Admin' : 'User'}</div></div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header">Verification &amp; Status</div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>KYC:</b></div><div class="col-8">${escapeHtml(kycLabel(user.kycVerified))} (${escapeHtml(user.kycVerified)})</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Verified status:</b></div><div class="col-8">${escapeHtml(user.verifiedStatus)}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>Suspended:</b></div><div class="col-8">${user.isSuspended ? 'Yes' : 'No'}</div></div>
              </li>
              <li class="list-group-item">
                <div class="row"><div class="col-4"><b>OTP suspended:</b></div><div class="col-8">${user.otpsuspended ? 'Yes' : 'No'}</div></div>
              </li>
            </ul>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header">Activity</div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <div class="row">
                  <div class="col-4"><b>Deposits:</b></div>
                  <div class="col-8">${deposits.length} deposit(s)${listIds(deposits, 'amount')}</div>
                </div>
              </li>
              <li class="list-group-item">
                <div class="row">
                  <div class="col-4"><b>Withdrawals:</b></div>
                  <div class="col-8">${withdrawals.length} withdrawal(s)${listIds(withdrawals, 'amount')}</div>
                </div>
              </li>
              <li class="list-group-item">
                <div class="row">
                  <div class="col-4"><b>Live trades:</b></div>
                  <div class="col-8">${livetrades.length} trade(s)${listIds(livetrades, 'amount')}</div>
                </div>
              </li>
              <li class="list-group-item">
                <div class="row">
                  <div class="col-4"><b>KYC records:</b></div>
                  <div class="col-8">${verified.length} verification(s)${listIds(verified, null)}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    if (err.response && err.response.status === 401) {
      logoutAdmin();
      return;
    }
    content.innerHTML =
      '<p class="text-danger">Failed to load user: ' +
      escapeHtml((err.response && err.response.data && err.response.data.message) || err.message) +
      '</p>';
    Swal.fire(
      'Error',
      (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to load user',
      'error'
    );
  }
});