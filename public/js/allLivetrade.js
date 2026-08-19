// allLivetrade.js
document.addEventListener('DOMContentLoaded', async () => {
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

  const tableBody = document.getElementById('tradesTableBody');
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
  await loadTrades();

  // Filters
  statusFilter.addEventListener('change', async () => {
    currentStatus = statusFilter.value;
    currentPage = 1;
    await loadTrades();
  });

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      await loadTrades();
    }, 400);
  });

  async function loadTrades() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4">
            <i class="fa fa-spinner fa-spin"></i> Loading trades...
          </td>
        </tr>`;

      const params = new URLSearchParams({
        page: currentPage,
        limit: perPage,
        status: currentStatus,
        search: currentSearch
      });

      const res = await api.get(`/all-livetrade?${params.toString()}`);
      const data = res.data;

      if (!data.success) throw new Error(data.message || 'Failed to load trades');

      const trades = data.trades || [];
      totalPages = data.totalPages || 1;
      currentPage = data.page || 1;

      renderTable(trades);
      renderPagination();
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4 text-danger">
            ${err.response?.data?.message || err.message || 'Failed to load trades'}
          </td>
        </tr>`;
    }
  }

  function renderTable(trades) {
    if (!trades.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4">No trades found</td>
        </tr>`;
      return;
    }

    let html = '';
    trades.forEach((t, index) => {
      const sn = index + 1 + (currentPage - 1) * perPage;
      const ownerName = t.owner ? t.owner.fullname : '—';
      const ownerEmail = t.owner ? t.owner.email : '';

      let statusBadge = '';
      if (t.status === 'Open') statusBadge = `<span class="badge bg-primary">Open</span>`;
      else if (t.status === 'Closed') statusBadge = `<span class="badge bg-secondary">Closed</span>`;
      else if (t.status === 'Won') statusBadge = `<span class="badge bg-success">Won</span>`;
      else if (t.status === 'Lost') statusBadge = `<span class="badge bg-danger">Lost</span>`;
      else statusBadge = `<span class="badge bg-dark">${t.status}</span>`;

      const date = t.createdAt ? new Date(t.createdAt).toLocaleString() : '—';

      html += `
        <tr>
          <td>${sn}</td>
          <td>
            <div>${escapeHtml(ownerName)}</div>
            <small class="text-muted">${escapeHtml(ownerEmail)}</small>
          </td>
          <td>${escapeHtml(t.type)}</td>
          <td>${escapeHtml(t.currencypair)}</td>
          <td>
            <span class="badge ${t.action === 'Call' ? 'bg-success' : 'bg-danger'}">
              ${escapeHtml(t.action)}
            </span>
          </td>
          <td>${escapeHtml(t.amount)}</td>
          <td>${escapeHtml(t.entryPrice)}</td>
          <td>${statusBadge}</td>
          <td><small>${date}</small></td>
          <td>
            <div class="d-flex gap-1">
              <a href="viewTrade.html?id=${t._id}" class="btn btn-sm btn-primary" title="View">
                <i class="bi bi-eye"></i>
              </a>
              <a href="editTrade.html?id=${t._id}" class="btn btn-sm btn-warning" title="Edit">
                <i class="bi bi-pencil"></i>
              </a>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${t._id}" title="Delete">
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
          await loadTrades();
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
          text: 'This trade will be permanently deleted.',
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
          const res = await api.post(`/trades-delete/${id}`);
          if (res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: res.data.message || 'Trade deleted',
              background: '#212529',
              color: '#fff',
              timer: 1800,
              showConfirmButton: false
            });
            await loadTrades();
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