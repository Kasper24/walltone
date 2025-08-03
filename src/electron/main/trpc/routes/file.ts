import path from "path";
import { promises as fs } from "fs";
import { BrowserWindow, shell } from "electron";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"];

const downloadSchema = z.object({
  url: z.url(),
});

const openInExplorerSchema = z.object({
  path: z.string(),
});

export const fileRouter = router({
  download: publicProcedure.input(downloadSchema).mutation(async ({ input }) => {
    const url = new URL(input.url);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid URL protocol. Only HTTP and HTTPS are allowed.",
      });
    }

    return new Promise<void>((resolve, reject) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      mainWindow.webContents.downloadURL(input.url);
      mainWindow.webContents.session.once("will-download", (_event, item) => {
        const fileExtension = path.extname(item.getFilename()).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
          item.cancel();
          return reject(
            new TRPCError({
              code: "BAD_REQUEST",
              message: `File type '${fileExtension}' is not allowed.`,
            })
          );
        }

        item.once("done", (_event, state) => {
          if (state === "completed") {
            resolve();
          } else {
            reject(
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Download failed with state: ${state}`,
              })
            );
          }
        });
      });
    });
  }),

  openInExplorer: publicProcedure.input(openInExplorerSchema).mutation(async ({ input }) => {
    try {
      const stats = await fs.stat(input.path);
      if (!stats.isFile()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Path does not point to a file: ${input.path}`,
        });
      }
      shell.showItemInFolder(input.path);
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Failed to open file in explorer. The path '${input.path}' may not exist.`,
        cause: error,
      });
    }
  }),
});
