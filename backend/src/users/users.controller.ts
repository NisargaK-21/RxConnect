import {Request,Response} from "express";
import userService from "./users.service";

const createStaff = async (req:Request, res:Response) => {
  try {
    const user = await userService.createStaff(req.body);
    res.status(201).json(user);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

const getAllStaff = async (req:Request, res:Response) => {
  try {
    const users = await userService.getAllStaff();
    res.json(users);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const getStaffById = async (req:Request, res:Response) => {
  try {
    const user = await userService.getStaffById(Number(req.params.id));
    res.json(user);
  } catch (error:any) {
    res.status(404).json({ message: error.message });
  }
};

const updateStaff = async (req:Request, res:Response) => {
  try {
    const user = await userService.updateStaff(Number(req.params.id), req.body);
    res.json(user);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStaff = async (req:Request, res:Response) => {
  try {
    const response = await userService.deleteStaff(Number(req.params.id));
    res.json(response);
  } catch (error:any) {
    res.status(404).json({ message: error.message });
  }
};

const getProfile = async (req:Request, res:Response) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  } catch (error:any) {
    res.status(404).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req:Request, res:Response) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error:any) {
    res.status(400).json({
      message: error.message,
    });
  }
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