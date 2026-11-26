function toMonthlyIncome(months, rows) {
  const incomeByMonth = new Map(rows.map((row) => [row.month, toCents(row.income)]));

  return months.map((month) => ({ month, income: fromCents(incomeByMonth.get(month) ?? 0) }));
}

async function getReport(query = {}) {
  const { from, to, serviceId } = readQuery(query);
  const { startDate, endDate } = toDateRange(from, to);
  const range = { from, to };
  const months = listMonths(from, to);

  if (serviceId === null) {
    const [summary, monthlyIncome, services] = await Promise.all([
      reportModel.findSummary(startDate, endDate, PAYABLE_STATUSES),
      reportModel.findMonthlyIncome(startDate, endDate, PAYABLE_STATUSES),
      reportModel.findBookingsByService(startDate, endDate, PAYABLE_STATUSES),
    ]);

    return {
      range,
      service: null,
      summary: { bookings: summary.bookings, ...toAmounts(summary) },
      monthlyIncome: toMonthlyIncome(months, monthlyIncome),
      services: services.map((row) => ({ id: row.id, name: row.name, bookings: row.bookings, ...toAmounts(row) })),
    };
  }

  const service = await serviceModel.findById(serviceId);
  if (!service) throw new AppError('Service not found.', 404);

  const [summary, monthlyIncome, bookings] = await Promise.all([
    reportModel.findServiceSummary(serviceId, startDate, endDate, PAYABLE_STATUSES),
    reportModel.findServiceMonthlyIncome(serviceId, startDate, endDate, PAYABLE_STATUSES),
    reportModel.findServiceBookings(serviceId, startDate, endDate, PAYABLE_STATUSES),
  ]);

  return {
    range,
    service: { id: service.id, name: service.name },
    summary: { bookings: summary.bookings, ...toAmounts(summary) },
    monthlyIncome: toMonthlyIncome(months, monthlyIncome),
    bookings: bookings.map((row) => ({
      id: row.id,
      reference: row.reference,
      clientName: row.clientName,
      eventDate: row.eventDate,
      status: row.status,
      ...toAmounts(row),
    })),
  };
}