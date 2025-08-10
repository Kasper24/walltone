import os from "os";
import path from "path";
import pino from "pino";
import pinoPretty from "pino-pretty";

const logsDir = path.join(os.homedir(), ".cache", "walltone", "logs");
const logFilePath = path.join(logsDir, "app.log");

const isProduction = process.env.NODE_ENV === "production";

let logger: pino.Logger;

if (isProduction) {
  logger = pino(
    {
      level: "info",
    },
    pino.multistream([
      { stream: process.stdout },
      { stream: pino.destination({ dest: logFilePath, mkdir: true }) },
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
      level: "info",
    },
    pino.multistream([{ stream: prettyConsole }, { stream: prettyFile }])
  );
}

export default logger;
