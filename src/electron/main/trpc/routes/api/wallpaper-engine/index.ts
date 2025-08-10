import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/types.js";
import logger from "@electron/main/lib/logger.js";

interface WallpaperEngineWorkshopItem {
  result: number;
  publishedfileid: string;
  creator: string;
  creator_appid: number;
  consumer_appid: number;
  consumer_shortcutid: number;
  filename: string;
  file_size: string;
  preview_file_size: string;
  preview_url: string;
  url: string;
  hcontent_file: string;
  hcontent_preview: string;
  title: string;
  short_description: string;
  time_created: number;
  time_updated: number;
  visibility: number;
  flags: number;
  workshop_file: boolean;
  workshop_accepted: boolean;
  show_subscribe_all: boolean;
  num_comments_public: number;
  banned: boolean;
  ban_reason: string;
  banner: string;
  can_be_deleted: boolean;
  app_name: string;
  file_type: number;
  can_subscribe: boolean;
  subscriptions: number;
  favorited: number;
  followers: number;
  lifetime_subscriptions: number;
  lifetime_favorited: number;
  lifetime_followers: number;
  lifetime_playtime: string;
  lifetime_playtime_sessions: string;
  views: number;
  num_children: number;
  num_reports: number;
  tags: {
    tag: string;
    display_name: string;
  }[];
  vote_data: {
    score: number;
    votes_up: number;
    votes_down: number;
  };
  language: number;
  maybe_inappropriate_sex: boolean;
  maybe_inappropriate_violence: boolean;
  content_descriptorids?: number[];
  revision_change_number: string;
  revision: number;
  ban_text_check_result: number;
}

interface WallpaperEngineWorkshopSearchResponse {
  response: {
    total: number;
    publishedfiledetails: WallpaperEngineWorkshopItem[];
  };
}

const transformWallpapers = (wallpapers: WallpaperEngineWorkshopItem[]): BaseWallpaper[] => {
  return wallpapers.map((wallpaper) => ({
    type: "image",
    id: wallpaper.publishedfileid,
    name: wallpaper.title,
    thumbnailPath: wallpaper.preview_url,
    fullSizePath: wallpaper.preview_url,
  }));
};

const searchSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  page: z.number().min(1),
  perPage: z.number().min(1).default(100),
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sorting: z.string().optional(),
  matchAll: z.boolean().optional(),
});

const subscriptionSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  id: z.string().min(1, "Item ID is required"),
});

export const wallpaperEngineRouter = router({
  search: publicProcedure.input(searchSchema).query(async ({ input }) => {
    logger.info({ input }, "wallpaperEngine.search: start");
    const url = new URL("https://api.steampowered.com/IPublishedFileService/QueryFiles/v1");
    const params = url.searchParams;
    params.set("key", input.apiKey);
    params.set("creator_appid", "431960");
    params.set("appid", "431960");
    params.set("page", input.page.toString());
    params.set("numperpage", input.perPage.toString());
    params.set("format", "json");
    params.set("return_tags", "true");
    params.set("return_previews", "true");
    params.set("return_short_description", "true");
    if (input.query) params.set("search_text", input.query);
    if (input.tags) {
      input.tags.forEach((tag, index) => params.append(`requiredtags[${index}]`, tag));
    }
    if (input.sorting) params.set("query_type", input.sorting);
    if (input.matchAll !== undefined) params.set("match_all_tags", `${input.matchAll}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error(
          { input, status: response.status, statusText: response.statusText },
          "wallpaperEngine.search: api error"
        );
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pexels API request failed: ${response.statusText}`,
        });
      }
      const data: WallpaperEngineWorkshopSearchResponse = await response.json();
      const numberOfPages = Math.ceil(data.response.total / input.perPage);
      logger.info(
        { input, total: data.response.publishedfiledetails?.length },
        "wallpaperEngine.search: success"
      );
      return {
        data: data.response.publishedfiledetails
          ? transformWallpapers(data.response.publishedfiledetails)
          : [],
        currentPage: input.page,
        prevPage: input.page > 1 ? input.page - 1 : null,
        nextPage: input.page < numberOfPages ? input.page + 1 : null,
        totalItems: data.response.total,
        totalPages: numberOfPages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error({ input, error: message }, "wallpaperEngine.search: failed");
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message, cause: error });
    }
  }),

  subscribe: publicProcedure.input(subscriptionSchema).mutation(async ({ input }) => {
    const url = new URL("https://api.steampowered.com/IPublishedFileService/Subscribe/v1/");
    const params = url.searchParams;

    params.set("key", input.apiKey);
    params.set("publishedfileid", input.id);
    params.set("list_type", "1");
    params.set("appid", "431960");
    params.set("notify_client", "true");

    try {
      const response = await fetch(url, { method: "POST", body: params });
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pexels API request failed: ${response.statusText}`,
        });
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message, cause: error });
    }
  }),

  unsubscribe: publicProcedure.input(subscriptionSchema).mutation(async ({ input }) => {
    const url = new URL("https://api.steampowered.com/IPublishedFileService/Unsubscribe/v1/");
    const params = url.searchParams;

    params.set("key", input.apiKey);
    params.set("publishedfileid", input.id);
    params.set("list_type", "1");
    params.set("appid", "431960");
    params.set("notify_client", "true");

    try {
      const response = await fetch(url, { method: "POST", body: params });
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pexels API request failed: ${response.statusText}`,
        });
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message, cause: error });
    }
  }),
});
