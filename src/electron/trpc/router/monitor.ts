import { exec } from "child_process";
import { promisify } from "util";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "..";
import { execute } from "../lib";

export interface WlrMonitor {
  name: string;
  description: string;
  make: string;
  model: string;
  serial: string;
  physical_size: {
    width: number;
    height: number;
  };
  enabled: boolean;
  mode: {
    width: number;
    height: number;
    refresh: number;
    preferred: boolean;
    current: boolean;
  };
  position: {
    x: number;
    y: number;
  };
  transform: string;
  scale: number;
  adaptive_sync: boolean;
}

const execPromise = promisify(exec);

const normalizeMonitor = (monitor: WlrMonitor) => ({
  ...monitor,
  make: monitor.make || "Unknown",
  model: monitor.model || "Unknown",
  serial: monitor.serial || "Unknown",
});

const getWlrOutputMonitors = async () => {
  try {
    const { stdout, stderr } = await execPromise("wlr-randr --json");

    if (stderr) {
      throw new Error(`wlr-randr stderr: ${stderr}`);
    }

    const rawMonitors = JSON.parse(stdout) as WlrMonitor[];
    return rawMonitors.map(normalizeMonitor);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse wlr-randr JSON output");
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`wlr-randr command failed: ${errorMessage}`);
  }
};

const detectOutputProtocols = async () => {
  const { stdout: protocols } = await execute("wayland-info");

  if (protocols.includes("zwlr_output_manager_v1")) return "zwlr_output_manager_v1";

  return "unknown";
};

export const monitorRouter = router({
  getAll: publicProcedure.query(async () => {
    const outputProtocol = await detectOutputProtocols();

    try {
      switch (outputProtocol) {
        case "zwlr_output_manager_v1":
          return await getWlrOutputMonitors();

        default:
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Only compositors supporting zwlr_output_manager_v1 are currently supported.",
          });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get output configuration: ${errorMessage}`,
        cause: error,
      });
    }
  }),
});
