const express = require("express");
const router = express.Router();

const {
  fetchCatalog,
  fetchMedicineById,
} = require("./catalog.controller");

router.get("/", fetchCatalog);
router.get("/:id", fetchMedicineById);

module.exports = router;