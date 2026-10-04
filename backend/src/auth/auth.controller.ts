import { Request, Response } from "express";
import * as authService from "./auth.service";

const signup = async (req: Request, res: Response) => {
  try {
    const result = await authService.signup(req.body);

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      message: error.message,
    });
  }
};

export {
  signup,
  login,
};