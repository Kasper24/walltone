import path from "path";
import { promises as fs } from "fs";
import { TRPCError } from "@trpc/server";
import { execute, killProcess, santize, renderString } from "@electron/main/lib/index.js";
import { caller } from "@electron/main/trpc/routes/index.js";
import { type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";
import { cageScreenshotPath } from "@electron/main/lib/paths.js";
import { type SetWallpaperInput } from "./types.js";
import { eventsEmitter } from "@electron/main/trpc/index.js";

const VIDEO_INIT_TIME = 1;
const WALLPAPER_ENGINE_INIT_TIME = 5;

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
    await copyWallpaperToDestinations(input.id, input.name, cageScreenshotPath);
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
    await copyWallpaperToDestinations(input.id, input.name, cageScreenshotPath);
  }
};

const setWallpaper = async (input: SetWallpaperInput) => {
  try {
    if (input.type === "image") {
      await setImageWallpaper(input.applyPath, input.monitors);
    } else if (input.type === "video") {
      await setVideoWallpaper(input.applyPath, input.monitors, input.videoOptions);
    } else if (input.type === "wallpaper-engine") {
      await setWallpaperEngineWallpaper(
        input.applyPath,
        input.monitors,
        input.wallpaperEngineOptions
      );
    }
  } catch (error) {
    eventsEmitter.emit("wallpaper-error", { error });
  }
};

const setImageWallpaper = async (
  imagePath: string,
  monitors: { id: string; scalingMethod?: string }[]
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

  await execute({ command: "swaybg", args, detached: true, logStdout: false });
};

const setVideoWallpaper = async (
  videoPath: string,
  monitors: { id: string; scalingMethod?: string }[],
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
    args.push(monitors[0].id);
  } else {
    args.push("ALL");
  }

  // Add video path
  args.push(videoPath);

  await execute({ command: "mpvpaper", args, detached: true, logStdout: false });
};

const setWallpaperEngineWallpaper = async (
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
  }
) => {
  const assetsPath = await caller.settings.get({
    key: "wallpaperSources.wallpaperEngineAssetsFolder",
  });

  if (typeof assetsPath !== "string" || !assetsPath) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Wallpaper Engine assets folder is not set.",
    });
  }

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
    detached: true,
    logStdout: false,
  });
};

const screenshotWallpaperInCage = async (cmd: string[], delay: number) => {
  await fs.mkdir(path.dirname(cageScreenshotPath), { recursive: true });

  await execute({
    command: "cage",
    args: [
      "--",
      "sh",
      "-c",
      `${cmd.join(" ")} & pid=$!; sleep ${delay} && grim -g "0,0 1280x720" ${cageScreenshotPath} && kill $pid`,
    ],
    env: { WLR_BACKENDS: "headless" },
  });
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
  getMonitors,
  saveLastWallpaper,
  killWallpaperProcesses,
  screenshotWallpaper,
  setWallpaper,
};
