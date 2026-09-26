import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getChatHistory } from "../services/supabaseService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }
    const history = await getChatHistory(userId);
    // Reverse because we fetch desc but want ascending for UI
    return sendSuccess(res, "Chat history retrieved", history.reverse());
  } catch (error) {
    logger.error("[getChatHistory] Error:", error.message);
    return sendError(res, "Failed to retrieve chat history", 500);
  }
});

export default router;
