import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createSosAlert } from "../controllers/sosController.js";

const router = Router();

router.post("/alert", verifyToken, createSosAlert);

export default router;
