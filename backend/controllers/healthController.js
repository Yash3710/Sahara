/**
 * GET /api/health
 * Returns server health status.
 */
export function getHealth(req, res) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
}
