import { Request, Response } from "express";
import {
  getCatalog,
  getMedicineById,
} from "./catalog.service";

const fetchCatalog = async (req: Request, res: Response) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : "";

    const page =
      typeof req.query.page === "string"
        ? parseInt(req.query.page, 10)
        : 1;

    const limit =
      typeof req.query.limit === "string"
        ? parseInt(req.query.limit, 10)
        : 10;

    const medicines = await getCatalog(search, page, limit);

    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error: any) {
    console.error("Error fetching catalog:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchMedicineById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;
    const branchId =
      typeof req.query.branchId === "string"
        ? req.query.branchId
        : null;

    const medicine = await getMedicineById(
      id,
      branchId
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error: any) {
    console.error("Error fetching medicine:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export {
  fetchCatalog,
  fetchMedicineById,
};