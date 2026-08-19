const catalogService = require("./catalog.service");

const fetchCatalog = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const medicines = await catalogService.getCatalog(search, page, limit);

    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    console.error("Error fetching catalog:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const fetchMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;

    const medicine = await catalogService.getMedicineById(id, branchId || null);

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
  } catch (error) {
    console.error("Error fetching medicine:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchMedicineSubstitutions = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;

    const substitutions = await catalogService.getMedicineSubstitutions(id, branchId || null);

    return res.status(200).json({
      success: true,
      data: substitutions,
    });
  } catch (error) {
    console.error("Error fetching medicine substitutions:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  fetchCatalog,
  fetchMedicineById,
  fetchMedicineSubstitutions,
};