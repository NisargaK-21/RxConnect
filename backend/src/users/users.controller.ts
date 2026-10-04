import { Request, Response } from "express";
import * as userService from "./users.service";

const createStaff = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await userService.createStaff(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getAllStaff = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await userService.getAllStaff();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getStaffById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;
    const user = await userService.getStaffById(id);

    res.json(user);
  } catch (error: any) {
    res.status(404).json({
      message: error.message,
    });
  }
};

const updateStaff = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;
    const user = await userService.updateStaff(
      id,
      req.body
    );

    res.json(user);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const deleteStaff = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;
    const response = await userService.deleteStaff(id);

    res.json(response);
  } catch (error: any) {
    res.status(404).json({
      message: error.message,
    });
  }
};

const getProfile = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await userService.getProfile(
      req.user.id
    );

    res.json(user);
  } catch (error: any) {
    res.status(404).json({
      message: error.message,
    });
  }
};

const updateProfile = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await userService.updateProfile(
      req.user.id,
      req.body
    );

    res.json(user);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile,
};