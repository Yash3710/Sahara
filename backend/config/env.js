import "dotenv/config";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim());

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || supabaseUrl.includes("your-project")) {
  console.warn("WARNING: SUPABASE_URL is missing or using a placeholder.");
}

if (!supabaseServiceRoleKey || supabaseServiceRoleKey.includes("your-service-role-key")) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing or using a placeholder.");
}

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  allowedOrigins,
  llmProvider: process.env.LLM_PROVIDER || "ollama",
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 60000,
  },
  supabase: {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
    jwtSecret: process.env.SUPABASE_JWT_SECRET || "",
  },
};
