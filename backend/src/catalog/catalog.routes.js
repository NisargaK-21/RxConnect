const express = require("express");
const router = express.Router();

const {
  fetchCatalog,
  fetchMedicineById,
  fetchMedicineSubstitutions,
} = require("./catalog.controller");

router.get("/", fetchCatalog);
router.get("/medicines/:id/substitutions", fetchMedicineSubstitutions);
router.get("/:id/substitutions", fetchMedicineSubstitutions);
router.get("/:id", fetchMedicineById);

module.exports = router;