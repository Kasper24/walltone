import path from "path";
import {
  app,
  protocol,
  net,
  Tray,
  Menu,
  nativeImage,
  BrowserWindow,
  globalShortcut,
} from "electron";
import { createIPCHandler } from "electron-trpc-experimental/main";
import { appRouter } from "@electron/main/trpc/routes/base";

let isQuitting = false;
let mainWindow: BrowserWindow;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "video",
    privileges: {
      bypassCSP: true,
      standard: true,
      stream: true,
    },
  },
]);

const createWindow = () => {
  protocol.handle("image", async (request) => {
    const filePath = request.url.replace(`image://`, "file://");
    return await net.fetch(filePath);
  });

  protocol.registerFileProtocol("video", (req, callback) => {
    const pathToMedia = decodeURI(req.url.replace("video://", ""));
    callback(pathToMedia);
  });

  mainWindow = new BrowserWindow({
    icon: "/assets/icon-monochrome.png",
    width: 800,
    height: 600,
    webPreferences: {
      // devTools: process.env.NODE_ENV === "development",
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webSecurity: false,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "hidden",
  });
  createTray(mainWindow);

  createIPCHandler({ router: appRouter, windows: [mainWindow] });

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

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

const createTray = (mainWindow: BrowserWindow) => {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "..", "..", "assets", "icon-monochrome.png")
  );
  const tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Quit",
      click: function () {
        app.exit();
      },
    },
  ]);
  tray.setTitle("Walltone");
  tray.setToolTip("Walltone");
  tray.setContextMenu(contextMenu);
};

export const getMainWindow = () => {
  if (!mainWindow) {
    throw new Error("Main window is not created yet.");
  }
  return mainWindow;
};

app.whenReady().then(createWindow);

app.on("before-quit", function () {
  isQuitting = true;
});

if (require("electron-squirrel-startup")) {
  app.quit();
}
