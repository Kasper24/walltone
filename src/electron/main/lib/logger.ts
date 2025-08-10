import path from "path";
import envPaths from "env-paths";
import pino from "pino";
import pinoPretty from "pino-pretty";

const paths = envPaths("walltone");
const logsDir = path.join(paths.log);
const logFilePath = path.join(logsDir, "app.log");

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

export default logger;
