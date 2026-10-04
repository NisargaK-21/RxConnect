import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthUser {
  id: number;
  role: string;
  branch_id: number | null;
}

interface JwtPayload {
  id: number;
  role: string;
  branch_id: number | null;
}

const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Access token is missing",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: "Access token is missing",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      branch_id: decoded.branch_id,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default authenticate;