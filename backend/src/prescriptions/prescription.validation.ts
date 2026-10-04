import type {
  Request,
  Response,
  NextFunction,
} from "express";

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

const validatePrescriptionUpload = (
  req: FileRequest,
  res: Response,
  next: NextFunction
) => {
  const {
    orderItemId,
  } = req.body;

  if (!orderItemId) {
    return res.status(400).json({
      message:
        "orderItemId is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message:
        "Prescription file is required",
    });
  }

  next();
};

module.exports = {
  validatePrescriptionUpload,
};