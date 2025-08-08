import z from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { caller } from "@electron/main/trpc/routes/index.js";
import { type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";
import { resolveThumbnailPath } from "./thumbnail.js";
import { type LibraryWallpaper } from "./types.js";
import {
  getImageAndVideoWallpapers,
  getWallpaperEngineWallpapers,
  filterWallpapers,
  sortWallpapers,
  paginateData,
} from "./search.js";
import {
  populateMonitorsIfEmpty,
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
  path: z.string().min(1),
  monitors: monitorsSchema.min(1),
  screenshot: z.boolean().default(true),
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

    paginated.data = await Promise.all(
      paginated.data.map(async (wallpaper) => {
        wallpaper.thumbnailPath = await resolveThumbnailPath(wallpaper);
        return wallpaper;
      })
    );

    return paginated;
  }),

  set: publicProcedure.input(setWallpaperSchema).mutation(async ({ input }) => {
    await populateMonitorsIfEmpty(input);
    await saveLastWallpaper(input);
    await killWallpaperProcesses();
    await screenshotWallpaper(input);
    await setWallpaper(input);
  }),

  restoreOnStart: publicProcedure.mutation(async () => {
    const restoreOnStart = await caller.settings.get({
      key: "app.restoreWallpaperOnStart",
    });
    if (!restoreOnStart) return;

    const lastWallpaper = (await caller.settings.get({
      key: "internal.lastWallpaper",
    })) as SettingsSchema["internal"]["lastWallpaper"];

    Object.values(lastWallpaper).forEach(async (wallpaper) => {
      await caller.wallpaper.set({
        ...wallpaper,
        screenshot: false,
      });
    });
  }),
});
