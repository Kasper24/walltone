import { spawn } from "child_process";
import { TRPCError } from "@trpc/server";

const execute = ({
  command,
  args = [],
  env = {},
  shell = false,
  logStdout = true,
  logStderr = true,
}: {
  command: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  shell?: boolean;
  logStdout?: boolean;
  logStderr?: boolean;
}): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(" ")}`);

    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...env,
      },
      shell,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      if (logStdout) console.log(`[${command}] STDOUT:`, text.trim());
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      if (logStdout) console.log(`[${command}] STDERR:`, text.trim());
    });

    child.on("close", (code) => {
      if (code === 0) {
        if (logStderr) console.log(`[${command}] Process completed successfully`);
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`Process exited with code ${code}`);
        if (logStderr) console.error(`[${command}] Process failed with code ${code}`);
        reject(error);
      }
    });

    child.on("error", (error) => {
      if (logStderr) console.error(`[${command}] Process error:`, error);
      reject(error);
    });
  });
};

const killProcess = async (processName: string) => {
  try {
    await execute({ command: "pkill", args: ["-f", processName] });
    console.log(`Killed existing ${processName} processes`);
  } catch (error) {
    console.log(`No ${processName} processes found or kill failed - ${error}`);
  }
};

const santize = (str: string) => {
  return str.replace(/[^a-z0-9-]/gi, "").toLowerCase();
};

const renderString = async (content: string, context: Record<string, unknown>) => {
  return content.replace(/\$\{([\s\S]+?)\}/g, (_, expr) => {
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
};

export { execute, killProcess, santize, renderString };
