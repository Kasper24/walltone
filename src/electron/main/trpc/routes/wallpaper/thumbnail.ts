import { parentPort } from "worker_threads";
import os from "os";
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import sharp from "sharp";
import { encode } from "blurhash";
import { execute } from "@electron/main/lib/index.js";
import { LibraryWallpaper, WallpaperData } from "./types.js";

const THUMB_CACHE_DIR = path.join(os.homedir(), ".cache", "walltone", "thumbnails");
const THUMBNAIL_WIDTH = 640;

const getFileHash = async (filePath: string): Promise<string> => {
  const stat = await fs.stat(filePath);
  return crypto.createHash("sha1").update(`${stat.mtimeMs}-${stat.size}`).digest("hex");
};

const getOrCreateThumbnail = async (wallpaper: LibraryWallpaper) => {
  // If the wallpaper is a GIF, we return the full size path directly
  // as we do not generate thumbnails for GIFs.
  if (path.extname(wallpaper.fullSizePath).toLowerCase() === ".gif") {
    return wallpaper.fullSizePath;
  }

  const fullSizePath = wallpaper.fullSizePath.replace("image://", "").replace("video://", "");
  await fs.mkdir(THUMB_CACHE_DIR, { recursive: true });

  const hash = await getFileHash(fullSizePath);
  const thumbPath = path.join(THUMB_CACHE_DIR, `${hash}.jpeg`);

  try {
    await fs.access(thumbPath);
    console.log("Cache hit: ", wallpaper.fullSizePath);
  } catch {
    console.log("Cache miss: ", wallpaper.fullSizePath);

    if (wallpaper.type === "image" || wallpaper.type === "wallpaper-engine")
      await sharp(fullSizePath)
        .rotate()
        .resize(THUMBNAIL_WIDTH, null, {
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 80,
          mozjpeg: true,
        })
        .toFile(thumbPath);
    else if (wallpaper.type === "video")
      await execute({
        ignoreErrors: true,
        logStdout: false,
        logStderr: false,
        command: "ffmpeg",
        args: [
          "-y",
          "-ss",
          "1", // seek to 1s
          "-i",
          fullSizePath,
          "-frames:v",
          "1", // grab one frame
          "-vf",
          `scale='if(gt(iw,${THUMBNAIL_WIDTH}),${THUMBNAIL_WIDTH},iw)':-1`,
          "-q:v",
          "1", // quality (1 = best, 31 = worst)
          thumbPath, // save directly to file
        ],
      });
  }

  return `image://${thumbPath}`;
};

const generateBlurHash = async (wallpaper: LibraryWallpaper) => {
  const fullSizePath = wallpaper.thumbnailPath.replace("image://", "").replace("video://", "");
  try {
    const buf = await sharp(fullSizePath).resize(32, 32).ensureAlpha().raw().toBuffer();
    return encode(Uint8ClampedArray.from(buf), 32, 32, 4, 4);
  } catch {
    return undefined;
  }
};

parentPort?.on("message", async ({ data }: { data: WallpaperData<LibraryWallpaper> }) => {
  try {
    data.data = await Promise.all(
      data.data.map(async (wallpaper) => {
        wallpaper.thumbnailPath = await getOrCreateThumbnail(wallpaper);
        wallpaper.blurHash = await generateBlurHash(wallpaper);
        return wallpaper;
      })
    );

    parentPort?.postMessage({ status: "success", data });
  } catch (error) {
    parentPort?.postMessage({ status: "error", error: (error as Error).message });
  }
});
