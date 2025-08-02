import path from "path";
import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";

const createTray = (mainWindow: BrowserWindow) => {
  const icon = nativeImage.createFromPath(
    path.join(import.meta.dirname, "..", "..", "assets", "icon.png")
  );

  const tray = new Tray(icon);
  tray.setTitle("Walltone");
  tray.setToolTip("Walltone");

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
  tray.setContextMenu(contextMenu);
};

export { createTray };
