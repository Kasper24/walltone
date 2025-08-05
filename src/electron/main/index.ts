import { app, BrowserWindow, globalShortcut } from "electron";
import { createIPCHandler } from "electron-trpc-experimental/main";
import { appRouter, caller } from "@electron/main/trpc/routes/base.js";
import { registerProtocols } from "./setup/protocols.js";
import { createTray } from "./setup/tray.js";
import { createWindow } from "./setup/window.js";

let isQuitting = false;

const initializeApp = async () => {
  const mainWindow = createWindow();
  createTray(mainWindow);

  createIPCHandler({ router: appRouter, windows: [mainWindow] });

  await caller.wallpaper.restoreOnStart();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", function (event) {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  globalShortcut.register("CommandOrControl+C", () => {
    mainWindow.webContents.copy();
  });

  globalShortcut.register("CommandOrControl+V", () => {
    mainWindow.webContents.paste();
  });
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  // Someone tried to run a second instance; we should focus our window.
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on("activate", () => {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  mainWindow?.show();
});

app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  contents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
});

app.on("before-quit", function () {
  isQuitting = true;
});

registerProtocols();

app.whenReady().then(initializeApp);
