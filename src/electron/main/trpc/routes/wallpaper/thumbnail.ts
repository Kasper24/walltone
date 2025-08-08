import os from "os";
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import sharp from "sharp";
import { execute } from "@electron/main/lib/index.js";
import { LibraryWallpaper } from "./types.js";

const THUMB_CACHE_DIR = path.join(os.homedir(), ".cache", "walltone", "thumbnails");
const THUMBNAIL_WIDTH = 640;

const getFileHash = async (filePath: string): Promise<string> => {
  const stat = await fs.stat(filePath);
  return crypto.createHash("sha1").update(`${stat.mtimeMs}-${stat.size}`).digest("hex");
};

const getOrCreateThumbnail = async (wallpaper: LibraryWallpaper) => {
  await fs.mkdir(THUMB_CACHE_DIR, { recursive: true });
  const fullSizePath = wallpaper.fullSizePath.replace("image://", "").replace("video://", "");

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

const resolveThumbnailPath = async (wallpaper: LibraryWallpaper) => {
  if (wallpaper.type === "image") {
    return await getOrCreateThumbnail(wallpaper);
  } else if (wallpaper.type === "video") {
    return await getOrCreateThumbnail(wallpaper);
  } else if (wallpaper.type === "wallpaper-engine") {
    // If the preview is a gif, just use it directly
    if (path.extname(wallpaper.thumbnailPath).toLowerCase() === ".gif") {
      return wallpaper.thumbnailPath;
    }
    // Otherwise, generate a thumbnail
    return await getOrCreateThumbnail(wallpaper);
  }

  return "";
};

export { resolveThumbnailPath };
