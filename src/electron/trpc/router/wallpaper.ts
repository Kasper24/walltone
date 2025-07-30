import path from "path";
import { promises as fs } from "fs";
import { execute, killProcess, santize } from "../lib";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "..";
import { caller } from "./base";

const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"];
const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mkv", ".webm", ".avi", ".mov"];

export interface BaseWallpaper {
  id: string;
  name: string;
  previewPath: string;
}

export interface DownloadableWallpaper extends BaseWallpaper {
  downloadUrl: string;
}

export interface LibraryWallpaper extends BaseWallpaper {
  type: "image" | "video" | "wallpaper-engine";
  path: string;
  dateAdded: number;
  tags: string[];
}

export interface WallpaperData {
  data: BaseWallpaper[];
  currentPage: number;
  prevPage: number | null;
  nextPage: number | null;
}

export const wallpaperRouter = router({
  getWallpapers: publicProcedure
    .input(
      z.object({
        type: z.enum(["image", "video", "wallpaper-engine", "all"]),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).default(10),
        query: z.string().optional(),
        sorting: z.enum(["name", "date_added", "id"]).default("name"),
        tags: z.array(z.string()).optional(),
        matchAll: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const wallpapers: LibraryWallpaper[] = [];

      if (input.type === "image" || input.type === "all") {
        const imageWallpapers = await getMediaWallpapers(
          "image",
          "image:wallpaper-folders",
          SUPPORTED_IMAGE_EXTENSIONS
        );
        wallpapers.push(...imageWallpapers);
      }

      if (input.type === "video" || input.type === "all") {
        const videoWallpapers = await getMediaWallpapers(
          "video",
          "video:wallpaper-folders",
          SUPPORTED_VIDEO_EXTENSIONS
        );
        wallpapers.push(...videoWallpapers);
      }

      if (input.type === "wallpaper-engine" || input.type === "all") {
        const weWallpapers = await getWallpaperEngineWallpapers();
        wallpapers.push(...weWallpapers);
      }

      const filteredWallpapers = filterWallpapers(
        wallpapers,
        input.query,
        input.tags,
        input.matchAll
      );
      const sortedWallpapers = sortWallpapers(filteredWallpapers, input.sorting);

      return paginateData(sortedWallpapers, input.page, input.limit);
    }),

  setWallpaper: publicProcedure
    .input(
      z.object({
        type: z.enum(["image", "video", "wallpaper-engine"]),
        id: z.string().min(1),
        name: z.string().min(1),
        path: z.string().min(1),
        monitors: z
          .array(
            z.object({
              name: z.string().min(1),
              scalingMethod: z.string().optional(),
            })
          )
          .min(1),
        wallpaperEngineOptions: z
          .object({
            silent: z.boolean().optional(),
            volume: z.number().min(0).max(100).optional(),
            noAutomute: z.boolean().optional(),
            noAudioProcessing: z.boolean().optional(),
            fps: z.number().min(1).max(200).optional(),
            clamping: z.enum(["clamp", "border", "repeat"]).optional(),
            disableMouse: z.boolean().optional(),
            disableParallax: z.boolean().optional(),
            noFullscreenPause: z.boolean().optional(),
          })
          .optional(),
        videoOptions: z
          .object({
            mute: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      killProcess("swaybg");
      killProcess("mpvpaper");
      killProcess("linux-wallpaperengine");
      // Wait for processes to terminate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ensure the directory for the wallpaper exists
      const outputPath = await getOutputPath(input.name, input.id);
      const wallpaperOutputPath = path.join(outputPath, "wallpaper.png");
      await fs.mkdir(outputPath, { recursive: true });

      switch (input.type) {
        case "image":
          await setImageWallpaper(wallpaperOutputPath, input.path, input.monitors);
          break;
        case "video":
          await setVideoWallpaper(
            wallpaperOutputPath,
            input.path,
            input.monitors,
            input.videoOptions
          );
          break;
        case "wallpaper-engine":
          await setWallpaperEngineWallpaper(
            wallpaperOutputPath,
            input.path,
            input.monitors,
            input.wallpaperEngineOptions
          );
          break;
      }
    }),

  setTheme: publicProcedure
    .input(
      z.object({
        wallpaper: z.any(),
        theme: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const folderPath = await getOutputPath(input.wallpaper.name, input.wallpaper.id);
      const themePath = path.join(folderPath, "theme.json");

      try {
        // Ensure the directory for the theme exists
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(
          themePath,
          JSON.stringify(
            {
              name: santize(input.wallpaper.name),
              wallpaper: {
                path: "wallpaper.png",
                backend: input.wallpaper.type,
                ...(input.wallpaper.type === "wallpaper-engine" && {
                  workshopId: input.wallpaper.workshopId,
                  file: input.wallpaper.file,
                  type: input.wallpaper.sceneType,
                }),
              },
              colors: input.theme,
            },
            null,
            2
          ),
          "utf8"
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error writing file to ${themePath}: ${errorMessage}`,
          cause: error,
        });
      }
    }),
});

const paginateData = (
  data: LibraryWallpaper[],
  page: number,
  itemsPerPage: number
): WallpaperData => {
  const currentPage = page;
  const totalItems = data.length;
  const numberOfPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    currentPage,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: currentPage < numberOfPages ? currentPage + 1 : null,
  };
};

const getOutputPath = async (name: string, id: string) => {
  const outputPath = (await caller.settings.get({
    key: "theme:output-path",
  })) as string;
  if (!outputPath) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Theme output path is not set.",
    });
  }

  const sanitized = santize(`${name}-${id}`);
  return path.join(outputPath, sanitized);
};

const getMediaWallpapers = async (
  mediaType: "image" | "video",
  settingsKey: string,
  fileTypes: string[]
) => {
  const wallpapers: LibraryWallpaper[] = [];
  const folders = (await caller.settings.get({
    key: settingsKey as any,
  })) as string[];

  if (!folders || !Array.isArray(folders) || folders.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No ${mediaType} folders configured.`,
    });
  }

  for (const folder of folders) {
    try {
      const files = await searchForFiles(folder, fileTypes);
      await Promise.all(
        files.map(async (file) => {
          wallpapers.push({
            id: path.basename(file.path),
            name: file.name,
            path: file.path,
            previewPath: mediaType !== "video" ? `image://${file.path}` : `video://${file.path}`,
            dateAdded: Date.now(),
            tags: [mediaType],
            type: mediaType,
          });
        })
      );
    } catch (error) {
      console.error(`Failed to search ${mediaType} files in ${folder}:`, error);
    }
  }

  return wallpapers;
};

const searchForFiles = async (
  folderPath: string,
  fileTypes: string[]
): Promise<{ name: string; path: string }[]> => {
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
  const wallpapers: LibraryWallpaper[] = [];
  const folders = (await caller.settings.get({
    key: "wallpaper-engine:wallpaper-folders",
  })) as string[];
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
                  previewPath: `image://${path.join(subdirectoryPath, parsedData.preview)}`,
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

const setImageWallpaper = async (
  wallpaperOutputPath: string,
  imagePath: string,
  monitors: { name: string; scalingMethod?: string }[]
) => {
  await fs.copyFile(imagePath, wallpaperOutputPath);

  await Promise.all(
    monitors.map(async (monitor) => {
      const args = [
        "--image",
        imagePath,
        "--output",
        monitor.name,
        "--mode",
        monitor.scalingMethod || "crop",
      ];
      await execute({ command: "swaybg", args });
    })
  );
};

const setVideoWallpaper = async (
  wallpaperOutputPath: string,
  videoPath: string,
  monitors: { name: string; scalingMethod?: string }[],
  options?: {
    mute?: boolean;
  }
) => {
  // Build mpv options array
  const mpvOptions: string[] = ["loop"];

  // Add video-specific options
  if (options?.mute) {
    mpvOptions.push("no-audio");
  }

  // Add scaling options for each monitor
  monitors.forEach((monitor) => {
    if (monitor.scalingMethod) {
      switch (monitor.scalingMethod) {
        case "fill":
          mpvOptions.push("panscan=1.0");
          break;
        case "fit":
          mpvOptions.push("panscan=0.0");
          break;
        case "stretch":
          mpvOptions.push("keepaspect=no");
          break;
        case "center":
        case "tile":
          // These don't have specific mpv options
          break;
      }
    }
  });

  const args = [];

  // Add mpv options if any exist
  if (mpvOptions.length > 0) {
    args.push("-o", mpvOptions.join(" "));
  }

  // Add monitor names (use ALL if multiple monitors, otherwise specific monitor)
  if (monitors.length === 1) {
    args.push(monitors[0].name);
  } else {
    args.push("ALL");
  }

  // Add video path
  args.push(videoPath);

  await screenshotWallpaperInCage(["mpv", "panscan=1.0", videoPath], wallpaperOutputPath);
  await execute({ command: "mpvpaper", args });
};

const setWallpaperEngineWallpaper = async (
  wallpaperOutputPath: string,
  wallpaperPath: string,
  monitors: { name: string; scalingMethod?: string }[],
  options?: {
    silent?: boolean;
    volume?: number;
    noAutomute?: boolean;
    noAudioProcessing?: boolean;
    fps?: number;
    clamping?: string;
    disableMouse?: boolean;
    disableParallax?: boolean;
    noFullscreenPause?: boolean;
  }
) => {
  const assetsPath = await caller.settings.get({
    key: "wallpaper-engine:assets-folder",
  });
  if (!assetsPath)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Wallpaper Engine assets folder is not set.",
    });

  const args = [
    ...monitors.flatMap((monitor) => [
      "--screen-root",
      monitor.name,
      "--bg",
      wallpaperPath,
      "--scaling",
      monitor.scalingMethod || "default",
    ]),
    "--assets-dir",
    assetsPath,
  ];

  // Add Wallpaper Engine specific options
  if (options?.silent) {
    args.push("--silent");
  }

  if (options?.volume !== undefined) {
    args.push("--volume", options.volume.toString());
  }

  if (options?.noAutomute) {
    args.push("--noautomute");
  }

  if (options?.noAudioProcessing) {
    args.push("--no-audio-processing");
  }

  if (options?.fps !== undefined) {
    args.push("--fps", options.fps.toString());
  }

  if (options?.clamping) {
    args.push("--clamping", options.clamping);
  }

  if (options?.disableMouse) {
    args.push("--disable-mouse");
  }

  if (options?.disableParallax) {
    args.push("--disable-parallax");
  }

  if (options?.noFullscreenPause) {
    args.push("--no-fullscreen-pause");
  }

  await screenshotWallpaperInCage(
    [
      "linux-wallpaperengine",
      "--silent",
      "--fps",
      "1",
      "--assets-dir",
      assetsPath,
      "--window",
      "0x0x1280x720",
      wallpaperPath,
    ],
    wallpaperOutputPath
  );
  await execute({ command: "linux-wallpaperengine", args });
};

const screenshotWallpaperInCage = async (cmd: string[], wallpaperOutputPath: string) => {
  const INIT_TIME = 5;
  const args = [
    "--",
    "sh",
    "-c",
    `${cmd.join(" ")} & pid=$!; sleep ${INIT_TIME} && grim -g "0,0 1280x720" ${wallpaperOutputPath} && kill $pid`,
  ];
  await execute({ command: "cage", args, env: { WLR_BACKENDS: "headless" } });
};
