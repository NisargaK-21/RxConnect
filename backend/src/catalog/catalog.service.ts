import pool from "../database/db";
type SubstitutionParams = (number | null)[];
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
const getMedicineById = async (id:number, branchId:number|null) => {
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

const getMedicineSubstitutions = async (medicineId:number, branchId:number|null = null) => {
  try {
    const params:SubstitutionParams = [medicineId];
    let query = `
      SELECT
        m.id,
        m.name,
        m.description,
        m.price,
        m.requires_prescription
    `;

    if (branchId) {
      params.push(branchId);
      query += `,
        COALESCE(bs.quantity - bs.reserved_quantity, 0) AS available_quantity,
        COALESCE(bs.quantity, 0) AS branch_stock
      FROM medicine_substitutions ms
      JOIN medicines m ON ms.substitute_medicine_id = m.id
      LEFT JOIN branch_stock bs ON bs.medicine_id = m.id AND bs.branch_id = $2
      WHERE ms.medicine_id = $1;
      `;
    } else {
      query += `
      FROM medicine_substitutions ms
      JOIN medicines m ON ms.substitute_medicine_id = m.id
      WHERE ms.medicine_id = $1;
      `;
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err:any) {
    if (err.code === "42P01" || /relation "medicine_substitutions" does not exist/i.test(err.message)) {
      return [];
    }
    throw err;
  }
};

export default {
  getCatalog,
  getMedicineById,
  getMedicineSubstitutions,
};