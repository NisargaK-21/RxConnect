const { getCatalog } = require("./catalog.service");

const fetchCatalog = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const medicines = await getCatalog(search, page, limit);

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

module.exports = {
  fetchCatalog,
};