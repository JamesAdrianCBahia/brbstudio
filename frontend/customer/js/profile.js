import { getJson, postJson, putJson } from './api.js';
import {
  clearErrorOnInput,
  clearFormErrors,
  setSubmitting,
  showAlert,
  showFieldErrors,
  showNetworkError,
  showServerError,
} from './form-helpers.js';

const displayName  = document.getElementById('displayName');
const displayEmail = document.getElementById('displayEmail');

const profileForm    = document.getElementById('profileForm');
const profileSuccess = document.getElementById('profileSuccess');
const profileError   = document.getElementById('profileError');
const saveProfile    = document.getElementById('saveProfile');

const passwordForm    = document.getElementById('passwordForm');
const passwordSuccess = document.getElementById('passwordSuccess');
const passwordError   = document.getElementById('passwordError');
const updatePassword  = document.getElementById('updatePassword');

const logoutBtn = document.getElementById('logoutBtn');

async function init() {
  const session = await getJson('/api/auth/me');
  if (!session.ok) {
    window.location.replace('/customer/html/login.html');
    return;
  }

  const { ok, data } = await getJson('/api/customer/profile');
  if (!ok) return;

  const p = data.profile;
  displayName.textContent  = `${p.firstName} ${p.lastName}`;
  displayEmail.textContent = p.email;

  profileForm.elements.firstName.value     = p.firstName;
  profileForm.elements.lastName.value      = p.lastName;
  profileForm.elements.email.value         = p.email;
  profileForm.elements.contactNumber.value = p.contactNumber;
}

function validateProfileFields(values) {
  const errors = {};
  if (!values.firstName?.trim())     errors.firstName     = 'First name is required.';
  if (!values.lastName?.trim())      errors.lastName      = 'Last name is required.';
  if (!values.email?.trim())         errors.email         = 'Email address is required.';
  if (!values.contactNumber?.trim()) errors.contactNumber = 'Contact number is required.';
  return errors;
}

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormErrors(profileForm, profileError);
  profileSuccess.hidden = true;

  const values = Object.fromEntries(new FormData(profileForm));
  if (showFieldErrors(profileForm, validateProfileFields(values))) return;

  setSubmitting(saveProfile, true);

  try {
    const response = await putJson('/api/customer/profile', values);

    if (response.ok) {
      const { firstName, lastName, email } = response.data.profile;
      displayName.textContent  = `${firstName} ${lastName}`;
      displayEmail.textContent = email;
      showAlert(profileSuccess, 'Changes saved successfully.');
    } else {
      showServerError(profileForm, profileError, response);
    }
  } catch {
    showNetworkError(profileError);
  }

  setSubmitting(saveProfile, false);
});

function validatePasswordFields({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Current password is required.';
  if (!newPassword)     errors.newPassword     = 'New password is required.';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password.';
  if (!errors.newPassword && !errors.confirmPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormErrors(passwordForm, passwordError);
  passwordSuccess.hidden = true;

  const values = Object.fromEntries(new FormData(passwordForm));
  if (showFieldErrors(passwordForm, validatePasswordFields(values))) return;

  setSubmitting(updatePassword, true);

  try {
    const response = await postJson('/api/customer/profile/password', values);

    if (response.ok) {
      passwordForm.reset();
      showAlert(passwordSuccess, 'Password updated successfully.');
    } else {
      showServerError(passwordForm, passwordError, response);
    }
  } catch {
    showNetworkError(passwordError);
  }

  setSubmitting(updatePassword, false);
});

logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  try {
    const { ok, data } = await postJson('/api/auth/logout', {});
    if (ok) window.location.assign(data.redirectTo);
    else logoutBtn.disabled = false;
  } catch {
    logoutBtn.disabled = false;
  }
});

clearErrorOnInput(profileForm);
clearErrorOnInput(passwordForm);

init();
