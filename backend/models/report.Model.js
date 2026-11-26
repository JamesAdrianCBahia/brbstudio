async function findSummary(startDate, endDate, statuses) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS bookings,
            COALESCE(SUM(b.total_amount), 0) AS bookingValue,
            COALESCE(SUM(b.amount_paid), 0) AS received
       FROM booking b
      WHERE b.event_date BETWEEN ? AND ?
        AND b.status IN (?)`,
    [startDate, endDate, statuses]
  );
  return row;
}

async function findMonthlyIncome(startDate, endDate, statuses) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(b.event_date, '%Y-%m') AS month,
            COALESCE(SUM(b.amount_paid), 0) AS income
       FROM booking b
      WHERE b.event_date BETWEEN ? AND ?
        AND b.status IN (?)
      GROUP BY month`,
    [startDate, endDate, statuses]
  );
  return rows;
}