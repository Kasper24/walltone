import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router, createCallerFactory } from "..";
import { fileRouter } from "./file";
import { monitorRouter } from "./monitor";
import { settingsRouter } from "./settings";
import { wallpaperRouter } from "./wallpaper";

export const appRouter = router({
  file: fileRouter,
  monitor: monitorRouter,
  settings: settingsRouter,
  wallpaper: wallpaperRouter,
});

export const caller = createCallerFactory(appRouter)({});

export type AppRouter = typeof appRouter;

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
