import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { SYSTEM_PROMPT } from "../config/systemPrompt.js";

const { baseUrl, model, timeoutMs } = config.ollama;

/**
 * generateResponse(message, history = [])
 *
 * Sends a user message plus the last N conversation turns to Ollama.
 *
 * history: Array<{ role: 'user'|'assistant', content: string }>
 *          - already ordered oldest -> newest, max 15 items enforced here.
 *
 * Errors thrown:
 *   - OLLAMA_CONNECTION_ERROR  - Ollama is not reachable
 *   - OLLAMA_TIMEOUT           - request exceeded timeoutMs
 *   - OLLAMA_HTTP_ERROR        - Ollama returned 4xx/5xx
 *   - OLLAMA_RESPONSE_ERROR    - empty / malformed reply
 *   - OLLAMA_INVALID_JSON      - non-JSON response body
 */
export async function generateResponse(message, history = [], context = null) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("message must be a non-empty string");
  }

  // Hard cap - never send more than 15 prior turns to Ollama
  const trimmedHistory = Array.isArray(history)
    ? history
        .slice(-15)
        .filter(
          (m) =>
            m &&
            typeof m.content === "string" &&
            m.content.trim() &&
            (m.role === "user" || m.role === "assistant"),
        )
    : [];

  // Inject real DB context as a second system message when available
  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(context
      ? [
          {
            role: "system",
            content: `Here is the user's real data from the database:\n\n${context}`,
          },
        ]
      : []),
  ];

  const url = `${baseUrl}/api/chat`;

  const body = JSON.stringify({
    model,
    stream: false,
    messages: [
      ...systemMessages,
      ...trimmedHistory,
      { role: "user", content: message.trim() },
    ],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);

    if (err.name === "AbortError") {
      logger.error(`Ollama timeout after ${timeoutMs}ms`);
      const e = new Error(
        `Ollama did not respond within ${timeoutMs / 1000} seconds. Make sure Ollama is running.`,
      );
      e.code = "OLLAMA_TIMEOUT";
      throw e;
    }

    if (err.code === "ECONNREFUSED" || err.message.includes("fetch failed") || err.message.includes("Failed to fetch")) {
      logger.error("LLM connection error:", err.message);
      const e = new Error("AI companion service is not available right now. Please try again later.");
      e.code = "LLM_UNAVAILABLE";
      throw e;
    }

    // fetch failed entirely - Ollama not running
    logger.error("Ollama connection error", err.message);
    const e = new Error(
      "Cannot reach Ollama at " +
        baseUrl +
        ". Make sure Ollama is running: ollama serve",
    );
    e.code = "OLLAMA_CONNECTION_ERROR";
    throw e;
  }

  clearTimeout(timer);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error(`Ollama HTTP ${response.status}`, text);
    const e = new Error(
      `Ollama returned HTTP ${response.status}: ${text || "no details"}`,
    );
    e.code = "OLLAMA_HTTP_ERROR";
    e.status = response.status;
    throw e;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const e = new Error("Ollama returned an invalid JSON response.");
    e.code = "OLLAMA_INVALID_JSON";
    throw e;
  }

  // Validate response shape
  const reply = data?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    logger.error("Unexpected Ollama response shape", JSON.stringify(data));
    const e = new Error(
      "Ollama response was empty or in an unexpected format.",
    );
    e.code = "OLLAMA_RESPONSE_ERROR";
    throw e;
  }

  logger.info(`Ollama [${model}] responded (${reply.length} chars)`);
  return reply.trim();
}
