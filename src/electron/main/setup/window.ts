import path from "path";
import { app, BrowserWindow } from "electron";

const isProduction = process.env.NODE_ENV === "production" || app.isPackaged;

const createWindow = () => {
  const iconPath = path.join(import.meta.dirname, "..", "..", "assets", "icon.png");
  const mainWindow = new BrowserWindow({
    icon: iconPath,
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: "hidden",
    webPreferences: {
      devTools: !isProduction,
      contextIsolation: true,
      sandbox: true,
      allowRunningInsecureContent: false,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: true,
      webSecurity: true,
      preload: path.join(import.meta.dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(import.meta.dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  return mainWindow;
};

export { createWindow };
