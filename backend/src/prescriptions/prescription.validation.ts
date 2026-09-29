import { Request, Response, NextFunction } from "express";
const validatePrescriptionUpload = (req:Request, res:Response, next:NextFunction) => {
  const { orderItemId } = req.body;

  if (!orderItemId) {
    return res.status(400).json({
      message: "orderItemId is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Prescription file is required",
    });
  }

  next();
};

export {
  validatePrescriptionUpload,
};