import { dialog, shell } from "electron";
import z from "zod";
import { publicProcedure, router } from "..";
import { getMainWindow } from "@electron/main";

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

  pickFolder: publicProcedure.mutation(async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  }),

  openInExplorer: publicProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ input }) => {
      shell.showItemInFolder(input.path);
    }),
});
