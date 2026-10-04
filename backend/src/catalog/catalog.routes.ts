import express, { Router } from "express";
import {
  fetchCatalog,
  fetchMedicineById,
} from "./catalog.controller";

const router: Router = express.Router();

router.get("/", fetchCatalog);
router.get("/:id", fetchMedicineById);

export default router;