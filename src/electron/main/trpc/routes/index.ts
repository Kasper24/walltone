import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router, createCallerFactory } from "@electron/main/trpc/index.js";
import { apiRouter } from "./api/index.js";
import { fileRouter } from "./file/index.js";
import { monitorRouter } from "./monitor/index.js";
import { settingsRouter } from "./settings/index.js";
import { wallpaperRouter } from "./wallpaper/index.js";
import { themeRouter } from "./theme/index.js";

export const appRouter = router({
  api: apiRouter,
  file: fileRouter,
  monitor: monitorRouter,
  settings: settingsRouter,
  theme: themeRouter,
  wallpaper: wallpaperRouter,
});

export const caller = createCallerFactory(appRouter)({});

export type AppRouter = typeof appRouter;

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
