import { exec } from "child_process";
import { promisify } from "util";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "..";

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

const getWlrMonitors = async () => {
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

const detectDE = () => {
  const { XDG_CURRENT_DESKTOP, WAYLAND_DISPLAY, SWAYSOCK, XDG_SESSION_TYPE } = process.env;

  // Check for KDE
  if (XDG_CURRENT_DESKTOP?.toLowerCase().includes("kde")) {
    return "kde";
  }

  // Check for wlroots-based compositors
  if (WAYLAND_DISPLAY || SWAYSOCK || XDG_SESSION_TYPE === "wayland") {
    return "wlr";
  }

  return "unknown";
};

export const monitorRouter = router({
  getAll: publicProcedure.query(async () => {
    const desktopEnvironment = detectDE();

    try {
      switch (desktopEnvironment) {
        case "wlr":
          return await getWlrMonitors();

        case "kde":
          throw new TRPCError({
            code: "NOT_IMPLEMENTED",
            message: "KDE support is not yet implemented",
          });

        default:
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Unsupported desktop environment: ${desktopEnvironment}. Only wlroots-based compositors are currently supported.`,
          });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get display configuration: ${errorMessage}`,
        cause: error,
      });
    }
  }),
});
