import "dotenv/config";
import express from "express";
import { config } from "./config/env.js";
import { corsMiddleware } from "./middleware/cors.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";

import healthRouter from "./routes/health.js";
import companionRouter from "./routes/companion.js";
import sosRouter from "./routes/sos.js";
import remindersRouter from "./routes/reminders.js";
import chatHistoryRouter from "./routes/chatHistory.js";
import profileRouter from "./routes/profile.js";
import vaultRouter from "./routes/vault.js";

const app = express();

app.use(corsMiddleware);
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));

app.use("/api/health", healthRouter);
app.use("/api/companion", companionRouter);
app.use("/api/sos", sosRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/companion/history", chatHistoryRouter);

// /api/chat is an alias kept for backward compatibility
app.use("/api/chat", companionRouter);

app.use("/api/profile", profileRouter);
app.use("/api/vault", vaultRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Sahara backend running on http://localhost:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
