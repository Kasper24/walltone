import path from "path";
import { promises as fs } from "fs";
import { Worker } from "worker_threads";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { color } from "chroma.ts";
import { execute, santize, renderString } from "@electron/main/lib/index.js";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { caller } from "@electron/main/trpc/routes/index.js";
import { type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";

const hexColor = () => z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format");

const base16VariantSchema = z.object({
  base00: hexColor(),
  base01: hexColor(),
  base02: hexColor(),
  base03: hexColor(),
  base04: hexColor(),
  base05: hexColor(),
  base06: hexColor(),
  base07: hexColor(),
  base08: hexColor(),
  base09: hexColor(),
  base0A: hexColor(),
  base0B: hexColor(),
  base0C: hexColor(),
  base0D: hexColor(),
  base0E: hexColor(),
  base0F: hexColor(),
});

const materialVariantSchema = z.object({
  primary: hexColor(),
  onPrimary: hexColor(),
  primaryContainer: hexColor(),
  onPrimaryContainer: hexColor(),
  secondary: hexColor(),
  onSecondary: hexColor(),
  secondaryContainer: hexColor(),
  onSecondaryContainer: hexColor(),
  tertiary: hexColor(),
  onTertiary: hexColor(),
  tertiaryContainer: hexColor(),
  onTertiaryContainer: hexColor(),
  error: hexColor(),
  onError: hexColor(),
  errorContainer: hexColor(),
  onErrorContainer: hexColor(),
  background: hexColor(),
  onBackground: hexColor(),
  surface: hexColor(),
  onSurface: hexColor(),
  surfaceVariant: hexColor(),
  onSurfaceVariant: hexColor(),
  outline: hexColor(),
  outlineVariant: hexColor(),
  shadow: hexColor(),
  scrim: hexColor(),
  inverseSurface: hexColor(),
  inverseOnSurface: hexColor(),
  inversePrimary: hexColor(),
});

const themeSchema = z.object({
  base16: z.object({
    dark: base16VariantSchema,
    light: base16VariantSchema,
  }),
  material: z.object({
    dark: materialVariantSchema,
    light: materialVariantSchema,
  }),
});

const generateSchema = z.object({
  imageSrc: z.string(),
});

const setSchema = z.object({
  wallpaper: z.any(),
  theme: themeSchema,
});

export type ThemeType = "base16" | "material";
export type ThemePolarity = "dark" | "light";
export type Theme = z.infer<typeof themeSchema>;

function themeToChroma<T>(theme: T): T {
  if (typeof theme === "string" && /^#[0-9a-fA-F]{6}$/.test(theme)) {
    const c = color(theme);
    c.toString = () => c.hex();
    return c as unknown as T;
  }

  if (Array.isArray(theme)) {
    return theme.map((item) => themeToChroma(item)) as unknown as T;
  }

  if (typeof theme === "object" && theme !== null) {
    const result = {} as { [K in keyof T]: T[K] };
    for (const key in theme) {
      if (Object.prototype.hasOwnProperty.call(theme, key)) {
        result[key as keyof T] = themeToChroma(theme[key as keyof T]);
      }
    }
    return result as T;
  }

  return theme;
}

export const themeRouter = router({
  generate: publicProcedure
    .input(generateSchema)
    .output(themeSchema)
    .query(async ({ input }) => {
      const imageSrc = input.imageSrc.replace("image://", "").replace("video://", "");
      const quantizeLibrary = await caller.settings.get({
        key: "themeGeneration.quantizeLibrary",
      });
      const base16Settings = await caller.settings.get({ key: "themeGeneration.base16" });

      return await new Promise((resolve, reject) => {
        const workerPath = path.join(import.meta.dirname, "theme-generator.js");
        const worker = new Worker(workerPath);

        worker.on("message", (event) => {
          const result = event.data;
          if (event.status === "success") {
            resolve(result);
          } else {
            reject(new Error(result?.error || "Worker failed with an unknown error."));
          }
          worker.terminate();
        });

        worker.on("error", (error) => {
          reject(error);
          worker.terminate();
        });

        worker.postMessage({ imageSrc, quantizeLibrary, base16Settings });
      });
    }),

  set: publicProcedure.input(setSchema).mutation(async ({ input }) => {
    const templates = (await caller.settings.get({
      key: "themeOutput.templates",
    })) as SettingsSchema["themeOutput"]["templates"];

    if (!templates)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Templates are not set.",
      });

    await Promise.all(
      templates.map(async (tpl) => {
        if (!tpl.src || !tpl.dest) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid template configuration: ${JSON.stringify(tpl)}`,
          });
        }

        try {
          const content = await fs.readFile(tpl.src, "utf-8");
          const rendered = await renderString(content, {
            wallpaper: {
              ...input.wallpaper,
              id: santize(input.wallpaper.id),
              name: santize(input.wallpaper.name),
            },
            theme: themeToChroma(input.theme),
          });

          try {
            const destination = await renderString(tpl.dest, {
              wallpaper: {
                ...input.wallpaper,
                id: santize(input.wallpaper.id),
                name: santize(input.wallpaper.name),
              },
              theme: themeToChroma(input.theme),
            });
            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.writeFile(destination, rendered, "utf-8");

            if (tpl.postHook) {
              try {
                const postHook = await renderString(tpl.postHook, {
                  wallpaper: {
                    ...input.wallpaper,
                    id: santize(input.wallpaper.id),
                    name: santize(input.wallpaper.name),
                  },
                  theme: themeToChroma(input.theme),
                });
                const [cmd, ...args] = postHook.split(" ");
                await execute({ command: cmd, args, shell: true });
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : "Unknown error occurred";
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: `Error running post-hook command: ${tpl.postHook}: ${errorMessage}`,
                  cause: error,
                });
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Error writing file to ${tpl.dest}: ${errorMessage}`,
              cause: error,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Error reading template file ${tpl.src}: ${errorMessage}`,
            cause: error,
          });
        }
      })
    );
  }),
});
