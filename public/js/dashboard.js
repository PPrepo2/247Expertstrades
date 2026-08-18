document.addEventListener('DOMContentLoaded', async () => {
  requireAuthPage();

  // Default values
  let currentUser = null;
  let selectedExpiration = '1min';
  let selectedType = 'Turbo';

  try {
    const res = await api.get('/dashboard');
    const data = res.data;

    if (!data.success) {
      throw new Error(data.message || 'Failed to load dashboard');
    }

    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));

    // ========== FILL DYNAMIC CONTENT ==========
    const balance = Number(currentUser.balance || 0).toFixed(2);
    const bonus = Number(currentUser.bonus || 0).toFixed(2);
    const profit = Number(currentUser.profit || 0).toFixed(2);
    const email = currentUser.email || '';
    const fullname = currentUser.fullname || 'Trader';

    // Sidebar
    const sidebarEmail = document.querySelector('.ui.sidebar .item span');
    if (sidebarEmail) {
      sidebarEmail.innerHTML = `<i class="fa fa-envelope-o"></i> ${email}`;
    }

    // Balance in sidebar
    const sidebarBalance = document.querySelectorAll('.ui.sidebar .item span')[1];
    if (sidebarBalance) {
      sidebarBalance.innerHTML = `<b><i class="fa fa-money"></i> ${balance}</b> <b>USD $</b>`;
    }

    // KYC status
    updateKycStatus(currentUser.kycVerified);

    // Top wallet dropdown
    const amountVals = document.querySelectorAll('.amount-val');
    if (amountVals.length > 0) {
      amountVals[0].innerHTML = `<span style="margin-top:10px;"><b>${balance}</b> <b>USD $</b></span>
        <span style="position:absolute; font-size:small; top:0; right: 20px;"><i class="fa fa-envelope-o"></i> ${email}</span>`;
    }

    // Inside dropdown menu
    const menuItems = document.querySelectorAll('.wallet-drop-func .menu .amount-val');
    if (menuItems.length >= 3) {
      menuItems[0].innerHTML = `<b>${profit} USD $</b>`;
      menuItems[1].innerHTML = `<b>${balance} USD $</b>`;
      menuItems[2].innerHTML = `<b>${bonus} USD $</b>`;
    }

    // Global balance for trade validation
    window.userBalance = Number(balance);

    // ========== LIVE TRADES HISTORY ==========
    renderTradeHistory(data.livetrades || []);

  } catch (err) {
    console.error('Dashboard load error:', err);
    if (err.response?.status === 401) {
      logout();
    } else {
      alert('Failed to load dashboard. Please refresh.');
    }
  }

  // ========== HELPERS ==========
  function updateKycStatus(status) {
    const kycElements = document.querySelectorAll('.item');
    kycElements.forEach(el => {
      if (el.textContent.includes('Kyc Verification')) {
        if (status === 'approve') {
          el.innerHTML = `Kyc Verification: <span style="color:#00FF00" class="blinkgreen"><i class="fa fa-check-circle"></i> Approved</span>`;
        } else if (status === 'pending') {
          el.innerHTML = `Kyc Verification: <span style="color:#FFA500"><i class="fa fa-clock-o"></i> Pending</span>`;
        } else {
          el.innerHTML = `Kyc Verification: <span style="color:#FF0000" class="blinkred"><i class="fa fa-check-circle"></i> Required</span>`;
        }
      }
    });
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

  // ========== EXPIRATION SELECT ==========
  window.expTime = function(iddd) {
    selectedExpiration = iddd + 'min';
    // existing clock code can stay
  };

  // ========== PLACE TRADE (Call / Put) ==========
  window.call = async function(action = null) {
    // If called from button without argument, detect from event
    if (!action) {
      const btn = event?.target;
      if (btn && btn.classList.contains('green')) action = 'Call';
      else if (btn && btn.classList.contains('red')) action = 'Put';
      else action = 'Call';
    }

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
        type: selectedType || 'Turbo',
        action: action,
        currencypair: 'EUR/USD',
        amount: amount,
        expiration: selectedExpiration || '1min',
        profitPercent: '85'
      });

      if (res.data.success) {
        alert(`${action} trade placed successfully!`);
        // Refresh page data
        location.reload();
      } else {
        alert(res.data.message || 'Trade failed');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to place trade');
    }
  };

  // Make Call / Put buttons work
  document.querySelectorAll('button.green').forEach(btn => {
    btn.setAttribute('onclick', "call('Call')");
  });
  document.querySelectorAll('button.red').forEach(btn => {
    btn.setAttribute('onclick', "call('Put')");
  });
});