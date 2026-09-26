import { Router } from "express";
import { chat } from "../controllers/companionController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

/**
 * POST /api/companion/chat  (also mounted at /api/chat for compatibility)
 *
 * Headers: Authorization: Bearer <supabase_jwt>
 * Body:    { message: string, history?: Array<{role, content}> }
 */
router.post("/chat", verifyToken, chat);

export default router;
