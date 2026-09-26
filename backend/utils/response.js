/**
 * Standardised JSON response helpers.
 *
 * Usage:
 *   sendSuccess(res, { user })
 *   sendSuccess(res, data, 'Created', 201)
 *   sendError(res, 'Not found', 404)
 */
export function sendSuccess(
  res,
  data = null,
  message = "OK",
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res,
  message = "Something went wrong",
  statusCode = 500,
) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}
