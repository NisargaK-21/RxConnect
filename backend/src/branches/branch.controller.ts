import { Request, Response } from "express";
import * as branchService from "./branch.service";

const createBranch = async (req: Request, res: Response) => {
  try {
    const result = await branchService.createBranch(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

const getAllBranches = async (req: Request, res: Response) => {
  try {
    const result = await branchService.getAllBranches();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const getBranchById = async (req: Request, res: Response) => {
  try {
    const result = await branchService.getBranchById(req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

const updateBranch = async (req: Request, res: Response) => {
  try {
    const result = await branchService.updateBranch(
      req.params.id as string,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBranch = async (req: Request, res: Response) => {
  try {
    const result = await branchService.deleteBranch(req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};