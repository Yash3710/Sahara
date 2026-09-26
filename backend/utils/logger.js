const levels = { info: "✅", warn: "⚠️ ", error: "❌" };

function log(level, message, meta = "") {
  const timestamp = new Date().toISOString();
  const prefix = levels[level] || "  ";
  console[level === "error" ? "error" : "log"](
    `${prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`,
    meta || "",
  );
}

export const logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
};
