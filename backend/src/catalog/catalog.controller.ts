import type { Request, Response } from "express";

const catalogService = require("./catalog.service");

const fetchCatalog = async (
  req: Request,
  res: Response
) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : "";

    const page =
      typeof req.query.page === "string"
        ? parseInt(req.query.page, 10) || 1
        : 1;

    const limit =
      typeof req.query.limit === "string"
        ? parseInt(req.query.limit, 10) || 10
        : 10;

    const medicines = await catalogService.getCatalog(
      search,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error: unknown) {
    console.error("Error fetching catalog:", error);

    return res.status(500).json({
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
    const { id } = req.params;

    const branchId =
      typeof req.query.branchId === "string"
        ? req.query.branchId
        : null;

    const medicine =
      await catalogService.getMedicineById(
        id,
        branchId
      );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error: unknown) {
    console.error("Error fetching medicine:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchMedicineSubstitutions = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const branchId =
      typeof req.query.branchId === "string"
        ? req.query.branchId
        : null;

    const substitutions =
      await catalogService.getMedicineSubstitutions(
        id,
        branchId
      );

    return res.status(200).json({
      success: true,
      data: substitutions,
    });
  } catch (error: unknown) {
    console.error(
      "Error fetching medicine substitutions:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export {
  fetchCatalog,
  fetchMedicineById,
  fetchMedicineSubstitutions,
};