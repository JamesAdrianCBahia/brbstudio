const bcrypt = require('bcryptjs');
const customerModel = require('../models/customerModel');
const AppError = require('./appError');

const SALT_ROUNDS = 10;
const MYSQL_DUPLICATE_ENTRY = 'ER_DUP_ENTRY';

const NAME_PATTERN    = /^\p{L}[\p{L} .'-]*$/u;
const EMAIL_PATTERN   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_PATTERN = /^09\d{9}$/;

const asText = (value) => String(value ?? '').trim();

async function getProfile(customerId) {
  const customer = await customerModel.findById(customerId);
  if (!customer) throw new AppError('Account not found.', 404);
  return customer;
}

function validateProfileFields(data) {
  const errors = {};

  if (!data.firstName) errors.firstName = 'First name is required.';
  else if (data.firstName.length > 50) errors.firstName = 'First name must be 50 characters or fewer.';
  else if (!NAME_PATTERN.test(data.firstName)) errors.firstName = 'First name can only contain letters, spaces, apostrophes and hyphens.';

  if (!data.lastName) errors.lastName = 'Last name is required.';
  else if (data.lastName.length > 50) errors.lastName = 'Last name must be 50 characters or fewer.';
  else if (!NAME_PATTERN.test(data.lastName)) errors.lastName = 'Last name can only contain letters, spaces, apostrophes and hyphens.';

  if (!data.email) errors.email = 'Email address is required.';
  else if (data.email.length > 100 || !EMAIL_PATTERN.test(data.email)) errors.email = 'Enter a valid email address.';

  if (!data.contactNumber) errors.contactNumber = 'Contact number is required.';
  else if (!CONTACT_PATTERN.test(data.contactNumber)) errors.contactNumber = 'Enter a valid mobile number, e.g. 09123456789.';

  return errors;
}

async function updateProfile(customerId, body) {
  const data = {
    firstName:     asText(body?.firstName),
    lastName:      asText(body?.lastName),
    email:         asText(body?.email).toLowerCase(),
    contactNumber: asText(body?.contactNumber).replace(/[\s-]/g, ''),
  };

  const errors = validateProfileFields(data);
  if (Object.keys(errors).length > 0) throw new AppError('Please fix the highlighted fields.', 400, errors);

  try {
    await customerModel.update(customerId, data);
  } catch (error) {
    if (error.code === MYSQL_DUPLICATE_ENTRY) {
      throw new AppError('This email is already registered.', 409, { email: 'This email is already registered.' });
    }
    throw error;
  }

  return data;
}

async function changePassword(customerId, body) {
  const currentPassword = asText(body?.currentPassword);
  const newPassword     = asText(body?.newPassword);
  const confirmPassword = asText(body?.confirmPassword);

  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Current password is required.';
  if (!newPassword) errors.newPassword = 'New password is required.';
  else if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.';
  else if (newPassword.length > 72) errors.newPassword = 'Password must be 72 characters or fewer.';
  else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    errors.newPassword = 'Password must contain at least one letter and one number.';
  }
  if (!errors.newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (Object.keys(errors).length > 0) throw new AppError('Please fix the highlighted fields.', 400, errors);

  const customer = await customerModel.findById(customerId);
  if (!customer) throw new AppError('Account not found.', 404);

  const full = await customerModel.findByEmail(customer.email);
  const matches = await bcrypt.compare(currentPassword, full.passwordHash);
  if (!matches) {
    throw new AppError('Please fix the highlighted fields.', 400, { currentPassword: 'Current password is incorrect.' });
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await customerModel.updatePassword(customerId, newHash);

  return { message: 'Password updated successfully.' };
}

module.exports = { getProfile, updateProfile, changePassword };
