import pino from "pino";
import pinoPretty from "pino-pretty";
import { logFilePath } from "@electron/main/lib/paths.js";

const isProduction = process.env.NODE_ENV === "production";

let logger: pino.Logger;

if (isProduction) {
  logger = pino(
    {
      level: "info",
    },
    pino.multistream([
      { stream: process.stdout, level: "info" },
      { stream: pino.destination({ dest: logFilePath, mkdir: true }), level: "info" },
    ])
  );
} else {
  const prettyConsole = pinoPretty({
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
  });

  const prettyFile = pinoPretty({
    colorize: false, // no colors in file
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
    destination: logFilePath,
    mkdir: true,
  });

  logger = pino(
    {
      level: "debug",
    },
    pino.multistream([
      { stream: prettyConsole, level: "debug" },
      { stream: prettyFile, level: "debug" },
    ])
  );
}

export { logger };
