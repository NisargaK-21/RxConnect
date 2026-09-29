import express from "express";
import catalogController from "./catalog.controller";
const router = express.Router();

router.get("/", catalogController.fetchCatalog);
router.get("/medicines/:id/substitutions", catalogController.fetchMedicineSubstitutions);
router.get("/:id/substitutions", catalogController.fetchMedicineSubstitutions);
router.get("/:id", catalogController.fetchMedicineById);

export default router;