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

module.exports = {
  getCatalog,
};