document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') requireAuthPage();

  const content = document.getElementById('editDepositContent');
  let depositId = null;

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
    if (str == null || str === '') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch (e) {
      return '—';
    }
  }

  function getId() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (id) return id;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'editDeposit' || p === 'edit-deposit');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  }

  depositId = getId();
  if (!depositId) {
    content.innerHTML = '<p class="text-danger">No deposit ID. Open from All Deposits.</p>';
    return;
  }

  try {
    const res = await api.get('/editDeposit/' + depositId);
    if (!res.data || !res.data.success) {
      throw new Error((res.data && res.data.message) || 'Failed to load deposit');
    }

    const d = res.data.deposit;
    const admin = res.data.admin || {};

    const nameEl = document.getElementById('admin-sidebar-name');
    const emailEl = document.getElementById('admin-sidebar-email');
    const topName = document.getElementById('top-admin-name');
    if (nameEl) nameEl.innerHTML = '<b>' + escapeHtml(admin.fullname || 'Admin') + '</b>';
    if (emailEl) {
      emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + escapeHtml(admin.email || '');
    }
    if (topName) topName.textContent = admin.fullname || admin.email || 'Admin';

    const st = String(d.status || 'pending').toLowerCase();
    const ownerBlock = d.owner
      ? '<div class="mb-3 p-3 rounded" style="background:#1a1a2e;border:1px solid #333;">' +
        '<div><b>Owner:</b> ' + escapeHtml(d.owner.fullname) + '</div>' +
        '<div class="small text-secondary">' + escapeHtml(d.owner.email) + '</div>' +
        '<div class="small">Balance: $' + escapeHtml(String(d.owner.balance || '0.00')) + '</div>' +
        (d.owner._id
          ? '<a class="small" href="viewUser.html?id=' + encodeURIComponent(d.owner._id) + '">View user</a>'
          : '') +
        '</div>'
      : '<p class="text-secondary">No owner linked</p>';

    const proofBlock = d.image
      ? '<div class="mb-3">' +
        '<label class="form-label">Current proof of payment</label><br>' +
        '<a href="' + escapeHtml(d.image) + '" target="_blank" rel="noopener">' +
        '<img src="' + escapeHtml(d.image) + '" alt="Proof" class="proof-img">' +
        '</a></div>'
      : '<p class="text-secondary mb-3">No proof uploaded</p>';

    content.innerHTML = `
      <h2>Edit Deposit</h2>
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="adminDashboard.html">Dashboard</a></li>
          <li class="breadcrumb-item"><a href="allFunding.html">Deposits</a></li>
          <li class="breadcrumb-item active">Edit</li>
        </ol>
      </nav>
      <p class="small text-secondary mb-3">ID: ${escapeHtml(d._id)} · Created: ${formatDate(d.createdAt)}</p>

      ${ownerBlock}

      <form id="editDepositForm" class="edit-card">
        <div class="mb-3">
          <label for="type" class="form-label">Type</label>
          <input type="text" class="form-control" id="type" name="type" value="${escapeHtml(d.type)}" required>
        </div>
        <div class="mb-3">
          <label for="amount" class="form-label">Amount</label>
          <input type="text" class="form-control" id="amount" name="amount" value="${escapeHtml(d.amount)}" required>
        </div>
        <div class="mb-3">
          <label for="status" class="form-label">Status</label>
          <select class="form-select" id="status" name="status">
            <option value="pending" ${st === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${st === 'approved' || st === 'confirmed' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${st === 'rejected' || st === 'declined' ? 'selected' : ''}>Rejected</option>
          </select>
          <div class="form-text text-secondary">Setting status to Approved credits the user's balance once.</div>
        </div>
        <div class="mb-3">
          <label for="narration" class="form-label">Narration</label>
          <textarea class="form-control" id="narration" name="narration" rows="3">${escapeHtml(d.narration)}</textarea>
        </div>
        ${proofBlock}
        <div class="d-flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" id="updateDepBtn">Update Deposit</button>
          <a href="allFunding.html" class="btn btn-secondary">Back to list</a>
        </div>
      </form>
    `;

    document.getElementById('editDepositForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('updateDepBtn');
      btn.disabled = true;
      btn.innerHTML = 'Updating...';

      const payload = {
        type: document.getElementById('type').value.trim(),
        amount: document.getElementById('amount').value.trim(),
        status: document.getElementById('status').value,
        narration: document.getElementById('narration').value.trim()
      };

      try {
        const r = await api.put('/editDeposit/' + depositId, payload);
        if (r.data && r.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: r.data.message || 'Deposit updated successfully',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#286090'
          });
          window.location.href = 'allFunding.html';
        } else {
          throw new Error((r.data && r.data.message) || 'Update failed');
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: (err.response && err.response.data && err.response.data.message) || err.message || 'Update failed',
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: '#d33'
        });
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Update Deposit';
      }
    });
  } catch (err) {
    console.error(err);
    if (err.response && err.response.status === 401) {
      logoutAdmin();
      return;
    }
    content.innerHTML =
      '<p class="text-danger">Failed to load deposit: ' +
      escapeHtml((err.response && err.response.data && err.response.data.message) || err.message) +
      '</p>';
  }
});