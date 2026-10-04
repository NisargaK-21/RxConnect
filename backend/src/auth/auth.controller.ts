import type { Request, Response } from "express";

const authService = require("./auth.service");

const signup = async (req: Request, res: Response) => {
  try {
    const result = await authService.signup(req.body);

    return res.status(201).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Signup failed";

    return res.status(400).json({
      message,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    return res.status(401).json({
      message,
    });
  }
};

export {
  signup,
  login,
};