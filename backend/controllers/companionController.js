import { generateResponse } from "../services/ollamaService.js";
import { buildContext } from "../services/contextService.js";
import { saveChatMessage } from "../services/supabaseService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * POST /api/companion/chat
 *
 * Body:    { message: string, history?: Array<{role, content}> }
 * Headers: Authorization: Bearer <supabase_jwt>
 *
 * req.userId is set by the verifyToken middleware - never trusted from body.
 */
export async function chat(req, res) {
  const { message, history } = req.body;
  const userId = req.userId; // ← from verified JWT, not request body


  if (!message || typeof message !== "string" || !message.trim()) {
    return sendError(
      res,
      "message is required and must be a non-empty string.",
      400,
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return sendError(
      res,
      `message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
      400,
    );
  }

  const conversationHistory = Array.isArray(history) ? history : [];


  let context = null;
  if (userId) {
    try {
      context = await buildContext(message, userId);
      if (context)
        logger.info(
          `[chat] DB context injected for user ${userId.slice(0, 8)}…`,
        );
    } catch (err) {
      logger.warn("[chat] buildContext failed (non-fatal):", err.message);
    }
  }


  try {
    const reply = await generateResponse(message, conversationHistory, context);
    
    // Save to DB
    if (userId) {
      try {
        await saveChatMessage(userId, 'user', message);
        await saveChatMessage(userId, 'assistant', reply);
      } catch (dbErr) {
        logger.warn("[chat] Failed to save chat message (non-fatal):", dbErr.message);
      }
    }

    return sendSuccess(res, { reply });
  } catch (err) {
    logger.error("[chat] generateResponse error:", err.message);

    const statusMap = {
      OLLAMA_CONNECTION_ERROR: 503,
      OLLAMA_TIMEOUT: 504,
      OLLAMA_HTTP_ERROR: err.status || 502,
      OLLAMA_RESPONSE_ERROR: 502,
      OLLAMA_INVALID_JSON: 502,
    };
    return sendError(res, err.message, statusMap[err.code] || 500);
  }
}
