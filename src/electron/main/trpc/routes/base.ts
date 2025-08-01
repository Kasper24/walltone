import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router, createCallerFactory } from "@electron/main/trpc/index.js";
import { fileRouter } from "./file.js";
import { monitorRouter } from "./monitor.js";
import { settingsRouter } from "./settings.js";
import { themeRouter } from "./theme.js";

export const appRouter = router({
  file: fileRouter,
  monitor: monitorRouter,
  settings: settingsRouter,
  theme: themeRouter,
});

export const caller = createCallerFactory(appRouter)({});

export type AppRouter = typeof appRouter;

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
