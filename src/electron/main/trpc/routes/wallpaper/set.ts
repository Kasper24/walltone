import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { TRPCError } from "@trpc/server";
import { execute, killProcess, santize, renderString } from "@electron/main/lib/index.js";
import { caller } from "@electron/main/trpc/routes/index.js";
import { type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";
import { SetWallpaperInput } from "./types.js";

const VIDEO_INIT_TIME = 1;
const WALLPAPER_ENGINE_INIT_TIME = 5;
const CAGE_SCREENSHOT_PATH = "/tmp/walltone-wallpaper-screenshot.png";
const WALLPAPERS_DOWNLOAD_CACHE_DIR = path.join(
  os.homedir(),
  ".cache",
  "walltone",
  "wallpapers-downloads"
);

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

const downloadRemoteWallpaper = async (input: SetWallpaperInput) => {
  await fs.mkdir(WALLPAPERS_DOWNLOAD_CACHE_DIR, { recursive: true });

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
  const downloadPath = path.join(WALLPAPERS_DOWNLOAD_CACHE_DIR, `${input.id}${ext}`);

  if (!ext) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `File type '${ext}' is not allowed.`,
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(downloadPath, Buffer.from(arrayBuffer));

  return downloadPath;
};

const getMonitors = async () => {
  return (await caller.monitor.search()).map((monitor) => ({
    id: monitor.id,
  }));
};

const killWallpaperProcesses = async () => {
  await killProcess("swaybg");
  await killProcess("mpvpaper");
  await killProcess("linux-wallpaperengine");
};

const saveLastWallpaper = async (input: SetWallpaperInput) => {
  await caller.settings.set({
    key: "internal.lastWallpaper",
    value: Object.fromEntries(input.monitors.map((monitor) => [monitor.id, input])),
  });
};

const screenshotWallpaper = async (input: SetWallpaperInput) => {
  if (input.type === "image") {
    await copyWallpaperToDestinations(input.id, input.name, input.applyPath);
  } else if (input.type === "video") {
    await screenshotWallpaperInCage(["mpv", "panscan=1.0", input.applyPath], VIDEO_INIT_TIME);
    await copyWallpaperToDestinations(input.id, input.name, CAGE_SCREENSHOT_PATH);
  } else if (input.type === "wallpaper-engine") {
    const assetsPath = await caller.settings.get({
      key: "wallpaperSources.wallpaperEngineAssetsFolder",
    });

    if (typeof assetsPath !== "string" || !assetsPath) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Wallpaper Engine assets folder is not set.",
      });
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
        input.applyPath,
      ],
      WALLPAPER_ENGINE_INIT_TIME
    );
    await copyWallpaperToDestinations(input.id, input.name, CAGE_SCREENSHOT_PATH);
  }
};

const setWallpaper = async (input: SetWallpaperInput, detached: boolean) => {
  if (input.type === "image") {
    await setImageWallpaper(input.applyPath, input.monitors, detached);
  } else if (input.type === "video") {
    await setVideoWallpaper(input.applyPath, input.monitors, input.videoOptions, detached);
  } else if (input.type === "wallpaper-engine") {
    const assetsPath = await caller.settings.get({
      key: "wallpaperSources.wallpaperEngineAssetsFolder",
    });

    if (typeof assetsPath !== "string" || !assetsPath) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Wallpaper Engine assets folder is not set.",
      });
    }

    await setWallpaperEngineWallpaper(
      assetsPath,
      input.applyPath,
      input.monitors,
      input.wallpaperEngineOptions,
      detached
    );
  }
};

const setImageWallpaper = async (
  imagePath: string,
  monitors: { id: string; scalingMethod?: string }[],
  detached: boolean
) => {
  const args: string[] = [];

  monitors.forEach((monitor) => {
    args.push(
      "--output",
      monitor.id,
      "--image",
      imagePath,
      "--mode",
      monitor.scalingMethod || "crop"
    );
  });

  await execute({ command: "swaybg", args, detached, logStdout: false });
};

const setVideoWallpaper = async (
  videoPath: string,
  monitors: { id: string; scalingMethod?: string }[],
  options?: {
    mute?: boolean;
  },
  detached?: boolean
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
    args.push(monitors[0].id);
  } else {
    args.push("ALL");
  }

  // Add video path
  args.push(videoPath);

  await execute({ command: "mpvpaper", args, detached, logStdout: false });
};

const setWallpaperEngineWallpaper = async (
  assetsPath: string,
  wallpaperPath: string,
  monitors: { id: string; scalingMethod?: string }[],
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
  },
  detached?: boolean
) => {
  const args = [
    ...monitors.flatMap((monitor) => [
      "--screen-root",
      monitor.id,
      "--bg",
      wallpaperPath,
      "--scaling",
      monitor.scalingMethod || "default",
    ]),
    "--assets-dir",
    assetsPath,
  ];

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

  await execute({
    command: "linux-wallpaperengine",
    args,
    detached,
    logStdout: false,
  });
};

const screenshotWallpaperInCage = async (cmd: string[], delay: number) => {
  const args = [
    "--",
    "sh",
    "-c",
    `${cmd.join(" ")} & pid=$!; sleep ${delay} && grim -g "0,0 1280x720" ${CAGE_SCREENSHOT_PATH} && kill $pid`,
  ];
  await execute({ command: "cage", args, env: { WLR_BACKENDS: "headless" } });
};

const copyWallpaperToDestinations = async (
  wallpaperId: string,
  wallpaperName: string,
  wallpaperPath: string
) => {
  const wallpaperDestinations = (await caller.settings.get({
    key: "themeOutput.wallpaperCopyDestinations",
  })) as SettingsSchema["themeOutput"]["wallpaperCopyDestinations"];

  await Promise.all(
    wallpaperDestinations.map(async (destination) => {
      destination = await renderString(destination, {
        wallpaper: {
          id: santize(wallpaperId),
          name: santize(wallpaperName),
        },
      });
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(wallpaperPath, destination);
    })
  );
};

export {
  downloadRemoteWallpaper,
  getMonitors,
  saveLastWallpaper,
  killWallpaperProcesses,
  screenshotWallpaper,
  setWallpaper,
};
