import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
const authenticate = (req:Request, res:Response, next:NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access token is missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    req.user = decoded as {
      id:number;
      role:string;
      branch_id?:number|null;
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default authenticate;