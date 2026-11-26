function openVoucherDialog(voucher = null) {
  const { elements: fields } = elements.voucherForm;

  editingVoucher = voucher;

  elements.voucherForm.reset();
  clearFormErrors(elements.voucherForm);

  elements.voucherDialogTitle.textContent = voucher ? 'Edit Voucher' : 'New Voucher';
  fields.code.value = voucher?.code ?? '';
  fields.name.value = voucher?.name ?? '';
  fields.discountType.value = voucher?.discountType ?? 'Percentage';
  fields.discountValue.value = voucher?.discountValue ?? '';
  fields.startDate.value = voucher?.startDate ?? '';
  fields.endDate.value = voucher?.endDate ?? '';
  fields.usageLimit.value = voucher?.usageLimit ?? '';
  updateDiscountPrefix();

  elements.voucherDialog.showModal();
  fields.code.focus();
}

async function handleVoucherSubmit(event) {
  event.preventDefault();
  clearFormErrors(elements.voucherForm);
  elements.voucherSubmit.disabled = true;

  try {
    const payload = Object.fromEntries(new FormData(elements.voucherForm));
    const saved = editingVoucher
      ? await sendJson(`${API_BASE}/${editingVoucher.id}`, 'PUT', payload)
      : await sendJson(API_BASE, 'POST', payload);

    if (editingVoucher) {
      vouchers[vouchers.findIndex((voucher) => voucher.id === saved.id)] = saved;
    } else {
      vouchers.push(saved);
    }

    renderVouchers();
    elements.voucherDialog.close();
    showToast(editingVoucher ? `${saved.code} was updated.` : `${saved.code} was added.`);
  } catch (error) {
    showFormError(elements.voucherForm, error);
  } finally {
    elements.voucherSubmit.disabled = false;
  }
}

elements.addButton.addEventListener('click', () => openVoucherDialog());
elements.searchInput.addEventListener('input', renderVouchers);

elements.grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const voucher = findVoucher(button.closest('.voucher-card').dataset.id);

  if (button.dataset.action === 'edit') openVoucherDialog(voucher);
  if (button.dataset.action === 'remove') openDeleteDialog(voucher);
});

elements.voucherForm.addEventListener('submit', handleVoucherSubmit);
elements.voucherForm.elements.discountType.addEventListener('change', updateDiscountPrefix);
elements.confirmDelete.addEventListener('click', handleConfirmDelete);

clearFieldOnInput(elements.voucherForm);
enableDialogDismiss();
loadVouchers();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadVouchers();
});

async function handleVoucherSubmit(event) {
  event.preventDefault();
  clearFormErrors(elements.voucherForm);
  elements.voucherSubmit.disabled = true;

  try {
    const payload = Object.fromEntries(new FormData(elements.voucherForm));
    const saved = editingVoucher
      ? await sendJson(`${API_BASE}/${editingVoucher.id}`, 'PUT', payload)
      : await sendJson(API_BASE, 'POST', payload);

    if (editingVoucher) {
      vouchers[vouchers.findIndex((voucher) => voucher.id === saved.id)] = saved;
    } else {
      vouchers.push(saved);
    }

    renderVouchers();
    elements.voucherDialog.close();
    showToast(editingVoucher ? `${saved.code} was updated.` : `${saved.code} was added.`);
  } catch (error) {
    showFormError(elements.voucherForm, error);
  } finally {
    elements.voucherSubmit.disabled = false;
  }
}