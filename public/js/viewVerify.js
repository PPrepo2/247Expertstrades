// viewVerify.js
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
  const verifyId = urlParams.get('id');

  if (!verifyId) {
    showError('No verification ID provided in the URL');
    return;
  }

  // DOM elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const verifyCard = document.getElementById('verifyCard');

  const userDisplay = document.getElementById('userDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const telDisplay = document.getElementById('telDisplay');
  const countryDisplay = document.getElementById('countryDisplay');
  const docTypeDisplay = document.getElementById('docTypeDisplay');
  const statusDisplay = document.getElementById('statusDisplay');
  const rejectionDisplay = document.getElementById('rejectionDisplay');
  const reviewedByDisplay = document.getElementById('reviewedByDisplay');
  const reviewedAtDisplay = document.getElementById('reviewedAtDisplay');
  const createdAtDisplay = document.getElementById('createdAtDisplay');
  const updatedAtDisplay = document.getElementById('updatedAtDisplay');
  const editVerifyBtn = document.getElementById('editVerifyBtn');

  const frontImg = document.getElementById('frontImg');
  const backImg = document.getElementById('backImg');
  const photoImg = document.getElementById('photoImg');
  const frontImgPlaceholder = document.getElementById('frontImgPlaceholder');
  const backImgPlaceholder = document.getElementById('backImgPlaceholder');
  const photoImgPlaceholder = document.getElementById('photoImgPlaceholder');

  // Admin name
  const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (currentUser) {
    const name = currentUser.fullname || currentUser.email || 'Admin';
    document.getElementById('admin-sidebar-name').innerHTML = `<b>${name}</b>`;
    document.getElementById('admin-sidebar-email').innerHTML = `<i class="fa fa-envelope-o"></i> ${currentUser.email || ''}`;
    document.getElementById('top-admin-name').textContent = name;
  }

  // Load verification
  try {
    const res = await api.get(`/viewVerify/${verifyId}`);
    const data = res.data;

    if (!data.success || !data.verification) {
      throw new Error(data.message || 'Verification not found');
    }

    const v = data.verification;

    // User info
    if (v.user) {
      userDisplay.textContent = v.user.fullname || '—';
      emailDisplay.textContent = v.user.email || '—';
      telDisplay.textContent = v.user.tel || '—';
      countryDisplay.textContent = v.user.country || '—';
    } else {
      userDisplay.textContent = 'No user linked';
      emailDisplay.textContent = '—';
      telDisplay.textContent = '—';
      countryDisplay.textContent = '—';
    }

    // Document type
    docTypeDisplay.textContent = v.document_type || '—';

    // Status badge
    const status = (v.status || 'pending').toLowerCase();
    let statusBadge = '';
    if (status === 'pending') statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
    else if (status === 'under review') statusBadge = `<span class="badge bg-info">Under Review</span>`;
    else if (status === 'approved') statusBadge = `<span class="badge bg-success">Approved</span>`;
    else if (status === 'rejected' || status === 'declined') {
      statusBadge = `<span class="badge bg-danger">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    } else {
      statusBadge = `<span class="badge bg-secondary">${status}</span>`;
    }
    statusDisplay.innerHTML = statusBadge;

    // Rejection reason
    rejectionDisplay.textContent = v.rejectionReason || '—';

    // Reviewed by
    if (v.reviewedBy) {
      reviewedByDisplay.textContent = v.reviewedBy.fullname || v.reviewedBy.email || '—';
    } else {
      reviewedByDisplay.textContent = 'Not reviewed yet';
    }

    // Dates
    reviewedAtDisplay.textContent = v.reviewedAt
      ? new Date(v.reviewedAt).toLocaleString()
      : '—';
    createdAtDisplay.textContent = v.createdAt
      ? new Date(v.createdAt).toLocaleString()
      : '—';
    updatedAtDisplay.textContent = v.updatedAt
      ? new Date(v.updatedAt).toLocaleString()
      : '—';

    // Images
    if (v.frontimg) {
      frontImg.src = v.frontimg;
      frontImg.classList.remove('d-none');
      frontImgPlaceholder.classList.add('d-none');
    }
    if (v.backimg) {
      backImg.src = v.backimg;
      backImg.classList.remove('d-none');
      backImgPlaceholder.classList.add('d-none');
    }
    if (v.photo) {
      photoImg.src = v.photo;
      photoImg.classList.remove('d-none');
      photoImgPlaceholder.classList.add('d-none');
    }

    // Edit button
    if (editVerifyBtn) {
      editVerifyBtn.href = `editVerify.html?id=${v._id}`;
    }

    // Show card
    loadingState.classList.add('d-none');
    verifyCard.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError(err.response?.data?.message || err.message || 'Failed to load verification details');
  }

  function showError(msg) {
    loadingState.classList.add('d-none');
    errorState.textContent = msg;
    errorState.classList.remove('d-none');
  }
});