import { spawn } from "child_process";

const execute = (
  command: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = {}
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(" ")}`);

    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...env,
      },
    });

    child.stdout.on("data", (data) => {
      console.log(`[${command}] STDOUT:`, data.toString().trim());
    });

    child.stderr.on("data", (data) => {
      console.log(`[${command}] STDERR:`, data.toString().trim());
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`[${command}] Process completed successfully`);
        resolve();
      } else {
        const error = new Error(`Process exited with code ${code}`);
        console.error(`[${command}] Process failed with code ${code}`);
        reject(error);
      }
    });

    child.on("error", (error) => {
      console.error(`[${command}] Process error:`, error);
      reject(error);
    });
  });
};

const killProcess = async (processName: string) => {
  try {
    await execute("pkill", ["-f", processName]);
    console.log(`Killed existing ${processName} processes`);
  } catch (error) {
    console.log(`No ${processName} processes found or kill failed`);
  }
};

const santize = (str: string) => {
  return str.replace(/[^a-z0-9-]/gi, "").toLowerCase();
};

export { execute, killProcess, santize };
