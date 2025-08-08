import z from "zod";
import { monitorsSchema, setWallpaperSchema } from "./index.js";

export interface BaseWallpaper {
  type: "image" | "video" | "wallpaper-engine";
  id: string;
  name: string;
  thumbnailPath: string;
  fullSizePath: string;
}

export interface ApiWallpaper extends BaseWallpaper {
  downloadUrl: string;
}

interface ImageWallpaper extends BaseWallpaper {
  type: "image";
  applyPath: string;
  dateAdded: number;
  tags: string[];
}

interface VideoWallpaper extends BaseWallpaper {
  type: "video";
  applyPath: string;
  dateAdded: number;
  tags: string[];
}

export interface WallpaperEngineWallpaper extends BaseWallpaper {
  type: "wallpaper-engine";
  applyPath: string;
  dateAdded: number;
  tags: string[];
  workshopId: string;
  sceneFile: string;
  sceneType: string;
}

export type LibraryWallpaper = ImageWallpaper | VideoWallpaper | WallpaperEngineWallpaper;

export interface WallpaperData<T extends BaseWallpaper> {
  data: T[];
  currentPage: number;
  prevPage: number | null;
  nextPage: number | null;
  totalItems: number;
  totalPages: number;
}

export type SetWallpaperInput = z.infer<typeof setWallpaperSchema>;
export type MonitorConfig = z.infer<typeof monitorsSchema>;
