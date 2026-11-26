async function create(req, res, next) {
  try {
    res.status(201).json(await voucherService.createVoucher(req.body));
  } catch (error) {
    sendError(error, res, next);
  }
}