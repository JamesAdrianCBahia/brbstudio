async function findById(id, executor = pool) {
  const [[row]] = await executor.query(`SELECT ${VOUCHER_FIELDS} FROM voucher WHERE voucher_id = ?`, [id]);
  return row || null;
}
 
async function create({ code, name, discountType, discountValue, startDate, endDate, usageLimit }) {
  const [result] = await pool.query(
    `INSERT INTO voucher
       (voucher_code, voucher_name, discount_type, discount_value, start_date, end_date, usage_limit)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, name, discountType, discountValue, startDate, endDate, usageLimit]
  );
  return result.insertId;
}

async function create({ code, name, discountType, discountValue, startDate, endDate, usageLimit }) {
  const [result] = await pool.query(
    `INSERT INTO voucher
       (voucher_code, voucher_name, discount_type, discount_value, start_date, end_date, usage_limit)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, name, discountType, discountValue, startDate, endDate, usageLimit]
  );
  return result.insertId;
}