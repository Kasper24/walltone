import { promises as fs } from "fs";
import { shell } from "electron";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import logger from "@electron/main/lib/logger.js";

const openInExplorerSchema = z.object({
  path: z.string(),
});

export const fileRouter = router({
  openInExplorer: publicProcedure.input(openInExplorerSchema).mutation(async ({ input }) => {
    logger.info({ input }, "file.openInExplorer: start");
    try {
      const stats = await fs.stat(input.path);
      if (!stats.isFile()) {
        logger.error({ input }, "file.openInExplorer: not a file");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Path does not point to a file: ${input.path}`,
        });
      }
      shell.showItemInFolder(input.path);
      logger.info({ input }, "file.openInExplorer: success");
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      logger.error({ input, error }, "file.openInExplorer: failed");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Failed to open file in explorer. The path '${input.path}' may not exist.`,
        cause: error,
      });
    }
  }),
});
