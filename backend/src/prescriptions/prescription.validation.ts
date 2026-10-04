import { Request, Response, NextFunction } from "express";

const validatePrescriptionUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { orderItemId } = req.body;

  if (!orderItemId) {
    res.status(400).json({
      message: "orderItemId is required",
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      message: "Prescription file is required",
    });
    return;
  }

  next();
};

export { validatePrescriptionUpload };