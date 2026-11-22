const { pool } = require('../config/db');
const { findMissingColumnProblems } = require('../config/schemaCheck');

const REQUIRED_COLUMNS = [
  'service_id',
  'service_name',
  'description',
  'price',
  'image_path',
  'availability',
];

const SERVICE_FIELDS = `service_id AS id,
                        service_name AS name,
                        description,
                        price,
                        image_path AS imagePath,
                        availability AS available`;

async function findAll() {
  const [rows] = await pool.query(`SELECT ${SERVICE_FIELDS} FROM service ORDER BY service_id ASC`);
  return rows;
}

async function create({ name, description, price, imagePath, available }) {
  const [result] = await pool.query(
    `INSERT INTO service (service_name, description, price, image_path, availability)
     VALUES (?, ?, ?, ?, ?)`,
    [name, description, price, imagePath, available ? 1 : 0]
  );
  return result.insertId;
}

async function verifySchema() {
  const { problems } = await findMissingColumnProblems('service', REQUIRED_COLUMNS);

  if (problems.length > 0) problems.push('Run database/service_table.sql in phpMyAdmin to fix this.');
  return problems;
}

module.exports = {
  findAll,
  verifySchema,
  create,
};