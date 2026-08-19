document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuthPage === 'function') requireAuthPage();

  let state = {
    page: 1,
    sort: 'createdAt',
    order: 'desc',
    status: 'all',
    search: '',
    totalPages: 1
  };

  const tbody = document.getElementById('usersTableBody');
  const paginationEl = document.getElementById('pagination');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  // Sidebar toggle
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
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderUsers(users, page, perPage) {
    if (!tbody) return;
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No users found in the database!</td></tr>';
      return;
    }

    const start = (page - 1) * (perPage || 50);
    let html = '';
    users.forEach((u, i) => {
      const suspended = !!u.isSuspended;
      html += `
        <tr data-id="${u._id}">
          <td>${start + i + 1}</td>
          <td>${escapeHtml(u.fullname)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.country)}</td>
          <td>${escapeHtml(u.tel)}</td>
          <td>$${Number(u.balance || 0).toFixed(2)}</td>
          <td>
            <span class="badge ${suspended ? 'bg-danger' : 'bg-success'}">
              ${suspended ? 'Suspended' : 'Active'}
            </span>
          </td>
          <td>
            <div class="d-flex gap-1 flex-wrap">
              <a href="viewUser.html?id=${u._id}" class="btn btn-sm btn-primary" title="View">
                <i class="bi bi-eye"></i>
              </a>
              <a href="editUser.html?id=${u._id}" class="btn btn-sm btn-warning" title="Edit">
                <i class="bi bi-pencil"></i>
              </a>
              <button type="button" class="btn btn-sm ${suspended ? 'btn-success' : 'btn-secondary'} btn-suspend"
                data-id="${u._id}" title="${suspended ? 'Activate' : 'Suspend'}">
                <i class="bi ${suspended ? 'bi-play-fill' : 'bi-pause-fill'}"></i>
              </button>
              <button type="button" class="btn btn-sm btn-danger btn-delete" data-id="${u._id}" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
    bindRowButtons();
  }

  function renderPagination(page, totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }
    let html = `
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page - 1}">&laquo;</a>
      </li>
    `;
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${page === i ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }
    html += `
      <li class="page-item ${page === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page + 1}">&raquo;</a>
      </li>
    `;
    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('a.page-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(a.getAttribute('data-page'), 10);
        if (!p || p < 1 || p > state.totalPages || p === state.page) return;
        state.page = p;
        loadUsers();
      });
    });
  }

  function bindRowButtons() {
    document.querySelectorAll('.btn-suspend').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await api.put('/suspendUser/' + id);
          if (res.data && res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: res.data.message || 'Status updated',
              background: '#212529',
              color: '#fff'
            });
            loadUsers();
          } else {
            Swal.fire('Error', (res.data && res.data.message) || 'Failed', 'error');
          }
        } catch (err) {
          Swal.fire(
            'Error',
            (err.response && err.response.data && err.response.data.message) || 'Failed to update status',
            'error'
          );
        }
      });
    });

    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'Do you want to delete this user? This cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, delete it!',
          background: '#212529',
          color: '#fff'
        });
        if (!result.isConfirmed) return;
        try {
          const res = await api.delete('/deleteUser/' + id);
          if (res.data && res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: res.data.message || 'User deleted',
              background: '#212529',
              color: '#fff'
            });
            loadUsers();
          } else {
            Swal.fire('Error', (res.data && res.data.message) || 'Delete failed', 'error');
          }
        } catch (err) {
          Swal.fire(
            'Error',
            (err.response && err.response.data && err.response.data.message) || 'Delete failed',
            'error'
          );
        }
      });
    });
  }

  async function loadUsers() {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Loading users...</td></tr>';
    try {
      const params = new URLSearchParams({
        page: String(state.page),
        sort: state.sort,
        order: state.order,
        status: state.status
      });
      if (state.search) params.set('search', state.search);

      const res = await api.get('/adminiRoute?' + params.toString());
      if (!res.data || !res.data.success) {
        throw new Error((res.data && res.data.message) || 'Failed to load users');
      }

      const admin = res.data.admin || {};
      const nameEl = document.getElementById('admin-sidebar-name');
      const emailEl = document.getElementById('admin-sidebar-email');
      const topName = document.getElementById('top-admin-name');
      if (nameEl) nameEl.innerHTML = '<b>' + escapeHtml(admin.fullname || 'Admin') + '</b>';
      if (emailEl) {
        emailEl.innerHTML = '<i class="fa fa-envelope-o"></i> ' + escapeHtml(admin.email || '');
      }
      if (topName) topName.textContent = admin.fullname || admin.email || 'Admin';

      state.totalPages = res.data.totalPages || 1;
      state.page = res.data.page || 1;
      if (statusFilter) statusFilter.value = res.data.status || state.status;

      renderUsers(res.data.users || [], state.page, res.data.perPage || 50);
      renderPagination(state.page, state.totalPages);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        logoutAdmin();
        return;
      }
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center py-4 text-danger">Failed to load users.</td></tr>';
      Swal.fire('Error', (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to load users', 'error');
    }
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      state.status = statusFilter.value;
      state.page = 1;
      loadUsers();
    });
  }

  function doSearch() {
    state.search = (searchInput && searchInput.value.trim()) || '';
    state.page = 1;
    loadUsers();
  }
  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  }

  document.querySelectorAll('.sort-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sort = link.getAttribute('data-sort');
      if (state.sort === sort) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = sort;
        state.order = 'asc';
      }
      state.page = 1;
      loadUsers();
    });
  });

  loadUsers();
});