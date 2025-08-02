import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

const config: ForgeConfig = {
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
        "electron-store": "^10.1.0",
        keytar: "^7.9.0",
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
  packagerConfig: {
    executableName: "walltone",
    asar: true,
    icon: "/assets/icon",
    electronZipDir: process.env.ELECTRON_FORGE_ELECTRON_ZIP_DIR,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "/assets/icon.png",
        },
      },
    },
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
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
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
