import type { Request, Response } from "express";

const branchService = require("./branch.service");

const createBranch = async (req: Request, res: Response) => {
  try {
    const result = await branchService.createBranch(req.body);

    return res.status(201).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create branch";

    return res.status(400).json({ message });
  }
};

const getAllBranches = async (req: Request, res: Response) => {
  try {
    const result = await branchService.getAllBranches();

    return res.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch branches";

    return res.status(500).json({ message });
  }
};

const getBranchById = async (req: Request, res: Response) => {
  try {
    const result = await branchService.getBranchById(req.params.id);

    return res.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Branch not found";

    return res.status(404).json({ message });
  }
};

const updateBranch = async (req: Request, res: Response) => {
  try {
    const result = await branchService.updateBranch(
      req.params.id,
      req.body
    );

    return res.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update branch";

    return res.status(400).json({ message });
  }
};

const deleteBranch = async (req: Request, res: Response) => {
  try {
    const result = await branchService.deleteBranch(req.params.id);

    return res.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete branch";

    return res.status(400).json({ message });
  }
};

export {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};