import { spawn } from "child_process";
import { TRPCError } from "@trpc/server";
import { logger } from "@electron/main/lib/logger.js";

type ExecuteParams = {
  command: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  shell?: boolean;
  detached?: boolean;
  logStdout?: boolean;
  logStderr?: boolean;
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
};

const execute = (params: ExecuteParams) => {
  const {
    command,
    args = [],
    env = {},
    shell = false,
    detached = false,
    logStdout = true,
    logStderr = true,
    onStdout,
    onStderr,
  } = params;

  return new Promise((resolve, reject) => {
    logger.info({ params }, "Executing command");

    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...env,
      },
      detached: detached,
      shell,
    });

    child.stdout.on("data", (data) => {
      const text = data.toString();
      if (onStdout) onStdout(text);

      if (logStdout)
        logger.debug(
          {
            pid: child.pid,
            text: text.trim(),
          },
          "Process STDOUT"
        );
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      if (onStderr) onStderr(text);

      if (logStderr)
        logger.warn(
          {
            pid: child.pid,
            text: text.trim(),
          },
          "Process STDERR"
        );
    });

    child.on("close", (code, signal) => {
      if (code === 0) {
        logger.info(
          {
            pid: child.pid,
            code,
            signal,
          },
          "Process completed successfully"
        );

        resolve({});
      } else {
        logger.error(
          {
            pid: child.pid,
            code,
            signal,
          },
          "Process failed"
        );

        const error = new Error(`Process exited with code ${code}`);
        reject(error);
      }
    });

    child.on("error", (error) => {
      logger.error({ pid: child.pid, error }, "Process error");

      reject(error);
    });
  });
};

const killProcess = async (processName: string) => {
  logger.info({ processName }, "killProcess() called");

  try {
    const result = await execute({ command: "pkill", args: ["-f", processName] });

    logger.info(
      { processName, result },
      `Successfully killed all running '${processName}' processes.`
    );
  } catch (error) {
    logger.warn(
      {
        processName,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      `No '${processName}' processes found or failed to kill.`
    );
  }
};

const santize = (str: string) => {
  return str.replace(/[^a-z0-9-]/gi, "").toLowerCase();
};

const renderString = async (content: string, context: Record<string, unknown>) => {
  // Replace $${} with a temporary marker
  const tempMarker = "__RENDERSTRING_ESCAPED_DOLLAR_BRACE__";
  let processedContent = content.replace(/\$\$\{/g, tempMarker);

  // Process normal template expressions
  processedContent = processedContent.replace(/\$\{([\s\S]+?)\}/g, (_, expr) => {
    try {
      const fn = new Function(...Object.keys(context), `return (${expr})`);
      return fn(...Object.values(context));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to evaluate: ${expr}: ${errorMessage}`,
        cause: error,
      });
    }
  });

  // Restore escaped sequences
  return processedContent.replace(new RegExp(tempMarker, "g"), "${");
};

export { execute, killProcess, santize, renderString };
