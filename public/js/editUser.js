document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') requireAuthPage();

  const content = document.getElementById('editUserContent');
  let currentUserId = null;

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

  function getUserId() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if (id) return id;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('editUser');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  }

  currentUserId = getUserId();
  if (!currentUserId) {
    content.innerHTML = '<p class="text-danger">No user ID. Open from the users list (Edit).</p>';
    return;
  }

  try {
    const res = await api.get('/editUser/' + currentUserId);
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

    const kyc = String(user.kycVerified || 'noverify').toLowerCase();

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom border-secondary flex-wrap gap-2">
        <h1 class="h2 mb-0">Editing: ${escapeHtml(user.fullname)}</h1>
        <div class="text-end small text-secondary">
          <div><b>User ID:</b> ${escapeHtml(user._id)}</div>
        </div>
      </div>

      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="adminDashboard.html">Dashboard</a></li>
          <li class="breadcrumb-item"><a href="viewUser.html?id=${encodeURIComponent(user._id)}">View</a></li>
          <li class="breadcrumb-item active" aria-current="page">${escapeHtml(user.fullname)}</li>
        </ol>
      </nav>

      <form id="editUserForm" class="edit-card">
        <h4 class="mb-3">Personal Information</h4>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="fullname" class="form-label">Full Name</label>
            <input type="text" class="form-control" id="fullname" name="fullname" value="${escapeHtml(user.fullname)}" required>
          </div>
          <div class="col-md-6">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" id="email" name="email" value="${escapeHtml(user.email)}" required>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="tel" class="form-label">Phone</label>
            <input type="tel" class="form-control" id="tel" name="tel" value="${escapeHtml(user.tel)}" required>
          </div>
          <div class="col-md-6">
            <label for="country" class="form-label">Country</label>
            <input type="text" class="form-control" id="country" name="country" value="${escapeHtml(user.country)}" required>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="gender" class="form-label">Gender</label>
            <select class="form-select" id="gender" name="gender">
              <option value="Male" ${user.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${user.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Other" ${user.gender && user.gender !== 'Male' && user.gender !== 'Female' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="password" class="form-label">New Password (leave blank to keep)</label>
            <input type="text" class="form-control" id="password" name="password" placeholder="Optional">
          </div>
        </div>

        <h4 class="mb-3 mt-4">Account Information</h4>
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="balance" class="form-label">Balance</label>
            <input type="text" class="form-control" id="balance" name="balance" value="${escapeHtml(user.balance)}">
          </div>
          <div class="col-md-4">
            <label for="profit" class="form-label">Profit</label>
            <input type="text" class="form-control" id="profit" name="profit" value="${escapeHtml(user.profit)}">
          </div>
          <div class="col-md-4">
            <label for="bonus" class="form-label">Bonus</label>
            <input type="text" class="form-control" id="bonus" name="bonus" value="${escapeHtml(user.bonus)}">
          </div>
        </div>

        <h4 class="mb-3 mt-4">Verification &amp; Status</h4>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="kycVerified" class="form-label">KYC Status</label>
            <select class="form-select" id="kycVerified" name="kycVerified">
              <option value="noverify" ${kyc === 'noverify' ? 'selected' : ''}>Not verified</option>
              <option value="pending" ${kyc === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="approve" ${kyc === 'approve' || kyc === 'approved' ? 'selected' : ''}>Approved</option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="verifiedStatus" class="form-label">Verification Status Text</label>
            <input type="text" class="form-control" id="verifiedStatus" name="verifiedStatus" value="${escapeHtml(user.verifiedStatus)}">
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="isSuspended" class="form-label">Account Suspended</label>
            <select class="form-select" id="isSuspended" name="isSuspended">
              <option value="false" ${!user.isSuspended ? 'selected' : ''}>No</option>
              <option value="true" ${user.isSuspended ? 'selected' : ''}>Yes</option>
            </select>
          </div>
          <div class="col-md-6">
            <label for="otpsuspended" class="form-label">OTP Suspended</label>
            <select class="form-select" id="otpsuspended" name="otpsuspended">
              <option value="false" ${!user.otpsuspended ? 'selected' : ''}>No</option>
              <option value="true" ${user.otpsuspended ? 'selected' : ''}>Yes</option>
            </select>
          </div>
        </div>

        <h4 class="mb-3 mt-4">Activity (read-only)</h4>
        <div class="row mb-3">
          <div class="col-md-3">
            <label class="form-label">Deposits</label>
            <input type="text" class="form-control" value="${user.depositsCount || 0} deposit(s)" readonly>
          </div>
          <div class="col-md-3">
            <label class="form-label">Withdrawals</label>
            <input type="text" class="form-control" value="${user.widthdrawsCount || 0} withdrawal(s)" readonly>
          </div>
          <div class="col-md-3">
            <label class="form-label">Live Trades</label>
            <input type="text" class="form-control" value="${user.livetradesCount || 0} trade(s)" readonly>
          </div>
          <div class="col-md-3">
            <label class="form-label">KYC records</label>
            <input type="text" class="form-control" value="${user.verifiedCount || 0} verification(s)" readonly>
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-4">
          <button type="submit" class="btn btn-primary" id="updateBtn">Update User</button>
          <a href="viewUser.html?id=${encodeURIComponent(user._id)}" class="btn btn-secondary">View</a>
          <a href="adminDashboard.html" class="btn btn-outline-light">Back</a>
          <button type="button" class="btn btn-danger ms-auto" id="deleteUserBtn">Delete User</button>
        </div>
      </form>

      <div class="edit-card mt-4">
        <label class="form-label">Generate OTP for Withdrawal</label>
        <div class="d-flex gap-2 flex-wrap">
          <input type="text" id="otpDisplay" class="form-control" style="max-width:200px;" readonly placeholder="OTP">
          <button type="button" id="generateOtpBtn" class="btn btn-primary">Generate OTP</button>
        </div>
        <p id="otpMessage" class="mt-2 mb-0 small"></p>
      </div>
    `;

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('updateBtn');
      btn.disabled = true;
      btn.innerHTML = 'Updating...';

      const payload = {
        fullname: document.getElementById('fullname').value.trim(),
        email: document.getElementById('email').value.trim(),
        tel: document.getElementById('tel').value.trim(),
        country: document.getElementById('country').value.trim(),
        gender: document.getElementById('gender').value,
        balance: document.getElementById('balance').value,
        profit: document.getElementById('profit').value,
        bonus: document.getElementById('bonus').value,
        kycVerified: document.getElementById('kycVerified').value,
        verifiedStatus: document.getElementById('verifiedStatus').value,
        isSuspended: document.getElementById('isSuspended').value,
        otpsuspended: document.getElementById('otpsuspended').value
      };
      const pwd = document.getElementById('password').value;
      if (pwd && pwd.trim()) payload.password = pwd.trim();

      try {
        const r = await api.put('/editUser/' + currentUserId, payload);
        if (r.data && r.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: r.data.message || 'User updated successfully',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#286090'
          });
          window.location.href = 'viewUser.html?id=' + encodeURIComponent(currentUserId);
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
        btn.innerHTML = 'Update User';
      }
    });

    document.getElementById('generateOtpBtn').addEventListener('click', async () => {
      const otpDisplay = document.getElementById('otpDisplay');
      const otpMessage = document.getElementById('otpMessage');
      otpMessage.textContent = 'Generating...';
      otpMessage.style.color = '#aaa';
      try {
        const r = await api.post('/generateOtp/' + currentUserId);
        if (r.data && r.data.success) {
          otpDisplay.value = r.data.otp || '';
          otpMessage.textContent = r.data.message || 'OTP generated';
          otpMessage.style.color = '#0f0';
        } else {
          throw new Error((r.data && r.data.message) || 'Failed');
        }
      } catch (err) {
        otpMessage.textContent =
          (err.response && err.response.data && err.response.data.message) || err.message || 'Error generating OTP';
        otpMessage.style.color = '#f00';
      }
    });

    document.getElementById('deleteUserBtn').addEventListener('click', async () => {
      const conf = await Swal.fire({
        title: 'Delete user?',
        html: 'This will remove <b>' + escapeHtml(user.fullname) + '</b>. Are you sure?',
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
        await api.delete('/deleteUser/' + currentUserId);
        await Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'User removed',
          background: '#1a1a2e',
          color: '#fff'
        });
        window.location.href = 'adminDashboard.html';
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
  }
});