import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { execute } from "@electron/main/lib/index.js";

export type Monitor = {
  name: string;
  make: string;
  model: string;
  x: number;
  y: number;
  width: number;
  height: number;
  refreshRate: number;
  scale: number;
};

export const monitorRouter = router({
  getAll: publicProcedure.query(async () => {
    try {
      const { stdout } = await execute({
        command: "wayland-info",
        logStdout: false,
        logStderr: false,
      });

      const lines = stdout.split("\n");

      const monitors: Monitor[] = [];
      let current: Partial<Monitor> = {};
      let isInOutputBlock = false;
      for (const line of lines) {
        const trimmed = line.trim();

        // New output block
        if (trimmed.includes("interface: 'wl_output'")) {
          if (current.name) {
            monitors.push(current as Monitor);
          }
          current = {};
          isInOutputBlock = true;
          continue;
        }

        if (!isInOutputBlock) continue;

        const kvPairs = trimmed.matchAll(/(\w+):\s*'?([^',]+)'?/g);
        for (const [, key, rawValue] of kvPairs) {
          const value = rawValue.replace(/^'|'$/g, "").trim(); // Remove quotes if any

          switch (key) {
            case "name":
              current.name = value;
              break;
            case "make":
              current.make = value;
              break;
            case "model":
              current.model = value;
              break;
            case "x":
              current.x = parseInt(value);
              break;
            case "y":
              current.y = parseInt(value);
              break;
            case "scale":
              current.scale = parseInt(value);
              break;
            case "width":
              current.width = parseInt(value);
              break;
            case "height":
              current.height = parseInt(value);
              break;
            case "refresh":
              current.refreshRate = parseFloat(value);
              break;
          }
        }
      }

      // Push last monitor
      if (current.name) {
        monitors.push(current as Monitor);
      }

      return monitors;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get monitor configuration: ${errorMessage}`,
        cause: error,
      });
    }
  }),
});
