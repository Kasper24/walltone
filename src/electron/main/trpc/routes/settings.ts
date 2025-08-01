import { dialog } from "electron";
import Store from "electron-store";
import keytar from "keytar";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "@electron/main/trpc/index.js";

const store = new Store({ name: "settings" });

const keySchema = z.enum([
  "unsplash.apiKey",
  "pexels.apiKey",
  "wallpaperEngine.apiKey",
  "wallpaperEngine.assetsFolder",
  "wallpaperEngine.wallpaperFolders",
  "image.wallpaperFolders",
  "video.wallpaperFolders",
  "theme.templates",
  "theme.wallpaperCopyDestinations",
  "theme.restoreOnStart",
  "theme.lastWallpaperCmd",
]);

const filePicker = async (type: "file" | "folder"): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: [type === "folder" ? "openDirectory" : "openFile"],
  });

  if (result.canceled) return null;
  return result.filePaths[0];
};

const getNestedValue = (obj: any, path: (string | number)[]): any => {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

const setValue = async (key: string, value: any, encrypt: boolean) => {
  try {
    if (encrypt) await keytar.setPassword("walltone", key, value);
    else store.set(key, value);
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to set setting ${key}`,
      cause: error,
    });
  }
};

export const settingsRouter = router({
  get: publicProcedure
    .input(
      z.object({
        key: keySchema,
        path: z.array(z.union([z.string(), z.number()])).optional(),
        decrypt: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        let settingValue = store.get(input.key);
        if (input.path) settingValue = getNestedValue(settingValue, input.path);

        if (!settingValue) return null;

        if (input.decrypt) return await keytar.getPassword("walltone", input.key);

        return settingValue;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get value ${input.key}`,
          cause: error,
        });
      }
    }),

  set: publicProcedure
    .input(
      z.object({
        key: keySchema,
        path: z.array(z.union([z.string(), z.number()])).optional(),
        value: z.any().optional(),
        filePicker: z.enum(["file", "folder"]).optional(),
        encrypt: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const settingValue = store.get(input.key);
        const newValue =
          input.value ?? (input.filePicker ? await filePicker(input.filePicker) : null);

        if (input.path) {
          const path = [...input.path];
          const lastKey = path.pop() as string | number;
          const nestedValue = getNestedValue(settingValue, path);

          if (Array.isArray(nestedValue) && typeof lastKey === "number") {
            nestedValue[lastKey] = newValue;
          } else if (
            typeof nestedValue === "object" &&
            nestedValue !== null &&
            typeof lastKey === "string"
          ) {
            (nestedValue as Record<string, unknown>)[lastKey] = newValue;
          } else {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid path for setting ${input.key}`,
            });
          }

          await setValue(input.key, settingValue, input.encrypt);
        } else {
          await setValue(input.key, newValue, input.encrypt);
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to set value to ${input.key}`,
          cause: error,
        });
      }
    }),

  add: publicProcedure
    .input(
      z.object({
        key: keySchema,
        path: z.array(z.union([z.string(), z.number()])).optional(),
        value: z.any().optional(),
        filePicker: z.enum(["file", "folder"]).optional(),
        encrypt: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let settingValue = store.get(input.key) || [];
        if (input.path) settingValue = getNestedValue(settingValue, input.path);

        if (!Array.isArray(settingValue)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Setting ${input.key} is not an array`,
          });
        }

        const newValue =
          input.value ?? (input.filePicker ? await filePicker(input.filePicker) : null);
        settingValue.push(newValue);
        await setValue(input.key, settingValue, input.encrypt);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add value to ${input.key}`,
          cause: error,
        });
      }
    }),

  delete: publicProcedure
    .input(
      z.object({
        key: keySchema,
        path: z.array(z.union([z.string(), z.number()])).optional(),
        index: z.number().int().nonnegative(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let settingValue = store.get(input.key);
        if (input.path) settingValue = getNestedValue(settingValue, input.path);

        if (!Array.isArray(settingValue)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Setting ${input.key} is not an array`,
          });
        }

        settingValue.splice(input.index, 1);
        await setValue(input.key, settingValue, false);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete value ${input.key}`,
          cause: error,
        });
      }
    }),
});
