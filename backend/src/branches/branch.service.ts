import pool from "../database/db";

interface BranchData {
  name: string;
  address: string;
}

const createBranch = async (data: BranchData) => {
  const { name, address } = data;

  const result = await pool.query(
    `INSERT INTO branches (name, address)
     VALUES ($1, $2)
     RETURNING *`,
    [name, address]
  );

  return result.rows[0];
};

const getAllBranches = async () => {
  const result = await pool.query(
    `SELECT * FROM branches ORDER BY id ASC`
  );

  return result.rows;
};

const getBranchById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM branches WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Branch not found");
  }

  return result.rows[0];
};

const updateBranch = async (
  id: string,
  data: BranchData
) => {
  const { name, address } = data;

  const result = await pool.query(
    `UPDATE branches
     SET name = $1,
         address = $2
     WHERE id = $3
     RETURNING *`,
    [name, address, id]
  );

  if (result.rows.length === 0) {
    throw new Error("Branch not found");
  }

  return result.rows[0];
};

const deleteBranch = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM branches
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Branch not found");
  }

  return {
    message: "Branch deleted successfully",
  };
};

export {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};