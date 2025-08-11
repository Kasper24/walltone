import path from "path";
import { promises as fs } from "fs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@electron/main/trpc/index.js";
import { wallpapersDownloadPath } from "@electron/main/lib/paths.js";
import { pexelsRouter } from "./pexels/index.js";
import { pixabayRouter } from "./pixabay/index.js";
import { unsplashRouter } from "./unsplash/index.js";
import { wallhavenRouter } from "./wallhaven/index.js";
import { wallpaperEngineRouter } from "./wallpaper-engine/index.js";

const downloadSchema = z.object({
  id: z.string(),
  applyPath: z.string(),
});

export const apiRouter = router({
  pexels: pexelsRouter,
  pixabay: pixabayRouter,
  unsplash: unsplashRouter,
  wallhaven: wallhavenRouter,
  wallpaperEngine: wallpaperEngineRouter,
  download: publicProcedure.input(downloadSchema).mutation(async ({ input }) => {
    await fs.mkdir(wallpapersDownloadPath, { recursive: true });

    const response = await fetch(input.applyPath);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
    if (!response.body) throw new Error("Response body is null or undefined.");

    const contentType = response.headers.get("content-type");
    if (!contentType) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Content-Type header is missing.",
      });
    }

    const ext = mimeToExtension(contentType);
    const downloadPath = path.join(wallpapersDownloadPath, `${input.id}${ext}`);

    if (!ext) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `File type '${ext}' is not allowed.`,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(downloadPath, Buffer.from(arrayBuffer));

    return downloadPath;
  }),
});

const mimeToExtension = (mime: string): string | null => {
  const map: Record<string, string> = {
    "image/jpg": ".jpg",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/mov": ".mov",
  };
  return map[mime.toLowerCase()] ?? null;
};
