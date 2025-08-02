import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router, createCallerFactory } from "@electron/main/trpc/index.js";
import { pexelsRouter } from "./api/pexels.js";
import { unsplashRouter } from "./api/unsplash.js";
import { wallhavenRouter } from "./api/wallhaven.js";
import { wallpaperEngineRouter } from "./api/wallpaper-engine.js";
import { fileRouter } from "./file.js";
import { monitorRouter } from "./monitor.js";
import { settingsRouter } from "./settings.js";
import { themeRouter } from "./theme.js";

export const appRouter = router({
  api: router({
    pexels: pexelsRouter,
    unsplash: unsplashRouter,
    wallhaven: wallhavenRouter,
    wallpaperEngine: wallpaperEngineRouter,
  }),
  file: fileRouter,
  monitor: monitorRouter,
  settings: settingsRouter,
  theme: themeRouter,
});

export const caller = createCallerFactory(appRouter)({});

export type AppRouter = typeof appRouter;

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
