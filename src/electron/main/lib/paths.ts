import path from "path";
import envPaths from "env-paths";

const paths = envPaths("walltone", {
  suffix: "",
});

const cageScreenshotPath = path.join(paths.temp, "walltone-wallpaper-screenshot.png");
const logFilePath = path.join(paths.log, "app.log");
const thumbnailDir = path.join(paths.cache, "thumbnails");
const wallpapersDownloadPath = path.join(paths.cache, "downloads");

export { cageScreenshotPath, logFilePath, wallpapersDownloadPath, thumbnailDir };
