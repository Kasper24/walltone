import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

const config: ForgeConfig = {
  packagerConfig: {
    executableName: "walltone",
    asar: true,
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
  hooks: {
    // Workaround for https://github.com/serialport/node-serialport/issues/2464
    packageAfterPrune: async (_, buildPath) => {
      if (process.env.NIX_BUILD_TOP) {
        // Skip in Nix builds
        return;
      }

      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(buildPath, "package.json")).toString()
      );
      packageJson.dependencies = {
        conf: "^14.0.0",
        keytar: "^7.9.0",
        sharp: "^0.34.3",
      };
      fs.writeFileSync(path.resolve(buildPath, "package.json"), JSON.stringify(packageJson));

      return new Promise((resolve, reject) => {
        const npm = spawn("npm", ["install"], {
          cwd: buildPath,
          stdio: "inherit",
          shell: true,
        });

        npm.on("close", (code) => {
          if (0 === code) {
            resolve();
            return;
          }

          reject(`Process exited with code: ${code}`);
        });

        npm.on("error", reject);
      });
    },
  },
};

export default config;
