import pino from "pino";
import pinoPretty from "pino-pretty";
import { logFilePath } from "@electron/main/lib/paths.js";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino(
  {
    level: isProduction ? "info" : "debug",
  },
  pino.multistream([
    {
      stream: isProduction
        ? process.stdout
        : pinoPretty({
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          }),
      level: isProduction ? "info" : "debug",
    },
    {
      stream: pino.destination({ dest: logFilePath, mkdir: true }),
      level: isProduction ? "info" : "debug",
    },
  ])
);

export { logger };
