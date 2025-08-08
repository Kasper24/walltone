import path from "path";
import { promises as fs } from "fs";
import { TRPCError } from "@trpc/server";
import { caller } from "@electron/main/trpc/routes/index.js";
import {
  type WallpaperEngineWallpaper,
  type LibraryWallpaper,
  type WallpaperData,
} from "./types.js";

const WALLPAPERS_TYPE_TO_EXTS = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"],
  video: [".mp4", ".mkv", ".webm", ".avi", ".mov"],
};

const getImageAndVideoWallpapers = async (type: "image" | "video") => {
  const wallpapers: LibraryWallpaper[] = [];

  const folders = await caller.settings.get({
    key: `wallpaperSources.${type}Folders`,
  });

  if (!folders || !Array.isArray(folders) || folders.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No ${type} folders configured.`,
    });
  }

  for (const folder of folders) {
    try {
      const files = await searchForFiles(folder, WALLPAPERS_TYPE_TO_EXTS[type]);
      files.forEach(async (file) => {
        wallpapers.push({
          id: path.basename(file.path),
          name: file.name,
          path: file.path,
          thumbnailPath: "", // Generated later
          fullSizePath: `${type}://${file.path}`,
          dateAdded: Date.now(),
          tags: [type],
          type: type,
        });
      });
    } catch (error) {
      console.error(`Failed to search ${type} files in ${folder}:`, error);
    }
  }

  return wallpapers;
};

const searchForFiles = async (folderPath: string, fileTypes: string[]) => {
  const files: { name: string; path: string }[] = [];
  const dirents = await fs.readdir(folderPath, { withFileTypes: true });

  for (const dirent of dirents) {
    const dirPath = path.join(folderPath, dirent.name);
    const ext = path.extname(dirent.name).toLowerCase();

    if (dirent.isDirectory()) {
      const subdirectoryFiles = await searchForFiles(dirPath, fileTypes);
      files.push(...subdirectoryFiles);
    } else if (dirent.isFile() && fileTypes.includes(ext)) {
      const name = path.basename(dirent.name, path.extname(dirent.name));
      files.push({ name, path: dirPath });
    }
  }

  return files;
};

const getWallpaperEngineWallpapers = async () => {
  const wallpapers: WallpaperEngineWallpaper[] = [];
  const folders = await caller.settings.get({
    key: "wallpaperSources.wallpaperEngineFolders",
  });
  if (!folders || !Array.isArray(folders) || folders.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No Wallpaper Engine folders configured.",
    });
  }

  for (const folder of folders) {
    try {
      const subdirectories = await fs.readdir(folder, { withFileTypes: true });

      for (const dirent of subdirectories) {
        if (dirent.isDirectory()) {
          const subdirectoryPath = path.join(folder, dirent.name);
          const jsonFilePath = path.join(subdirectoryPath, "project.json");

          try {
            const jsonFileExists = await fs
              .access(jsonFilePath)
              .then(() => true)
              .catch(() => false);

            if (jsonFileExists) {
              const jsonData = await fs.readFile(jsonFilePath, "utf-8");
              const parsedData = JSON.parse(jsonData);

              if (parsedData.preview) {
                const stat = await fs.stat(jsonFilePath);
                const tags = [
                  ...(parsedData.tags || []),
                  parsedData.type,
                  parsedData.contentrating,
                ].filter(Boolean);

                wallpapers.push({
                  type: "wallpaper-engine",
                  id: path.basename(subdirectoryPath),
                  name: parsedData.title,
                  path: subdirectoryPath,
                  thumbnailPath: "", // Generated later
                  fullSizePath: `image://${path.join(subdirectoryPath, parsedData.preview)}`,
                  dateAdded: stat.mtime.getTime(),
                  workshopId: dirent.name,
                  file: parsedData.file,
                  sceneType: parsedData.type,
                  tags,
                });
              }
            }
          } catch (jsonError) {
            console.error(`Failed to read or parse ${jsonFilePath}:`, jsonError);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading wallpaper engine directory ${folder}:`, error);
    }
  }

  return wallpapers;
};

const filterWallpapers = (
  wallpapers: LibraryWallpaper[],
  query?: string,
  tags?: string[],
  matchAll?: boolean
) => {
  return wallpapers.filter((wallpaper) => {
    const matchesQuery = query ? wallpaper.name.toLowerCase().includes(query.toLowerCase()) : true;

    const matchesTags =
      tags && tags.length > 0
        ? matchAll
          ? tags.every((tag) => wallpaper.tags.includes(tag))
          : tags.some((tag) => wallpaper.tags.includes(tag))
        : true;

    return matchesQuery && matchesTags;
  });
};

const sortWallpapers = (wallpapers: LibraryWallpaper[], sorting: string) => {
  if (sorting === "name") {
    return wallpapers.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  } else if (sorting === "date_added") {
    return wallpapers.sort((a, b) => b.dateAdded - a.dateAdded);
  } else {
    return wallpapers.sort((a, b) => Number(a.id) - Number(b.id));
  }
};

const paginateData = <T extends LibraryWallpaper>(
  data: T[],
  page: number,
  itemsPerPage: number
): WallpaperData<T> => {
  const currentPage = page;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    currentPage,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    totalItems,
    totalPages,
  };
};

export {
  getImageAndVideoWallpapers,
  getWallpaperEngineWallpapers,
  filterWallpapers,
  sortWallpapers,
  paginateData,
};
