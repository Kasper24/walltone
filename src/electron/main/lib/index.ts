import { spawn } from "child_process";
import { TRPCError } from "@trpc/server";
import logger from "@electron/main/lib/logger.js";

const execute = (params: {
  command: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  shell?: boolean;
  detached?: boolean;
  ignoreErrors?: boolean;
  logStdout?: boolean;
  logStderr?: boolean;
}): Promise<{ stdout: string; stderr: string }> => {
  const {
    command,
    args = [],
    env = {},
    shell = false,
    detached = false,
    ignoreErrors = false,
    logStdout = true,
    logStderr = true,
  } = params;

  return new Promise((resolve, reject) => {
    logger.info(
      { command, args, env, shell, detached, ignoreErrors, logStdout, logStderr },
      `Executing command: ${command} ${args.join(" ")}`
    );

    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...env,
      },
      detached: detached,
      shell,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      if (logStdout)
        logger.debug(
          {
            func: "execute",
            command,
            args,
            env,
            shell,
            detached,
            pid: child.pid,
            text: text.trim(),
          },
          "Process STDOUT"
        );
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      if (logStderr)
        logger.warn(
          {
            func: "execute",
            command,
            args,
            env,
            shell,
            detached,
            pid: child.pid,
            text: text.trim(),
          },
          "Process STDERR"
        );
    });

    child.on("close", (code, signal) => {
      logger.info(
        {
          func: "execute",
          command,
          args,
          env,
          shell,
          detached,
          pid: child.pid,
          code,
          signal,
          stdout,
          stderr,
        },
        "Process closed"
      );
      if (ignoreErrors && code !== 0) {
        logger.warn(
          {
            func: "execute",
            command,
            args,
            env,
            shell,
            detached,
            pid: child.pid,
            code,
            signal,
            stdout,
            stderr,
          },
          "Process exited with error, but ignoring"
        );
        return resolve({ stdout, stderr });
      }

      if (code === 0) {
        if (logStderr)
          logger.info(
            {
              func: "execute",
              command,
              args,
              env,
              shell,
              detached,
              pid: child.pid,
              code,
              signal,
              stdout,
              stderr,
            },
            "Process completed successfully"
          );
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`Process exited with code ${code}`);
        if (logStderr)
          logger.error(
            {
              func: "execute",
              command,
              args,
              env,
              shell,
              detached,
              pid: child.pid,
              code,
              signal,
              stdout,
              stderr,
              error,
            },
            "Process failed"
          );
        reject(error);
      }
    });

    child.on("error", (error) => {
      logger.error(
        { func: "execute", command, args, env, shell, detached, pid: child.pid, error },
        "Process error"
      );
      if (!ignoreErrors) reject(error);
      else resolve({ stdout, stderr });
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
