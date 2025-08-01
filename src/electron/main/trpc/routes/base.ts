import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router, createCallerFactory } from "..";
import { fileRouter } from "./file";
import { monitorRouter } from "./monitor";
import { settingsRouter } from "./settings";
import { themeRouter } from "./theme";

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
