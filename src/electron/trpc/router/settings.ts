import { dialog, safeStorage } from "electron";
import settings from "electron-settings";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "..";

const keySchema = z.enum([
  "unsplash:api-key",
  "pexels:api-key",
  "wallpaper-engine:api-key",
  "wallpaper-engine:assets-folder",
  "wallpaper-engine:wallpaper-folders",
  "image:wallpaper-folders",
  "video:wallpaper-folders",
  "theme:output-path",
]);

export const settingsRouter = router({
  set: publicProcedure
    .input(
      z.object({
        key: keySchema,
        value: z.any(),
        encrypt: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (input.encrypt && safeStorage.isEncryptionAvailable()) {
          const encryptedValue = safeStorage.encryptString(input.value);
          await settings.set(input.key, encryptedValue.toString("base64"));
        } else {
          await settings.set(input.key, input.value);
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to set setting ${input.key}`,
          cause: error,
        });
      }
    }),

  get: publicProcedure
    .input(z.object({ key: keySchema, decrypt: z.boolean().default(false) }))
    .query(async ({ input }) => {
      try {
        const value = await settings.get(input.key);
        if (!value) {
          return null;
        }
        if (input.decrypt && safeStorage.isEncryptionAvailable()) {
          return safeStorage.decryptString(Buffer.from(value as string, "base64"));
        }
        return value;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get setting ${input.key}`,
          cause: error,
        });
      }
    }),

  addFolder: publicProcedure.input(z.object({ key: keySchema })).mutation(async ({ input }) => {
    try {
      const folders: string[] = ((await settings.get(input.key)) as string[]) || [];
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory"],
      });

      if (canceled) return null;

      const selectedFolder = filePaths[0];
      if (!folders.includes(selectedFolder)) {
        folders.push(selectedFolder);
        await settings.set(input.key, folders);
        return selectedFolder;
      }

      return null;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to add folder for setting ${input.key}`,
        cause: error,
      });
    }
  }),

  deleteFolder: publicProcedure
    .input(
      z.object({
        key: keySchema,
        folder: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const folders = (((await settings.get(input.key)) as string[]) || []).filter(
          (folder: string) => folder !== input.folder
        );
        if (folders.length === 0) {
          await settings.set(input.key, null);
          return;
        }
        await settings.set(input.key, folders);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete folder for setting ${input.key}`,
          cause: error,
        });
      }
    }),
});
