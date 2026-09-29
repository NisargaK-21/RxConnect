import { Request, Response } from "express";
import catalogService from "./catalog.service";
const fetchCatalog = async (req:Request, res:Response) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const medicines = await catalogService.getCatalog(search as string, page, limit);

    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error:any) {
    console.error("Error fetching catalog:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const fetchMedicineById = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;

    const medicine = await catalogService.getMedicineById(
      Number(id), branchId? Number(branchId):null);

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
  } catch (error:any) {
    console.error("Error fetching medicine:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchMedicineSubstitutions = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;

    const substitutions = await catalogService.getMedicineSubstitutions(Number(id), branchId? Number(branchId):null);

    return res.status(200).json({
      success: true,
      data: substitutions,
    });
  } catch (error:any) {
    console.error("Error fetching medicine substitutions:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default {
  fetchCatalog,
  fetchMedicineById,
  fetchMedicineSubstitutions,
};