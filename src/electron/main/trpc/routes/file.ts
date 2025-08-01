import { shell } from "electron";
import z from "zod";
import { getMainWindow } from "@electron/main/index.js";
import { publicProcedure, router } from "@electron/main/trpc/index.js";

export const fileRouter = router({
  download: publicProcedure.input(z.object({ url: z.string() })).mutation(async ({ input }) => {
    return new Promise<void>((resolve, reject) => {
      const mainWindow = getMainWindow();
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
