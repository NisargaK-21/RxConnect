import pool from "../database/db";

const getCatalog = async (
  search: string = "",
  page: number = 1,
  limit: number = 10
) => {
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

const getMedicineById = async (
  id: string,
  branchId: string | null
) => {
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

const getMedicineSubstitutions = async (
  medicineId: string,
  branchId: string | null = null
) => {
  try {
    const params: (string | null)[] = [medicineId];

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
        COALESCE(
          bs.quantity - bs.reserved_quantity,
          0
        ) AS available_quantity,
        COALESCE(
          bs.quantity,
          0
        ) AS branch_stock
      FROM medicine_substitutions ms
      JOIN medicines m
        ON ms.substitute_medicine_id = m.id
      LEFT JOIN branch_stock bs
        ON bs.medicine_id = m.id
        AND bs.branch_id = $2
      WHERE ms.medicine_id = $1;
      `;
    } else {
      query += `
      FROM medicine_substitutions ms
      JOIN medicines m
        ON ms.substitute_medicine_id = m.id
      WHERE ms.medicine_id = $1;
      `;
    }

    const result = await pool.query(
      query,
      params
    );

    return result.rows;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      "message" in err
    ) {
      const error = err as {
        code?: string;
        message?: string;
      };

      if (
        error.code === "42P01" ||
        /relation "medicine_substitutions" does not exist/i.test(
          error.message || ""
        )
      ) {
        return [];
      }
    }

    throw err;
  }
};

export {
  getCatalog,
  getMedicineById,
  getMedicineSubstitutions,
};