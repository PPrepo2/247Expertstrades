// editVerify.js
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (typeof requireAuthPage === 'function') {
    requireAuthPage();
  } else if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const verifyId = urlParams.get('id');

  if (!verifyId) {
    showError('No verification ID provided');
    return;
  }

  // DOM elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const editCard = document.getElementById('editCard');
  const form = document.getElementById('editVerifyForm');

  const userDisplay = document.getElementById('userDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const docTypeDisplay = document.getElementById('docTypeDisplay');
  const statusSelect = document.getElementById('status');
  const rejectionReasonGroup = document.getElementById('rejectionReasonGroup');
  const rejectionReasonInput = document.getElementById('rejectionReason');

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

  // Show/hide rejection reason field
  function toggleRejectionField() {
    const status = statusSelect.value;
    if (status === 'rejected' || status === 'declined') {
      rejectionReasonGroup.classList.remove('d-none');
    } else {
      rejectionReasonGroup.classList.add('d-none');
    }
  }

  statusSelect.addEventListener('change', toggleRejectionField);

  // Load verification
  try {
    const res = await api.get(`/editVerify/${verifyId}`);
    const data = res.data;

    if (!data.success || !data.verification) {
      throw new Error(data.message || 'Verification not found');
    }

    const v = data.verification;

    // User info
    if (v.user) {
      userDisplay.textContent = v.user.fullname || '—';
      emailDisplay.textContent = v.user.email || '—';
    } else {
      userDisplay.textContent = 'No user linked';
      emailDisplay.textContent = '—';
    }

    docTypeDisplay.textContent = v.document_type || '—';
    statusSelect.value = v.status || 'pending';
    rejectionReasonInput.value = v.rejectionReason || '';

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

    toggleRejectionField();

    loadingState.classList.add('d-none');
    editCard.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError(err.response?.data?.message || err.message || 'Failed to load verification');
  }

  // Submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const status = statusSelect.value;
    const rejectionReason = rejectionReasonInput.value.trim();

    if ((status === 'rejected' || status === 'declined') && !rejectionReason) {
      Swal.fire({
        icon: 'warning',
        title: 'Reason Required',
        text: 'Please provide a reason when rejecting or declining.',
        background: '#212529',
        color: '#fff'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Confirm Update',
      text: `Are you sure you want to set this verification to "${status}"?`,
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
      status,
      rejectionReason: (status === 'rejected' || status === 'declined') ? rejectionReason : ''
    };

    try {
      const res = await api.put(`/editVerify/${verifyId}`, payload);

      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: res.data.message || 'Verification updated successfully',
          background: '#212529',
          color: '#fff',
          timer: 2000,
          showConfirmButton: false
        });
        window.location.href = 'allVerify.html';
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to update verification',
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