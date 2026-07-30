const pool = require("../database/db");

const getCatalog = async (search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `
    SELECT
      id,
      name,
      description,
      price,
      requires_prescription
    FROM medicines
    WHERE LOWER(name) LIKE LOWER($1)
    ORDER BY id
    LIMIT $2
    OFFSET $3;
    `,
    [`%${search}%`, limit, offset]
  );

  return result.rows;
};
const getMedicineById = async (id, branchId) => {
  const result = await pool.query(
    `
    SELECT
      m.id,
      m.name,
      m.description,
      m.price,
      m.requires_prescription,
      COALESCE(bs.quantity, 0) AS branch_stock
    FROM medicines m
    LEFT JOIN branch_stock bs
      ON bs.medicine_id = m.id
      AND bs.branch_id = $2
    WHERE m.id = $1;
    `,
    [id, branchId]
  );

  return result.rows[0];
};

module.exports = {
  getCatalog,
  getMedicineById,
};