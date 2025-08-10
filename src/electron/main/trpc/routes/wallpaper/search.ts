import path from "path";
import { promises as fs } from "fs";
import { TRPCError } from "@trpc/server";
import { caller } from "@electron/main/trpc/routes/index.js";
import logger from "@electron/main/lib/logger.js";

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
      logger.info({ type, folder }, `Searching for ${type} files in folder: ${folder}`);
      const files = await searchForFiles(folder, WALLPAPERS_TYPE_TO_EXTS[type]);
      logger.info(
        { type, folder, fileCount: files.length },
        `Found ${files.length} ${type} files in folder: ${folder}`
      );
      files.forEach(async (file) => {
        wallpapers.push({
          id: path.basename(file.path, path.extname(file.path)),
          name: file.name,
          applyPath: file.path,
          thumbnailPath: "", // Generated later
          fullSizePath: `${type}://${file.path}`,
          dateAdded: Date.now(),
          tags: [type],
          type: type,
        });
        logger.debug({ type, folder, file: file.path }, `Added wallpaper: ${file.name}`);
      });
      logger.info({ type, folder }, `Completed processing for folder: ${folder}`);
    } catch (error) {
      logger.error({ err: error, type, folder }, `Failed to search ${type} files in ${folder}`);
      logger.info({ folder }, `Skipping to next folder after error in: ${folder}`);
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
                  applyPath: subdirectoryPath,
                  thumbnailPath: "", // Generated later
                  fullSizePath: `image://${path.join(subdirectoryPath, parsedData.preview)}`,
                  dateAdded: stat.mtime.getTime(),
                  workshopId: dirent.name,
                  sceneFile: parsedData.file,
                  sceneType: parsedData.type,
                  tags,
                });
                logger.debug(
                  { subdirectoryPath, jsonFilePath, title: parsedData.title },
                  `Added Wallpaper Engine wallpaper: ${parsedData.title}`
                );
              }
            }
          } catch (jsonError) {
            logger.error(
              { err: jsonError, jsonFilePath, dir: subdirectoryPath },
              `Failed to read or parse project.json for wallpaper engine item in ${subdirectoryPath}`
            );
          }
        }
      }
    } catch (error) {
      logger.error({ err: error, folder }, `Error reading wallpaper engine directory ${folder}`);
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

const paginateData = <TWallpaper extends LibraryWallpaper>(
  data: TWallpaper[],
  page: number,
  itemsPerPage: number
): WallpaperData<TWallpaper> => {
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
