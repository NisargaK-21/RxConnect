import pool from "../database/db";
import bcrypt from "bcrypt";

type StaffData = {
  name: string;
  email: string;
  password: string;
  role: string;
  branch_id?: number | null;
};

type UpdateStaffData = {
  name: string;
  email: string;
  role: string;
  branch_id?: number | null;
};

type ProfileData = {
  name: string;
  phone: string;
  address: string;
};

type UserType = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  branch_id?: number | null;
  created_at: Date;
};

const createStaff = async (data:StaffData) => {
  const { name, email, password, role, branch_id } = data;

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users
    (name, email, password_hash, role, branch_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, branch_id, created_at`,
    [name, email, hashedPassword, role, branch_id]
  );

  return result.rows[0];
};

const getAllStaff = async () => {
  const result = await pool.query(
    `SELECT id, name, email, role, branch_id, created_at
     FROM users
     WHERE role != 'customer'
     ORDER BY id`
  );

  return result.rows;
};

const getStaffById = async (id:number) => {
  const result = await pool.query(
    `SELECT id, name, email, role, branch_id, created_at
     FROM users
     WHERE id = $1
       AND role != 'customer'`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Staff not found");
  }

  return result.rows[0];
};

const updateStaff = async (id:number, data:UpdateStaffData) => {
  const { name, email, role, branch_id } = data;

  const result = await pool.query(
    `UPDATE users
     SET name = $1,
         email = $2,
         role = $3,
         branch_id = $4
     WHERE id = $5
       AND role != 'customer'
     RETURNING id, name, email, role, branch_id, created_at`,
    [name, email, role, branch_id, id]
  );

  if (result.rows.length === 0) {
    throw new Error("Staff not found");
  }

  return result.rows[0];
};

const deleteStaff = async (id:number) => {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
       AND role != 'customer'
     RETURNING id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Staff not found");
  }

  return {
    message: "Staff deleted successfully",
  };
};

const getProfile = async (id:number) => {
  const result = await pool.query(
    `SELECT
        id,
        name,
        email,
        role,
        phone,
        address,
        branch_id,
        created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  return result.rows[0];
};

const updateProfile = async (id:number, data:ProfileData) => {
  const { name, phone, address } = data;

  if (!phone || phone.trim() === "") {
    throw new Error("Phone is required");
  }

  if (!address || address.trim() === "") {
    throw new Error("Address is required");
  }

  const result = await pool.query(
    `UPDATE users
     SET
       name = $1,
       phone = $2,
       address = $3
     WHERE id = $4
     RETURNING
       id,
       name,
       email,
       role,
       phone,
       address,
       branch_id,
       created_at`,
    [name, phone.trim(), address.trim(), id]
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  return result.rows[0];
};

export default {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile,
};