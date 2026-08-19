// editWithdrawal.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  // Get ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const withdrawalId = urlParams.get('id');

  if (!withdrawalId) {
    showError('No withdrawal ID provided in the URL');
    return;
  }

  // DOM elements
  const loadingState   = document.getElementById('loadingState');
  const errorState     = document.getElementById('errorState');
  const editCard       = document.getElementById('editCard');
  const form           = document.getElementById('editWithdrawalForm');

  const ownerDisplay   = document.getElementById('ownerDisplay');
  const typeDisplay    = document.getElementById('typeDisplay');
  const amountInput    = document.getElementById('amount');
  const statusSelect   = document.getElementById('status');
  const narrationInput = document.getElementById('narration');

  const cryptoFields   = document.getElementById('cryptoFields');
  const cashAppFields  = document.getElementById('cashAppFields');
  const paypalFields   = document.getElementById('paypalFields');
  const bankFields     = document.getElementById('bankFields');

  const walletAddressInput = document.getElementById('walletAddress');
  const cashAppTagInput    = document.getElementById('cashAppTag');
  const paypalEmailInput   = document.getElementById('paypalEmail');
  const bankNameInput      = document.getElementById('bankName');
  const accountNumberInput = document.getElementById('accountNumber');
  const countryInput       = document.getElementById('country');
  const swiftCodeInput     = document.getElementById('swiftCode');

  // Show current admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    const emailEl = document.getElementById('admin-sidebar-email');
    const nameEl  = document.getElementById('admin-sidebar-name');
    const topName = document.getElementById('top-admin-name');

    if (emailEl) emailEl.innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    if (nameEl)  nameEl.innerHTML  = `<b>${name}</b>`;
    if (topName) topName.textContent = name;
  }

  // ========== LOAD WITHDRAWAL ==========
  try {
    const res = await api.get(`/withdrawals-edit/${withdrawalId}`);
    const data = res.data;

    if (!data.success || !data.withdrawal) {
      throw new Error(data.message || 'Withdrawal not found');
    }

    const w = data.withdrawal;

    // Owner
    if (w.owner) {
      ownerDisplay.textContent = `${w.owner.fullname || 'Unknown'} (${w.owner.email || ''})`;
    } else {
      ownerDisplay.textContent = 'No Owner';
    }

    // Type (read-only)
    typeDisplay.textContent = w.type || '—';

    // Amount & status & narration
    amountInput.value    = w.amount || '';
    statusSelect.value   = (w.status || 'pending').toLowerCase();
    narrationInput.value = w.narration || '';

    // Hide all type-specific groups first
    cryptoFields.classList.add('d-none');
    cashAppFields.classList.add('d-none');
    paypalFields.classList.add('d-none');
    bankFields.classList.add('d-none');

    // Show & fill the correct group
    if (['Bitcoin', 'Ethereum', 'USDT'].includes(w.type)) {
      cryptoFields.classList.remove('d-none');
      walletAddressInput.value = w.walletAddress || '';
      walletAddressInput.required = true;
    } else if (w.type === 'CashApp') {
      cashAppFields.classList.remove('d-none');
      cashAppTagInput.value = w.cashAppTag || '';
      cashAppTagInput.required = true;
    } else if (w.type === 'PayPal') {
      paypalFields.classList.remove('d-none');
      paypalEmailInput.value = w.paypalEmail || '';
      paypalEmailInput.required = true;
    } else if (w.type === 'Bank Transfer') {
      bankFields.classList.remove('d-none');
      const bd = w.bankDetails || {};
      bankNameInput.value      = bd.bankName || '';
      accountNumberInput.value = bd.accountNumber || '';
      countryInput.value       = bd.country || '';
      swiftCodeInput.value     = bd.swiftCode || '';

      bankNameInput.required      = true;
      accountNumberInput.required = true;
      countryInput.required       = true;
      swiftCodeInput.required     = true;
    }

    // Show the form
    loadingState.classList.add('d-none');
    editCard.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError(err.response?.data?.message || err.message || 'Failed to load withdrawal');
  }

  // ========== FORM SUBMIT ==========
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: 'Confirm Update',
      text: 'Are you sure you want to update this withdrawal?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#286090',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update it!',
      background: '#212529',
      color: '#fff'
    });

    if (!confirm.isConfirmed) return;

    const payload = {
      amount: amountInput.value,
      status: statusSelect.value,
      narration: narrationInput.value
    };

    // Add only the relevant fields
    if (!cryptoFields.classList.contains('d-none')) {
      payload.walletAddress = walletAddressInput.value.trim();
    }
    if (!cashAppFields.classList.contains('d-none')) {
      payload.cashAppTag = cashAppTagInput.value.trim();
    }
    if (!paypalFields.classList.contains('d-none')) {
      payload.paypalEmail = paypalEmailInput.value.trim();
    }
    if (!bankFields.classList.contains('d-none')) {
      payload.bankName      = bankNameInput.value.trim();
      payload.accountNumber = accountNumberInput.value.trim();
      payload.country       = countryInput.value.trim();
      payload.swiftCode     = swiftCodeInput.value.trim();
    }

    try {
      const res = await api.post(`/withdrawals-edit/${withdrawalId}`, payload);

      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: res.data.message || 'Withdrawal updated successfully',
          background: '#212529',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
        window.location.href = 'allWidthdrawals.html';
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to update withdrawal',
        background: '#212529',
        color: '#fff'
      });
    }
  });

  function showError(msg) {
    loadingState.classList.add('d-none');
    errorState.textContent = msg;
    errorState.classList.remove('d-none');
  }
});