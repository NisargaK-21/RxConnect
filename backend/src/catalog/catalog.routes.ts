import express, { Router } from "express";

import {
  fetchCatalog,
  fetchMedicineById,
  fetchMedicineSubstitutions,
} from "./catalog.controller";

const router: Router = express.Router();

router.get("/", fetchCatalog);

router.get(
  "/medicines/:id/substitutions",
  fetchMedicineSubstitutions
);

router.get(
  "/:id/substitutions",
  fetchMedicineSubstitutions
);

router.get("/:id", fetchMedicineById);

export default router;