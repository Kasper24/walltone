import path from "path";
import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import { getBuildConfig, getBuildDefine, external, pluginHotRestart } from "./vite.base.config.js";

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"build">;
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry!,
        fileName: () => "main.js",
        formats: ["es"],
      },
      rollupOptions: {
        external,
        input: {
          main: path.resolve(__dirname, "src/electron/main/index.ts"),
          ["theme-generator"]: path.resolve(
            __dirname,
            "src/electron/main/trpc/routes/theme/generator/index.ts"
          ),
        },
        output: {
          entryFileNames: "[name].js",
          format: "esm",
        },
      },
    },
    plugins: [pluginHotRestart("restart")],
    define,
    resolve: {
      // Load the Node.js entry.
      mainFields: ["module", "jsnext:main", "jsnext"],
      preserveSymlinks: true,
      alias: {
        "@electron": path.resolve(__dirname, "./src/electron"),
      },
    },
  };
  return mergeConfig(getBuildConfig(forgeEnv), config);
});
