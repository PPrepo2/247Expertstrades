// editWallet.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const walletId = urlParams.get('id');

  if (!walletId) {
    showError('No wallet ID provided');
    return;
  }

  // DOM
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const editCard = document.getElementById('editCard');
  const form = document.getElementById('editWalletForm');
  const submitBtn = document.getElementById('submitBtn');

  const bankNameInput = document.getElementById('bank_name');
  const accountNameInput = document.getElementById('account_name');
  const accountNoInput = document.getElementById('account_no');
  const sortcodeInput = document.getElementById('sortcode');
  const swiftCodeInput = document.getElementById('swift_code');
  const btcAddressInput = document.getElementById('btc_wallet_address');
  const paypalInput = document.getElementById('paypal_email');
  const qrFileInput = document.getElementById('btc_qr_image');
  const currentQrPreview = document.getElementById('currentQrPreview');
  const currentQrImg = document.getElementById('currentQrImg');

  // Admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  // Load wallet
  try {
    const res = await api.get(`/editWallet/${walletId}`);
    const data = res.data;

    if (!data.success || !data.wallet) {
      throw new Error(data.message || 'Wallet not found');
    }

    const w = data.wallet;

    // Populate form
    bankNameInput.value = w.bank_name || '';
    accountNameInput.value = w.account_name || '';
    accountNoInput.value = w.account_no || '';
    sortcodeInput.value = w.sortcode || '';
    swiftCodeInput.value = w.swift_code || '';
    btcAddressInput.value = w.btc_wallet_address || '';
    paypalInput.value = w.paypal_email || '';

    // Show current QR image if exists
    if (w.btc_qr_image) {
      currentQrImg.src = w.btc_qr_image;
      currentQrPreview.classList.remove('d-none');
    }

    loadingState.classList.add('d-none');
    editCard.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError(err.response?.data?.message || err.message || 'Failed to load wallet');
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: 'Confirm Update',
      text: 'Are you sure you want to update this wallet?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#286090',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update it!',
      background: '#212529',
      color: '#fff'
    });

    if (!confirm.isConfirmed) return;

    // Build FormData
    const formData = new FormData();
    formData.append('bank_name', bankNameInput.value.trim());
    formData.append('account_name', accountNameInput.value.trim());
    formData.append('account_no', accountNoInput.value.trim());
    formData.append('sortcode', sortcodeInput.value.trim());
    formData.append('swift_code', swiftCodeInput.value.trim());
    formData.append('btc_wallet_address', btcAddressInput.value.trim());
    formData.append('paypal_email', paypalInput.value.trim());

    const qrFile = qrFileInput.files[0];
    if (qrFile) {
      formData.append('btc_qr_image', qrFile);
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Updating...';

    try {
      const res = await api.put(`/editWallet/${walletId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: res.data.message || 'Wallet updated successfully',
          background: '#212529',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
        window.location.href = 'wallets.html';
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to update wallet',
        background: '#212529',
        color: '#fff'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Update Wallet';
    }
  });

  function showError(msg) {
    loadingState.classList.add('d-none');
    errorState.textContent = msg;
    errorState.classList.remove('d-none');
  }
});