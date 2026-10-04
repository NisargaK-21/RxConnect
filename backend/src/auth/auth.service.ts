import pool from "../database/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface UserData {
  name?: string;
  email: string;
  password: string;
  role?: string;
  branch_id?: number | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  branch_id?: number | null;
}

const signup = async (userData: UserData) => {
  const { name, email, password, role, branch_id } = userData;

  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users
    (name, email, password_hash, role, branch_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, branch_id`,
    [name, email, hashedPassword, role, branch_id || null]
  );

  const user: User = result.rows[0];

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      branch_id: user.branch_id,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d",
    }
  );

  return {
    message: "User registered successfully",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id,
    },
  };
};

const login = async (userData: UserData) => {
  const { email, password } = userData;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      branch_id: user.branch_id,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d",
    }
  );

  return {
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export {
  signup,
  login,
};