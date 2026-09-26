import { config } from "../config/env.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

/**
 * verifyToken - Express middleware
 *
 * Verifies the Supabase JWT (HS256) sent in the Authorization header
 * using the SUPABASE_JWT_SECRET (shared secret - no network call needed).
 *
 * Sets req.userId from the verified `sub` claim.
 * Never trusts userId from the request body.
 *
 * Required env var:
 *   SUPABASE_JWT_SECRET - found in Supabase Dashboard ->
 *                         Project Settings -> API -> JWT Settings -> JWT Secret
 */

const JWT_SECRET = config.supabase.jwtSecret;

/**
 * Base64url decode -> Uint8Array
 */
function b64urlToBytes(str) {
  // Pad to 4-char boundary and replace URL-safe chars
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const b64 = padded + "=".repeat(pad);
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/**
 * Decode JWT payload without verifying (used after signature check).
 */
function decodePayload(payloadB64) {
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
}

/**
 * Verify a Supabase HS256 JWT using Web Crypto (built into Node 18+).
 * Returns the decoded payload on success, throws on failure.
 */
async function verifyHS256(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");

  const [headerB64, payloadB64, sigB64] = parts;

  // Import the shared secret as an HMAC key
  const keyBytes = new TextEncoder().encode(JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // The signed data is "header.payload"
  const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sigBytes = b64urlToBytes(sigB64);

  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
  if (!valid) throw new Error("JWT signature invalid");

  const payload = decodePayload(payloadB64);

  // Check token expiry
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT has expired");
  }

  return payload;
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return sendError(res, "Missing or malformed Authorization header.", 401);
  }

  const token = authHeader.slice(7);

  // Always decode the payload to get userId - in dev this is sufficient
  // since the user is already authenticated via Supabase on the frontend.
  // In production, set SUPABASE_JWT_SECRET to enable full signature verification.
  const secretIsSet =
    JWT_SECRET &&
    JWT_SECRET !== "your_jwt_secret_here" &&
    JWT_SECRET.length > 10;

  if (!secretIsSet) {
    if (config.nodeEnv === "production") {
      logger.error("[verifyToken] CRITICAL: SUPABASE_JWT_SECRET is missing or invalid in production.");
      return sendError(res, "Internal Server Error: Authentication configuration is missing.", 500);
    }
    // Dev mode - decode without verifying signature
    try {
      const [, payloadB64] = token.split(".");
      const payload = decodePayload(payloadB64);
      req.userId = payload.sub ?? null;
      return next();
    } catch (err) {
      logger.warn("[verifyToken] Token decode failed:", err.message);
      // Even if decode fails, still let the request through in dev
      req.userId = null;
      return next();
    }
  }

  // Production - full HS256 verification
  try {
    const payload = await verifyHS256(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    logger.warn("[verifyToken] Verification failed:", err.message);
    return sendError(res, "Invalid or expired token.", 401);
  }
}
