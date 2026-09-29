import { Request, Response } from "express";

const branchService = require("./branch.service");

const createBranch = async (req:Request, res:Response) => {
  try {
    const result = await branchService.createBranch(req.body);
    res.status(201).json(result);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

const getAllBranches = async (req:Request, res:Response) => {
  try {
    const result = await branchService.getAllBranches();
    res.json(result);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

const getBranchById = async (req:Request, res:Response) => {
  try {
    const result = await branchService.getBranchById(Number(req.params.id));
    res.json(result);
  } catch (error:any) {
    res.status(404).json({ message: error.message });
  }
};

const updateBranch = async (req:Request, res:Response) => {
  try {
    const result = await branchService.updateBranch(Number(req.params.id), req.body);
    res.json(result);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBranch = async (req:Request, res:Response) => {
  try {
    const result = await branchService.deleteBranch(Number(req.params.id));
    res.json(result);
  } catch (error:any) {
    res.status(400).json({ message: error.message });
  }
};

export default{
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};