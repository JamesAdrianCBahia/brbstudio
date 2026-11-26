async function createVoucher(body) {
  const fields = normalizeFields(body);
  validateFields(fields);

  try {
    const id = await voucherModel.create(fields);
    return toPublicVoucher(await voucherModel.findById(id));
  } catch (error) {
    if (error.code === MYSQL_DUPLICATE_ENTRY) throw codeTakenError();
    throw error;
  }
}
