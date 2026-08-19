// addWallet.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  // Admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  const form = document.getElementById('addWalletForm');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: 'Confirm',
      text: 'Are you sure you want to add this wallet?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#286090',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, add it!',
      background: '#212529',
      color: '#fff'
    });

    if (!confirm.isConfirmed) return;

    // Build FormData for file upload
    const formData = new FormData();
    formData.append('bank_name', document.getElementById('bank_name').value.trim());
    formData.append('account_name', document.getElementById('account_name').value.trim());
    formData.append('account_no', document.getElementById('account_no').value.trim());
    formData.append('sortcode', document.getElementById('sortcode').value.trim());
    formData.append('swift_code', document.getElementById('swift_code').value.trim());
    formData.append('btc_wallet_address', document.getElementById('btc_wallet_address').value.trim());
    formData.append('paypal_email', document.getElementById('paypal_email').value.trim());

    const qrFile = document.getElementById('btc_qr_image').files[0];
    if (qrFile) {
      formData.append('btc_qr_image', qrFile);
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding...';

    try {
      const res = await api.post('/addWallet', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: res.data.message || 'Wallet created successfully',
          background: '#212529',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
        window.location.href = 'wallets.html';
      } else {
        throw new Error(res.data.message || 'Failed to create wallet');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to create wallet',
        background: '#212529',
        color: '#fff'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add Wallet';
    }
  });
});