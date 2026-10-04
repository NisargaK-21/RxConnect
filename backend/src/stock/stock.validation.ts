import { Request, Response, NextFunction } from "express";

const validateThresholdUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { branchId, medicineId, lowStockThreshold } = req.body;

  if (
    !branchId ||
    !medicineId ||
    lowStockThreshold === undefined
  ) {
    res.status(400).json({
      message:
        "branchId, medicineId and lowStockThreshold are required",
    });
    return;
  }

  if (
    !Number.isInteger(lowStockThreshold) ||
    lowStockThreshold < 0
  ) {
    res.status(400).json({
      message:
        "lowStockThreshold must be a non-negative integer",
    });
    return;
  }

  next();
};

export { validateThresholdUpdate };