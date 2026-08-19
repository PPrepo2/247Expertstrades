document.addEventListener('DOMContentLoaded', async function () {
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  }

  let allTrades = [];
  let currentUser = null;

  function formatMoney(v) {
    const n = Number(v);
    return isNaN(n) ? '0.00' : n.toFixed(2);
  }

  function kycHtml(status) {
    if (status === 'approve') {
      return 'Kyc Verification: <span style="color:#0f0" class="blinkgreen"><i class="fa fa-check-circle"></i> Verified</span>';
    }
    if (status === 'pending') {
      return 'Kyc Verification: <span style="color:#ff0"><i class="fa fa-clock-o"></i> Pending</span>';
    }
    return 'Kyc Verification: <span style="color:#FF0000" class="blinkred"><i class="fa fa-check-circle"></i> Required</span>';
  }

  function renderUser(user) {
    currentUser = user;
    const bal = formatMoney(user.balance);
    const cur = user.currency || 'USD $';
    const email = user.email || '';

    const se = document.getElementById('sidebar-email');
    if (se) se.innerHTML = '<i class="fa fa-envelope-o"></i> ' + email;

    const sb = document.getElementById('sidebar-balance');
    if (sb) sb.innerHTML = '<b><i class="fa fa-money"></i> ' + bal + '</b> <b>' + cur + '</b>';

    const sk = document.getElementById('sidebar-kyc');
    if (sk) sk.innerHTML = kycHtml(user.kycVerified);

    const tk = document.getElementById('top-kyc');
    if (tk) tk.innerHTML = kycHtml(user.kycVerified);

    const db = document.getElementById('display-balance');
    if (db) db.textContent = bal;

    const dc = document.getElementById('display-currency');
    if (dc) dc.textContent = cur;

    const dp = document.getElementById('display-profit');
    if (dp) dp.textContent = formatMoney(user.profit) + ' ' + cur;

    const dbon = document.getElementById('display-bonus');
    if (dbon) dbon.textContent = formatMoney(user.bonus) + ' ' + cur;

    const de = document.getElementById('display-email');
    if (de) de.innerHTML = '<i class="fa fa-envelope-o"></i> ' + email;
  }

  function statusColor(status) {
    const s = (status || '').toLowerCase();
    if (s === 'won' || s === 'open') return '#0f0';
    if (s === 'lost') return '#f00';
    if (s === 'closed') return '#aaa';
    return '#fff';
  }

  function renderTrades(trades) {
    const container = document.getElementById('trade-history-container');
    if (!container) return;

    if (!trades || trades.length === 0) {
      container.innerHTML = '<p style="padding:16px;color:#ccc;">No trades found for this filter.</p>';
      return;
    }

    let html = `
      <table class="ui celled table" style="width:100%;color:#fff;border-collapse:collapse;min-width:700px;">
        <thead>
          <tr style="border-bottom:1px solid #444;text-align:left;">
            <th style="padding:10px;">Date</th>
            <th style="padding:10px;">Pair</th>
            <th style="padding:10px;">Type</th>
            <th style="padding:10px;">Action</th>
            <th style="padding:10px;">Amount</th>
            <th style="padding:10px;">Expiration</th>
            <th style="padding:10px;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    trades.forEach(function (t) {
      const actionColor = t.action === 'Call' ? '#0f0' : '#f00';
      const amount = t.amount || t.lotsize || '0.00';
      const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString() : '—';
      html += `
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:10px;">${dateStr}</td>
          <td style="padding:10px;">${t.currencypair || 'EUR/USD'}</td>
          <td style="padding:10px;">${t.type || 'Turbo'}</td>
          <td style="padding:10px;color:${actionColor};font-weight:bold;">${t.action || '—'}</td>
          <td style="padding:10px;">$${amount}</td>
          <td style="padding:10px;">${t.expiration || '1min'}</td>
          <td style="padding:10px;color:${statusColor(t.status)};font-weight:bold;">${t.status || 'Open'}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function applyFilter() {
    const filterEl = document.getElementById('statusFilter');
    const value = filterEl ? filterEl.value : 'ALL';
    if (value === 'ALL') {
      renderTrades(allTrades);
    } else {
      renderTrades(allTrades.filter(function (t) {
        return String(t.status || '').toLowerCase() === value.toLowerCase();
      }));
    }
  }

  // Sidebar toggle
  (function initSidebar() {
    var sidebar = document.getElementById('mainSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var toggleBtn = document.getElementById('menuToggleBtn') || document.querySelector('.menu-toggle');

    function openSidebar() {
      if (sidebar) sidebar.classList.add('visible');
      if (overlay) overlay.classList.add('active');
    }
    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('visible');
      if (overlay) overlay.classList.remove('active');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (sidebar && sidebar.classList.contains('visible')) closeSidebar();
        else openSidebar();
      });
    }
    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (sidebar) {
      sidebar.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeSidebar);
      });
    }
  })();

  // Wallet dropdown
  (function initWalletDrop() {
    var walletDrop = document.getElementById('walletDropdown');
    var walletMenu = document.getElementById('walletDropdownMenu');
    if (!walletDrop) return;

    function toggle() {
      walletDrop.classList.toggle('active');
      if (walletMenu) {
        walletMenu.style.display = walletDrop.classList.contains('active') ? 'block' : 'none';
      }
    }

    walletDrop.addEventListener('click', function (e) {
      if (!e.target.closest('.menu')) toggle();
    });
    document.addEventListener('click', function (e) {
      if (!walletDrop.contains(e.target)) {
        walletDrop.classList.remove('active');
        if (walletMenu) walletMenu.style.display = 'none';
      }
    });
  })();

  // Load data
  try {
    let userId = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) userId = JSON.parse(stored)._id;
    } catch (e) {}

    if (!userId) {
      window.location.href = 'login.html';
      return;
    }

    const res = await api.get('/trade-history/' + userId);
    if (!res.data || !res.data.success) {
      throw new Error((res.data && res.data.message) || 'Failed to load history');
    }

    renderUser(res.data.user);
    allTrades = res.data.trades || [];
    renderTrades(allTrades);

    const filterEl = document.getElementById('statusFilter');
    if (filterEl) {
      filterEl.addEventListener('change', applyFilter);
    }
  } catch (err) {
    console.error(err);
    if (err.response && err.response.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const container = document.getElementById('trade-history-container');
    if (container) {
      container.innerHTML = '<p style="padding:16px;color:#f66;">Failed to load trading history. Please try again.</p>';
    }
  }
});