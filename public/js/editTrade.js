// editTrade.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const tradeId = urlParams.get('id');

  if (!tradeId) {
    showError('No trade ID provided');
    return;
  }

  // DOM
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const editCard = document.getElementById('editCard');
  const form = document.getElementById('editTradeForm');

  const ownerDisplay = document.getElementById('ownerDisplay');
  const typeInput = document.getElementById('type');
  const pairInput = document.getElementById('currencypair');
  const actionSelect = document.getElementById('action');
  const amountInput = document.getElementById('amount');
  const lotsizeInput = document.getElementById('lotsize');
  const entryInput = document.getElementById('entryPrice');
  const stopLossInput = document.getElementById('stopLoss');
  const takeProfitInput = document.getElementById('takeProfit');
  const expirationInput = document.getElementById('expiration');
  const profitPercentInput = document.getElementById('profitPercent');
  const statusSelect = document.getElementById('status');

  // Admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  // Load trade
  try {
    const res = await api.get(`/trades-edit/${tradeId}`);
    const data = res.data;

    if (!data.success || !data.trade) {
      throw new Error(data.message || 'Trade not found');
    }

    const t = data.trade;

    // Owner
    if (t.owner) {
      ownerDisplay.textContent = `${t.owner.fullname || 'Unknown'} (${t.owner.email || ''})`;
    } else {
      ownerDisplay.textContent = 'No Owner';
    }

    // Populate form
    typeInput.value = t.type || '';
    pairInput.value = t.currencypair || '';
    actionSelect.value = t.action || 'Call';
    amountInput.value = t.amount || '';
    lotsizeInput.value = t.lotsize || '';
    entryInput.value = t.entryPrice || '';
    stopLossInput.value = t.stopLoss || '';
    takeProfitInput.value = t.takeProfit || '';
    expirationInput.value = t.expiration || '';
    profitPercentInput.value = t.profitPercent || '';
    statusSelect.value = t.status || 'Open';

    loadingState.classList.add('d-none');
    editCard.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError(err.response?.data?.message || err.message || 'Failed to load trade');
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: 'Confirm Update',
      text: 'Are you sure you want to update this trade?',
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
      type: typeInput.value.trim(),
      action: actionSelect.value,
      currencypair: pairInput.value.trim(),
      amount: amountInput.value,
      lotsize: lotsizeInput.value,
      entryPrice: entryInput.value,
      stopLoss: stopLossInput.value,
      takeProfit: takeProfitInput.value,
      expiration: expirationInput.value.trim(),
      profitPercent: profitPercentInput.value,
      status: statusSelect.value
    };

    try {
      const res = await api.post(`/trades-edit/${tradeId}`, payload);

      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: res.data.message || 'Trade updated successfully',
          background: '#212529',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
        window.location.href = 'all-livetrade.html';
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to update trade',
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