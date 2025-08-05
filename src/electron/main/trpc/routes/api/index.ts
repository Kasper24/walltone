import { router } from "@electron/main/trpc/index.js";
import { pexelsRouter } from "./pexels/index.js";
import { unsplashRouter } from "./unsplash/index.js";
import { wallhavenRouter } from "./wallhaven/index.js";
import { wallpaperEngineRouter } from "./wallpaper-engine/index.js";

export const apiRouter = router({
  pexels: pexelsRouter,
  unsplash: unsplashRouter,
  wallhaven: wallhavenRouter,
  wallpaperEngine: wallpaperEngineRouter,
});
