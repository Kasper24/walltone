import { BrowserWindow, shell } from "electron";
import z from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";

const downloadSchema = z.object({
  url: z.string().url(),
});

export const fileRouter = router({
  download: publicProcedure.input(downloadSchema).mutation(async ({ input }) => {
    return new Promise<void>((resolve, reject) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      mainWindow.webContents.downloadURL(input.url);
      mainWindow.webContents.session.once("will-download", (_event, item) => {
        item.once("done", (_event, state) => {
          if (state === "completed") {
            resolve();
          } else {
            reject(new Error(`Download failed: ${state}`));
          }
        });
      });
    });
  }),

  openInExplorer: publicProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ input }) => {
      shell.showItemInFolder(input.path);
    }),
});
