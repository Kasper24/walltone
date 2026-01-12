import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    executableName: "walltone",
    ignore: [],
    asar: {
      unpack: "**/node_modules/{sharp,@img,keytar,conf}/**/*"
    },
    icon: "assets/icon",
    electronZipDir: process.env.ELECTRON_FORGE_ELECTRON_ZIP_DIR,
  },
  makers: [
    new MakerDeb({
      options: {
        name: "walltone",
        version: "0.0.1",
        productName: "Walltone",
        description: "Wallpaper and theme management application",
        homepage: "https://github.com/kasper24/walltone",
        icon: "assets/icon.png",
        categories: ["Utility"],
        depends: [
          "nss",
          "libsecret-1-0",
          "swaybg",
          "mpvpaper",
          "linux-wallpaperengine",
          "cage",
          "grim",
          "ffmpeg",
        ],
      },
    }),
    new MakerRpm({
      options: {
        name: "walltone",
        version: "0.0.1",
        productName: "Walltone",
        description: "Wallpaper and theme management application",
        license: "GPL-3.0",
        group: "Utility",
        homepage: "https://github.com/kasper24/walltone",
        icon: "assets/icon.png",
        categories: ["Utility"],
        requires: ["nss", "libsecret", "swaybg", "mpvpaper", "cage", "grim", "ffmpeg"],
      },
    }),
    new MakerZIP({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/electron/main/index.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "src/electron/preload/index.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
