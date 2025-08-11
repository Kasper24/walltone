import path from "path";
import { Worker } from "worker_threads";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { eventsEmitter, publicProcedure, router } from "@electron/main/trpc/index.js";
import { caller } from "@electron/main/trpc/routes/index.js";
import { type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";
import { type WallpaperData, type LibraryWallpaper } from "./types.js";
import {
  getImageAndVideoWallpapers,
  getWallpaperEngineWallpapers,
  filterWallpapers,
  sortWallpapers,
  paginateData,
} from "./search.js";
import {
  getMonitors,
  saveLastWallpaper,
  killWallpaperProcesses,
  screenshotWallpaper,
  setWallpaper,
} from "./set.js";

export const searchWallpapersSchema = z.object({
  type: z.enum(["image", "video", "wallpaper-engine", "all"]),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).default(20),
  query: z.string().optional(),
  sorting: z.enum(["name", "date_added", "id"]).default("name"),
  tags: z.array(z.string()).optional(),
  matchAll: z.boolean().default(false),
});

export const monitorsSchema = z.array(
  z.object({
    id: z.string().min(1),
    scalingMethod: z.string().optional(),
  })
);

export const setWallpaperSchema = z.object({
  type: z.enum(["image", "video", "wallpaper-engine"]),
  id: z.string().min(1),
  name: z.string().min(1),
  applyPath: z.string().min(1),
  monitors: monitorsSchema.min(1),
  wallpaperEngineOptions: z
    .object({
      silent: z.boolean().optional(),
      volume: z.number().min(0).max(100).optional(),
      noAutomute: z.boolean().optional(),
      noAudioProcessing: z.boolean().optional(),
      fps: z.number().min(1).max(200).optional(),
      clamping: z.enum(["clamp", "border", "repeat"]).optional(),
      disableMouse: z.boolean().optional(),
      disableParallax: z.boolean().optional(),
      noFullscreenPause: z.boolean().optional(),
    })
    .optional(),
  videoOptions: z
    .object({
      mute: z.boolean().optional(),
    })
    .optional(),
});

export const wallpaperRouter = router({
  search: publicProcedure.input(searchWallpapersSchema).query(async ({ input }) => {
    const wallpapers: LibraryWallpaper[] = [];

    if (input.type === "image" || input.type === "all") {
      const imageWallpapers = await getImageAndVideoWallpapers("image");
      wallpapers.push(...imageWallpapers);
    }

    if (input.type === "video" || input.type === "all") {
      const videoWallpapers = await getImageAndVideoWallpapers("video");
      wallpapers.push(...videoWallpapers);
    }

    if (input.type === "wallpaper-engine" || input.type === "all") {
      const weWallpapers = await getWallpaperEngineWallpapers();
      wallpapers.push(...weWallpapers);
    }

    const filtered = filterWallpapers(wallpapers, input.query, input.tags, input.matchAll);
    const sorted = sortWallpapers(filtered, input.sorting);
    const paginated = paginateData(sorted, input.page, input.perPage);

    return (await new Promise((resolve, reject) => {
      const workerPath = path.join(import.meta.dirname, "thumbnail-generator.js");
      const worker = new Worker(workerPath);

      worker.on("message", (event) => {
        const result = event.data;
        if (event.status === "success") {
          resolve(result);
        } else {
          reject(new Error(result?.error || "Worker failed with an unknown error."));
        }
        worker.terminate();
      });

      worker.on("error", (error) => {
        reject(error);
        worker.terminate();
      });

      worker.postMessage({ data: paginated });
    })) as unknown as Promise<WallpaperData<LibraryWallpaper>>;
  }),

  set: publicProcedure.input(setWallpaperSchema).mutation(async ({ input }) => {
    if (input.monitors.length === 0) input.monitors = await getMonitors();

    await saveLastWallpaper(input);
    await killWallpaperProcesses();
    await Promise.resolve(setTimeout(() => {}, 1000)); // Allow time for last wallpaper to be saved

    try {
      await screenshotWallpaper(input);
    } finally {
      await setWallpaper(input);
    }
  }),

  onWallpaperError: publicProcedure.subscription(() => {
    return observable((emit) => {
      function onWallpaperError(error: string) {
        emit.next(error);
      }

      eventsEmitter.on("wallpaper-error", onWallpaperError);

      return () => {
        eventsEmitter.off("wallpaper-error", onWallpaperError);
      };
    });
  }),

  restoreOnStart: publicProcedure.mutation(async () => {
    const restoreOnStart = await caller.settings.get({
      key: "app.restoreWallpaperOnStart",
    });
    if (!restoreOnStart) return;

    const lastWallpaper = (await caller.settings.get({
      key: "internal.lastWallpaper",
    })) as SettingsSchema["internal"]["lastWallpaper"];

    try {
      await Promise.all(
        Object.values(lastWallpaper).map(async (wallpaper) => {
          if (wallpaper.monitors.length === 0) wallpaper.monitors = await getMonitors();
          await killWallpaperProcesses();
          await setWallpaper(wallpaper);
        })
      );
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error setting wallpaper: ${error instanceof Error ? error.message : "Unknown error"}`,
        cause: error,
      });
    }
  }),

  killWallpapersOnExit: publicProcedure.mutation(async () => {
    const killOnExit = await caller.settings.get({
      key: "app.killWallpaperOnExit",
    });
    if (killOnExit) await killWallpaperProcesses();
  }),
});
