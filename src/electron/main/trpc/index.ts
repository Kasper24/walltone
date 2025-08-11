import { EventEmitter } from "events";
import { initTRPC } from "@trpc/server";
import { logger } from "@electron/main/lib/logger.js";

const t = initTRPC.create({ isServer: true });

function sanitizeInput(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;

  // Recursively clone and remove sensitive keys
  const SENSITIVE_KEYS = ["username", "password", "guard", "token", "secret", "apiKey"];

  const clone: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (SENSITIVE_KEYS.includes(key)) {
      clone[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clone[key] = sanitizeInput(value);
    } else {
      clone[key] = value;
    }
  });

  return clone;
}

const loggingMiddleware = t.middleware(async ({ path, type, next, getRawInput }) => {
  const rawInput = await getRawInput();
  const safeInput = sanitizeInput(rawInput);
  const start = Date.now();

  logger.debug({ path, type, input: safeInput }, "tRPC call started");

  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    logger.debug(
      { path, type, durationMs, input: safeInput, result: result.data },
      "tRPC call succeeded"
    );
  } else {
    logger.error(
      { path, type, durationMs, input: safeInput, error: result.error },
      "tRPC call failed"
    );
  }
  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);
export const createCallerFactory = t.createCallerFactory;
export const eventsEmitter = new EventEmitter();
