// allVerify.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  let currentPage = 1;
  let currentStatus = 'all';
  let currentSearch = '';
  let totalPages = 1;
  const perPage = 20;

  const tableBody = document.getElementById('verificationsTableBody');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const paginationContainer = document.getElementById('paginationContainer');

  // Admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  // Initial load
  await loadVerifications();

  // Status filter
  statusFilter.addEventListener('change', async () => {
    currentStatus = statusFilter.value;
    currentPage = 1;
    await loadVerifications();
  });

  // Search (debounced)
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      await loadVerifications();
    }, 400);
  });

  async function loadVerifications() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <i class="fa fa-spinner fa-spin"></i> Loading verifications...
          </td>
        </tr>`;

      const params = new URLSearchParams({
        page: currentPage,
        status: currentStatus
      });

      const res = await api.get(`/allVerify?${params.toString()}`);
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to load verifications');
      }

      let verifications = data.verifications || [];
      totalPages = data.totalPages || 1;
      currentPage = data.page || 1;

      // Client-side search filter
      if (currentSearch) {
        const s = currentSearch.toLowerCase();
        verifications = verifications.filter(v => {
          const name = v.user?.fullname || v.fullname || '';
          const email = v.user?.email || v.email || '';
          const docType = v.document_type || '';
          return (
            name.toLowerCase().includes(s) ||
            email.toLowerCase().includes(s) ||
            docType.toLowerCase().includes(s) ||
            String(v._id).includes(s)
          );
        });
      }

      renderTable(verifications);
      renderPagination();
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-danger">
            ${err.response?.data?.message || err.message || 'Failed to load verifications'}
          </td>
        </tr>`;
    }
  }

  function renderTable(verifications) {
    if (!verifications.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">No verifications found</td>
        </tr>`;
      return;
    }

    let html = '';
    verifications.forEach((v, index) => {
      const sn = index + 1 + (currentPage - 1) * perPage;

      const userName = v.user?.fullname || v.fullname || '—';
      const userEmail = v.user?.email || v.email || '';
      const docType = v.document_type || '—';
      const status = (v.status || 'pending').toLowerCase();

      let statusBadge = '';
      if (status === 'pending') statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
      else if (status === 'under review') statusBadge = `<span class="badge bg-info">Under Review</span>`;
      else if (status === 'approved') statusBadge = `<span class="badge bg-success">Approved</span>`;
      else if (status === 'rejected' || status === 'declined') statusBadge = `<span class="badge bg-danger">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
      else statusBadge = `<span class="badge bg-secondary">${status}</span>`;

      const submitted = v.createdAt ? new Date(v.createdAt).toLocaleString() : '—';
      const reviewedBy = v.reviewedBy
        ? `${v.reviewedBy.fullname || v.reviewedBy.firstname || ''} ${v.reviewedBy.lastname || ''}`.trim() || v.reviewedBy.email || '—'
        : '—';

      html += `
        <tr>
          <td>${sn}</td>
          <td>
            <div>${escapeHtml(userName)}</div>
            <small class="text-muted">${escapeHtml(userEmail)}</small>
          </td>
          <td>${escapeHtml(docType)}</td>
          <td>${statusBadge}</td>
          <td><small>${submitted}</small></td>
          <td>${escapeHtml(reviewedBy)}</td>
          <td>
            <div class="d-flex gap-1">
              <a href="viewVerify.html?id=${v._id}" class="btn btn-sm btn-primary" title="View">
                <i class="bi bi-eye"></i>
              </a>
              <a href="editVerify.html?id=${v._id}" class="btn btn-sm btn-warning" title="Edit / Review">
                <i class="bi bi-pencil"></i>
              </a>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${v._id}" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
    });

    tableBody.innerHTML = html;
    attachDeleteListeners();
  }

  function renderPagination() {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let html = `
      <nav>
        <ul class="pagination justify-content-center">
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a>
          </li>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${currentPage === i ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    html += `
          <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a>
          </li>
        </ul>
      </nav>`;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
          currentPage = page;
          await loadVerifications();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  function attachDeleteListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;

        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'This verification record will be permanently deleted (including uploaded images).',
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
          const res = await api.delete(`/deleteVerify/${id}`);
          if (res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: res.data.message || 'Verification deleted',
              background: '#212529',
              color: '#fff',
              timer: 1800,
              showConfirmButton: false
            });
            await loadVerifications();
          } else {
            throw new Error(res.data.message || 'Delete failed');
          }
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.response?.data?.message || err.message || 'Failed to delete',
            background: '#212529',
            color: '#fff'
          });
        }
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});