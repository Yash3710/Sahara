import { saveSosAlert } from "../services/supabaseService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export async function createSosAlert(req, res) {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.userId;

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    const savedRecord = await saveSosAlert(userId, latitude || null, longitude || null);

    return sendSuccess(res, "Help alert has been recorded", { alert: savedRecord[0] || savedRecord });
  } catch (error) {
    logger.error("[createSosAlert] Error:", error.message);
    return sendError(res, "Failed to save SOS alert", 500);
  }
}
