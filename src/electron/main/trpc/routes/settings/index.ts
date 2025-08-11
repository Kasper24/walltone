import { dialog } from "electron";
import keytar from "keytar";
import { z } from "zod";
import Conf, { Schema } from "conf";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { SetWallpaperInput } from "@electron/main/trpc/routes/wallpaper/types.js";

export interface SettingsSchema {
  /** Settings for the application's appearance and startup behavior. */
  app: {
    uiTheme: "light" | "dark";
    restoreWallpaperOnStart: boolean;
    killWallpaperOnExit: boolean;
  };

  /** Settings that control how themes are generated from an image. */
  themeGeneration: {
    quantizeLibrary: "material" | "quantize";
    base16: {
      accentMinSaturation: number;
      accentMaxSaturation: number;
      accentMinLuminance: number;
      accentMaxLuminance: number;
      accentSaturation: number;
      accentDarken: number;
      accentLighten: number;
      backgroundSaturation: number;
      backgroundDarken: number;
      backgroundLighten: number;
    };
  };

  /** Settings for what to do after a theme is generated. */
  themeOutput: {
    templates: {
      src: string;
      dest: string;
      postHook: string;
    }[];
    wallpaperCopyDestinations: string[];
  };

  /** Settings for all wallpaper sources. */
  wallpaperSources: {
    imageFolders: string[];
    videoFolders: string[];
    wallpaperEngineAssetsFolder: string;
    wallpaperEngineFolders: string[];
  };

  /** Internal state, not typically edited by the user. */
  internal: {
    lastWallpaper: Record<string, SetWallpaperInput>;
  };

  /** API keys for third-party services. */
  apiKeys?: {
    pexels: string;
    pixabay: string;
    unsplash: string;
    wallpaperEngine: string;
  };
}

const schema: Schema<SettingsSchema> = {
  app: {
    type: "object",
    properties: {
      uiTheme: { type: "string", enum: ["light", "dark"], default: "dark" },
      restoreWallpaperOnStart: { type: "boolean", default: true },
      killWallpaperOnExit: { type: "boolean", default: true },
    },
    default: {},
  },
  themeGeneration: {
    type: "object",
    properties: {
      quantizeLibrary: {
        type: "string",
        enum: ["material", "quantize"],
        default: "material",
      },
      base16: {
        type: "object",
        properties: {
          accentMinSaturation: { type: "number", default: 0, minimum: 0, maximum: 1 },
          accentMaxSaturation: { type: "number", default: 1, minimum: 0, maximum: 1 },
          accentMinLuminance: { type: "number", default: 0.08, minimum: 0, maximum: 1 },
          accentMaxLuminance: { type: "number", default: 0.8, minimum: 0, maximum: 1 },
          accentSaturation: { type: "number", default: 0.3, minimum: -10, maximum: 10 },
          accentDarken: { type: "number", default: 0, minimum: -10, maximum: 10 },
          accentLighten: { type: "number", default: 0, minimum: -10, maximum: 10 },
          backgroundSaturation: { type: "number", default: 0, minimum: -10, maximum: 10 },
          backgroundDarken: { type: "number", default: 0, minimum: -10, maximum: 10 },
          backgroundLighten: { type: "number", default: 0, minimum: -10, maximum: 10 },
        },
        default: {},
      },
    },
    default: {},
  },
  themeOutput: {
    type: "object",
    properties: {
      templates: {
        type: "array",
        default: [],
        items: {
          type: "object",
          properties: {
            src: { type: "string", default: "" },
            dest: { type: "string", default: "" },
            postHook: { type: "string", default: "" },
          },
        },
      },
      wallpaperCopyDestinations: { type: "array", default: [], items: { type: "string" } },
    },
    default: {},
  },
  wallpaperSources: {
    type: "object",
    properties: {
      imageFolders: { type: "array", default: [], items: { type: "string" } },
      videoFolders: { type: "array", default: [], items: { type: "string" } },
      wallpaperEngineAssetsFolder: { type: "string", default: "" },
      wallpaperEngineFolders: { type: "array", default: [], items: { type: "string" } },
    },
    default: {},
  },
  internal: {
    type: "object",
    properties: {
      lastWallpaper: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["image", "video", "wallpaper-engine"] },
          id: { type: "string", minLength: 1 },
          name: { type: "string", minLength: 1 },
          applyPath: { type: "string", minLength: 1 },
          monitors: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                id: { type: "string", minLength: 1 },
                scalingMethod: { type: "string" },
              },
              required: ["id"],
            },
          },
          wallpaperEngineOptions: {
            type: "object",
            properties: {
              silent: { type: "boolean" },
              volume: { type: "number", minimum: 0, maximum: 100 },
              noAutomute: { type: "boolean" },
              noAudioProcessing: { type: "boolean" },
              fps: { type: "number", minimum: 1, maximum: 200 },
              clamping: { type: "string", enum: ["clamp", "border", "repeat"] },
              disableMouse: { type: "boolean" },
              disableParallax: { type: "boolean" },
              noFullscreenPause: { type: "boolean" },
            },
          },
          videoOptions: {
            type: "object",
            properties: {
              mute: { type: "boolean" },
            },
          },
        },
        default: {},
      },
    },
    default: {},
  },
};

type Paths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string ? `${K}` | `${K}${PathContinuation<T[K]>}` : never;
    }[keyof T]
  : never;

type PathContinuation<T> = T extends (infer E)[]
  ? `[${number}]` | `[${number}]${PathContinuation<E>}`
  : T extends object
    ? `.${Paths<T>}`
    : "";

export type SettingKey = Paths<SettingsSchema>;

const store = new Conf<SettingsSchema>({
  projectName: "walltone",
  projectVersion: "0.0.1",
  projectSuffix: "",
  schema,
});

const filePicker = async (type: "file" | "folder"): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: [type === "folder" ? "openDirectory" : "openFile"],
  });

  if (result.canceled) return null;
  return result.filePaths[0];
};

const getSchema = z.object({
  key: z.string(),
  decrypt: z.boolean().default(false),
});

const setSchema = z.object({
  key: z.string(),
  value: z.any().optional(),
  filePicker: z.enum(["file", "folder"]).optional(),
  encrypt: z.boolean().default(false),
});

const addSchema = z.object({
  key: z.string(),
  value: z.any().optional(),
  filePicker: z.enum(["file", "folder"]).optional(),
});

const deleteSchema = z.object({
  key: z.string(),
  index: z.number().nonnegative(),
  encrypted: z.boolean().default(false),
});

export const settingsRouter = router({
  get: publicProcedure.input(getSchema).query(async ({ input }) => {
    try {
      if (input.decrypt) return await keytar.getPassword("walltone", input.key);
      return store.get(input.key);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get value ${input.key}`,
        cause: error,
      });
    }
  }),

  set: publicProcedure.input(setSchema).mutation(async ({ input }) => {
    try {
      if (input.filePicker) {
        const selectedPath = await filePicker(input.filePicker);
        if (!selectedPath) return;
        input.value = selectedPath;
      }

      if (input.encrypt) await keytar.setPassword("walltone", input.key, String(input.value ?? ""));
      else store.set(input.key, input.value);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to set value at ${input.key}`,
        cause: error,
      });
    }
  }),

  add: publicProcedure.input(addSchema).mutation(async ({ input }) => {
    try {
      if (input.filePicker) {
        const selectedPath = await filePicker(input.filePicker);
        if (!selectedPath) return;
        input.value = selectedPath;
      }
      const targetArray = store.get(input.key) as unknown[];
      if (!Array.isArray(targetArray)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot add to target of type ${typeof targetArray}`,
        });
      }

      targetArray.push(input.value);
      store.set(input.key, targetArray);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to add value at ${input.key}`,
        cause: error,
      });
    }
  }),

  delete: publicProcedure.input(deleteSchema).mutation(async ({ input }) => {
    try {
      if (input.encrypted) {
        await keytar.deletePassword("walltone", input.key);
      } else {
        const arr = store.get(input.key);
        if (!Array.isArray(arr)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot delete from target of type ${typeof arr}`,
          });
        }

        arr.splice(input.index, 1);
        store.set(input.key, arr);
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to delete value at ${input.key}`,
        cause: error,
      });
    }
  }),
});
