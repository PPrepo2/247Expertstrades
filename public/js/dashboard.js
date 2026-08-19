document.addEventListener('DOMContentLoaded', async () => {
  requireAuthPage();

  let currentUser = null;

  if (typeof window.selectedExpiration === 'undefined') window.selectedExpiration = '1min';
  if (typeof window.selectedType === 'undefined') window.selectedType = 'Turbo';

  try {
    const res = await api.get('/dashboard');
    const data = res.data;

    if (!data.success) {
      throw new Error(data.message || 'Failed to load dashboard');
    }

    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));

    const balance = Number(currentUser.balance || 0).toFixed(2);
    const bonus = Number(currentUser.bonus || 0).toFixed(2);
    const profit = Number(currentUser.profit || 0).toFixed(2);
    const email = currentUser.email || '';

    const sidebarEmail = document.getElementById('sidebar-email');
    if (sidebarEmail) {
      sidebarEmail.innerHTML = `<i class="fa fa-envelope-o"></i> ${email}`;
    }

    const sidebarBalance = document.getElementById('sidebar-balance');
    if (sidebarBalance) {
      sidebarBalance.innerHTML = `<b><i class="fa fa-money"></i> ${balance}</b> <b>USD $</b>`;
    }

    updateKycStatus(currentUser.kycVerified);

    const displayBalance = document.getElementById('display-balance');
    if (displayBalance) displayBalance.textContent = balance;

    const displayEmail = document.getElementById('display-email');
    if (displayEmail) {
      displayEmail.innerHTML = `<i class="fa fa-envelope-o"></i> ${email}`;
    }

    const displayProfit = document.getElementById('display-profit');
    if (displayProfit) displayProfit.textContent = `${profit} USD $`;

    const displayDeposit = document.getElementById('display-deposit');
    if (displayDeposit) displayDeposit.textContent = `${balance} USD $`;

    const displayBonus = document.getElementById('display-bonus');
    if (displayBonus) displayBonus.textContent = `${bonus} USD $`;

    window.userBalance = Number(balance);

    renderTradeHistory(data.livetrades || []);

  } catch (err) {
    console.error('Dashboard load error:', err);
    if (err.response?.status === 401) {
      logout();
    } else {
      alert('Failed to load dashboard. Please refresh.');
    }
  }

  function updateKycStatus(status) {
    const html =
      status === 'approve' || status === 'approved'
        ? `Kyc Verification: <span style="color:#00FF00" class="blinkgreen"><i class="fa fa-check-circle"></i> Approved</span>`
        : status === 'pending'
        ? `Kyc Verification: <span style="color:#FFA500"><i class="fa fa-clock-o"></i> Pending</span>`
        : `Kyc Verification: <span style="color:#FF0000" class="blinkred"><i class="fa fa-check-circle"></i> Required</span>`;

    const top = document.getElementById('top-kyc');
    const side = document.getElementById('sidebar-kyc');
    if (top) top.innerHTML = html;
    if (side) side.innerHTML = html;
  }

  function renderTradeHistory(trades) {
    const container = document.getElementById('trade-history-container');
    if (!container) return;

    if (!trades || trades.length === 0) {
      container.innerHTML = '<p>All your trading history will appear here.</p>';
      return;
    }

    let html = `
      <table style="width:100%; color:#fff; border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #444;">
            <th style="padding:8px;text-align:left;">Date</th>
            <th style="padding:8px;text-align:left;">Pair</th>
            <th style="padding:8px;text-align:left;">Type</th>
            <th style="padding:8px;text-align:left;">Action</th>
            <th style="padding:8px;text-align:left;">Amount</th>
            <th style="padding:8px;text-align:left;">Exp</th>
            <th style="padding:8px;text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    trades.forEach(t => {
      const color = t.action === 'Call' ? '#0f0' : '#f00';
      const displayAmount = t.amount || t.lotsize || '0.00';
      html += `
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:8px;">${new Date(t.createdAt).toLocaleString()}</td>
          <td style="padding:8px;">${t.currencypair || 'EUR/USD'}</td>
          <td style="padding:8px;">${t.type || 'Turbo'}</td>
          <td style="padding:8px;color:${color};font-weight:bold;">${t.action || '—'}</td>
          <td style="padding:8px;">$${displayAmount}</td>
          <td style="padding:8px;">${t.expiration || '1min'}</td>
          <td style="padding:8px;">${t.status || 'Open'}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  window.expTime = function (iddd) {
    window.selectedExpiration = iddd + 'min';
    if (typeof d !== 'undefined') {
      var nhour = d.getHours(),
          nmin = d.getMinutes();
      if (nhour <= 9) nhour = '0' + nhour;
      if (nmin <= 9) nmin = '0' + nmin;
      var nminutes = Number(nmin) + Number(iddd);
      var timeEl = document.getElementById('time');
      if (!timeEl) return;
      if (nminutes > 60) {
        var excess = Number(nminutes) - 60;
        var nhours = Number(nhour) + 1;
        if (excess <= 9) excess = '0' + excess;
        if (nhours <= 9) nhours = '0' + nhours;
        timeEl.innerHTML = "<i class='fa fa-clock-o'></i>&nbsp;" + nhours + ':' + excess;
      } else {
        if (nminutes <= 9) nminutes = '0' + nminutes;
        timeEl.innerHTML = "<i class='fa fa-clock-o'></i>&nbsp;" + nhour + ':' + nminutes;
      }
    }
  };

  window.placeTrade = window.call = async function (action) {
    if (!action) action = 'Call';

    const amountInput = document.getElementById('amount');
    const amount = amountInput ? amountInput.value : '10.00';

    if (!amount || Number(amount) <= 0) {
      alert('Amount is invalid');
      return;
    }

    if (Number(amount) > (window.userBalance || 0)) {
      alert('Insufficient balance');
      return;
    }

    try {
      const res = await api.post('/livetrade', {
        type: window.selectedType || 'Turbo',
        action: action,
        currencypair: 'EUR/USD',
        amount: amount,
        expiration: window.selectedExpiration || '1min',
        profitPercent: '85'
      });

      if (res.data.success) {
        alert(action + ' trade placed successfully!');
        location.reload();
      } else {
        alert(res.data.message || 'Trade failed');
      }
    } catch (err) {
      console.error(err);
      alert((err.response && err.response.data && err.response.data.message) || 'Failed to place trade');
    }
  };
});