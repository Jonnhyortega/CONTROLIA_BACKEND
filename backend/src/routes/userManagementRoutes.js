import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

import {
  createEmployee,
  getEmployees,
  updateEmployee,
  disableEmployee,
  changeEmployeePassword,
  deleteEmployee,
  enableEmployee
} from "../controllers/userManagementController.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.post("/employees", createEmployee);
router.get("/employees", getEmployees);
router.put("/employees/:id", updateEmployee);
router.patch("/employees/:id/disable", disableEmployee);
router.patch("/employees/:id/enable", enableEmployee);
router.patch("/employees/:id/password", changeEmployeePassword);
router.delete("/employees/:id", deleteEmployee);

export default router;
