// viewTrade.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  // Get trade ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tradeId = urlParams.get('id');

  if (!tradeId) {
    showError('No trade ID provided in the URL');
    return;
  }

  // DOM elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const tradeCard = document.getElementById('tradeCard');

  const ownerDisplay = document.getElementById('ownerDisplay');
  const typeDisplay = document.getElementById('typeDisplay');
  const pairDisplay = document.getElementById('pairDisplay');
  const actionDisplay = document.getElementById('actionDisplay');
  const amountDisplay = document.getElementById('amountDisplay');
  const lotsizeDisplay = document.getElementById('lotsizeDisplay');
  const entryDisplay = document.getElementById('entryDisplay');
  const stopLossDisplay = document.getElementById('stopLossDisplay');
  const takeProfitDisplay = document.getElementById('takeProfitDisplay');
  const expirationDisplay = document.getElementById('expirationDisplay');
  const profitPercentDisplay = document.getElementById('profitPercentDisplay');
  const statusDisplay = document.getElementById('statusDisplay');
  const createdAtDisplay = document.getElementById('createdAtDisplay');
  const updatedAtDisplay = document.getElementById('updatedAtDisplay');
  const editTradeBtn = document.getElementById('editTradeBtn');

  // Show current admin
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  // Load trade
  try {
    const res = await api.get(`/trades-view/${tradeId}`);
    const data = res.data;

    if (!data.success || !data.trade) {
      throw new Error(data.message || 'Trade not found');
    }

    const t = data.trade;

    // Owner
    if (t.owner) {
      ownerDisplay.textContent = `${t.owner.fullname || t.owner.username || 'Unknown'} (${t.owner.email || ''})`;
    } else {
      ownerDisplay.textContent = 'No Owner';
    }

    // Basic fields
    typeDisplay.textContent = t.type || '—';
    pairDisplay.textContent = t.currencypair || '—';
    amountDisplay.textContent = t.amount || '—';
    lotsizeDisplay.textContent = t.lotsize || '—';
    entryDisplay.textContent = t.entryPrice || '—';
    stopLossDisplay.textContent = t.stopLoss || '—';
    takeProfitDisplay.textContent = t.takeProfit || '—';
    expirationDisplay.textContent = t.expiration || '—';
    profitPercentDisplay.textContent = t.profitPercent ? `${t.profitPercent}%` : '—';

    // Action with badge
    if (t.action === 'Call' || t.action === 'BUY') {
      actionDisplay.innerHTML = `<span class="badge bg-success">${t.action}</span>`;
    } else if (t.action === 'Put' || t.action === 'SELL') {
      actionDisplay.innerHTML = `<span class="badge bg-danger">${t.action}</span>`;
    } else {
      actionDisplay.textContent = t.action || '—';
    }

    // Status with badge
    const status = t.status || 'Open';
    let statusBadge = '';
    if (status === 'Open') statusBadge = `<span class="badge bg-primary">Open</span>`;
    else if (status === 'Closed') statusBadge = `<span class="badge bg-secondary">Closed</span>`;
    else if (status === 'Won') statusBadge = `<span class="badge bg-success">Won</span>`;
    else if (status === 'Lost') statusBadge = `<span class="badge bg-danger">Lost</span>`;
    else statusBadge = `<span class="badge bg-dark">${status}</span>`;
    statusDisplay.innerHTML = statusBadge;

    // Dates
    createdAtDisplay.textContent = t.createdAt
      ? new Date(t.createdAt).toLocaleString()
      : '—';
    updatedAtDisplay.textContent = t.updatedAt
      ? new Date(t.updatedAt).toLocaleString()
      : '—';

    // Edit button
    if (editTradeBtn) {
      editTradeBtn.href = `editTrade.html?id=${t._id}`;
    }

    // Show card
    loadingState.classList.add('d-none');
    tradeCard.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError(err.response?.data?.message || err.message || 'Failed to load trade details');
  }

  function showError(msg) {
    loadingState.classList.add('d-none');
    errorState.textContent = msg;
    errorState.classList.remove('d-none');
  }
});