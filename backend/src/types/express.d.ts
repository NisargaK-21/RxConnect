import { Request } from "express";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number | string;
        name?: string;
        email?: string;
        role: string;
        branch_id: number | string | null;
      };
    }
  }
}