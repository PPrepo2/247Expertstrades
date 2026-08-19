// wallets.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const tableBody = document.getElementById('walletsTableBody');

  // Admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  // Load wallets
  await loadWallets();

  async function loadWallets() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            <i class="fa fa-spinner fa-spin"></i> Loading wallets...
          </td>
        </tr>`;

      const res = await api.get('/wallets');
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to load wallets');
      }

      const wallets = data.wallets || [];
      renderTable(wallets);
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-danger">
            ${err.response?.data?.message || err.message || 'Failed to load wallets'}
          </td>
        </tr>`;
    }
  }

  function renderTable(wallets) {
    if (!wallets.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">No wallets found</td>
        </tr>`;
      return;
    }

    let html = '';
    wallets.forEach((w, index) => {
      const ownerName = w.owner ? w.owner.fullname : 'N/A';
      const ownerEmail = w.owner ? w.owner.email : '';

      html += `
        <tr>
          <td>${index + 1}</td>
          <td class="address-cell" title="${escapeHtml(w.btc_address)}">${escapeHtml(w.btc_address) || '—'}</td>
          <td class="address-cell" title="${escapeHtml(w.eth_address)}">${escapeHtml(w.eth_address) || '—'}</td>
          <td class="address-cell" title="${escapeHtml(w.usdt_address)}">${escapeHtml(w.usdt_address) || '—'}</td>
          <td>${escapeHtml(w.cashapp) || '—'}</td>
          <td>${escapeHtml(w.paypal) || '—'}</td>
          <td>
            <div>${escapeHtml(ownerName)}</div>
            <small class="text-muted">${escapeHtml(ownerEmail)}</small>
          </td>
          <td>
            <div class="d-flex gap-1">
              <a href="edit-wallet.html?id=${w._id}" class="btn btn-sm btn-primary" title="Edit">
                <i class="bi bi-pencil"></i>
              </a>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${w._id}" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
    });

    tableBody.innerHTML = html;
    attachDeleteListeners();
  }

  function attachDeleteListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;

        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'This wallet will be permanently deleted.',
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
          const res = await api.post(`/delete-wallet/${id}`);
          if (res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: res.data.message || 'Wallet deleted',
              background: '#212529',
              color: '#fff',
              timer: 1800,
              showConfirmButton: false
            });
            await loadWallets();
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