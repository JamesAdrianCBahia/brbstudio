const { pool } = require('../config/db');

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

async function findUpcoming(statuses, limit) {
  const [rows] = await pool.query(
    `SELECT b.booking_id AS id,
            DATE_FORMAT(b.event_date, '%Y-%m-%d') AS eventDate,
            ${START_MINUTES} AS startMinutes,
            ${CLIENT_NAME} AS clientName,
            GROUP_CONCAT(s.service_name ORDER BY s.service_id SEPARATOR ', ') AS serviceName
       FROM booking b
       JOIN customer c ON c.customer_id = b.customer_id
       JOIN booking_service bs ON bs.booking_id = b.booking_id
       JOIN service s ON s.service_id = bs.service_id
      WHERE b.event_date >= CURDATE()
        AND b.status IN (?)
      GROUP BY b.booking_id, b.event_date, b.start_time, c.f_name, c.l_name
      ORDER BY b.event_date, b.start_time
      LIMIT ?`,
    [statuses, limit]
  );
  return rows;
}

module.exports = {
  countAll,
  countByStatus,
  sumBalanceByStatuses,
  findUpcoming
};