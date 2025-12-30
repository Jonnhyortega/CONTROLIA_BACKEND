import express from "express";
import {
  createClient,
  getClients,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

const router = express.Router();

router.route("/")
  .get(protect, checkSubscription, getClients)
  .post(protect, checkSubscription, createClient);

router.route("/:id")
  .put(protect, checkSubscription, updateClient)
  .delete(protect, checkSubscription, deleteClient);

export default router;
