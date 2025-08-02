import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { type DownloadableWallpaper } from "@electron/main/trpc/routes/theme.js";

export type WallhavenSorting = "date_added" | "random" | "views" | "favorites" | "toplist";
export type WallhavenCategory = "general" | "anime" | "people";
export type WallhavenPurity = "sfw" | "sketchy" | "nsfw";

interface WallhavenWallpaper {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: string;
  category: string;
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string;
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
}

interface WallhavenSearchResult {
  data: WallhavenWallpaper[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    query: string | null;
    seed: string | null;
  };
}

const convertCategories = (categories: WallhavenCategory[]): string => {
  const general = categories.includes("general");
  const anime = categories.includes("anime");
  const people = categories.includes("people");
  return `${general ? "1" : "0"}${anime ? "1" : "0"}${people ? "1" : "0"}`;
};

const convertPurity = (purity: WallhavenPurity[]): string => {
  const sfw = purity.includes("sfw");
  const sketchy = purity.includes("sketchy");
  const nsfw = purity.includes("nsfw");
  return `${sfw ? "1" : "0"}${sketchy ? "1" : "0"}${nsfw ? "1" : "0"}`;
};

const transformWallpaper = (wallpapers: WallhavenWallpaper[]): DownloadableWallpaper[] => {
  return wallpapers.map((wallpaper) => ({
    id: wallpaper.id,
    name: wallpaper.id,
    previewPath: wallpaper.thumbs.large,
    downloadUrl: wallpaper.path,
  }));
};

const wallhavenSearchParamsSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.enum(["general", "anime", "people"])).optional(),
  purity: z.array(z.enum(["sfw", "sketchy", "nsfw"])).optional(),
  sorting: z.enum(["date_added", "random", "views", "favorites", "toplist"]).optional(),
  order: z.enum(["desc", "asc"]).optional(),
  topRange: z.enum(["1d", "3d", "1w", "1M", "3M", "6M", "1y"]).optional(),
  atleast: z.string().optional(),
  resolutions: z.array(z.string()).optional(),
  ratios: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  page: z.number().min(1),
  seed: z.string().optional(),
});

export const wallhavenRouter = router({
  search: publicProcedure.input(wallhavenSearchParamsSchema).query(async ({ input }) => {
    const url = new URL(`https://wallhaven.cc/api/v1/search`);
    const params = url.searchParams;

    if (input.query) params.set("q", input.query);
    if (input.categories) params.set("categories", convertCategories(input.categories));
    if (input.purity) params.set("purity", convertPurity(input.purity));
    if (input.sorting) params.set("sorting", input.sorting);
    if (input.order) params.set("order", input.order);
    if (input.topRange) params.set("topRange", input.topRange);
    if (input.atleast) params.set("atleast", input.atleast);
    if (input.resolutions) params.set("resolutions", input.resolutions.join(","));
    if (input.ratios) params.set("ratios", input.ratios.join(","));
    if (input.colors) params.set("colors", input.colors.join(","));
    if (input.page) params.set("page", input.page.toString());
    if (input.seed) params.set("seed", input.seed);

    try {
      const response = await fetch(url.toString());
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Wallhaven API request failed: ${response.statusText}`,
        });

      const data: WallhavenSearchResult = await response.json();
      const totalPages = Math.ceil(data.meta.total / data.meta.per_page);

      return {
        data: transformWallpaper(data.data),
        currentPage: data.meta.current_page,
        prevPage: data.meta.current_page > 1 ? data.meta.current_page - 1 : null,
        nextPage: data.meta.current_page < totalPages ? data.meta.current_page + 1 : null,
        total: data.meta.total,
        totalPages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Wallhaven API request failed: ${message}`,
        cause: error,
      });
    }
  }),
});
