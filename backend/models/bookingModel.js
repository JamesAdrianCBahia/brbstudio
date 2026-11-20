async function countAll() {
  const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM booking');
  return row.total;
}

async function countByStatus(status) {
  const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM booking WHERE status = ?', [status]);
  return row.total;
}

async function sumBalanceByStatuses(statuses) {
  const [[row]] = await pool.query(
    'SELECT COALESCE(SUM(total_amount - amount_paid), 0) AS total FROM booking WHERE status IN (?)',
    [statuses]
  );
  return Number(row.total);
}