import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { type ApiWallpaper } from "@electron/main/trpc/routes/wallpaper/types.js";

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  fullHDURL?: string;
  imageURL?: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface PixabayVideoVariant {
  url: string;
  width: number;
  height: number;
  size: number;
  thumbnail: string;
}

export interface PixabayVideo {
  type: "all" | "film" | "animation";
  id: number;
  pageURL: string;
  tags: string;
  duration: number;
  videos: {
    large: PixabayVideoVariant;
    medium: PixabayVideoVariant;
    small: PixabayVideoVariant;
    tiny: PixabayVideoVariant;
  };
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface PixabaySearchResponse<T> {
  total: number;
  totalHits: number;
  hits: T[];
}

function transformPixabayImages(photos: PixabayImage[]): ApiWallpaper[] {
  return photos.map((photo) => ({
    type: "image",
    id: String(photo.id),
    name: photo.tags || `Pixabay Image ${photo.id}`,
    thumbnailPath: photo.largeImageURL,
    fullSizePath: photo.largeImageURL,
    downloadUrl: photo.largeImageURL,
  }));
}

function transformPixabayVideos(videos: PixabayVideo[]): ApiWallpaper[] {
  return videos.map((video) => {
    const best =
      video.videos.large.url ||
      video.videos.medium.url ||
      video.videos.small.url ||
      video.videos.tiny.url;
    return {
      type: "video",
      id: String(video.id),
      name: video.tags || `Pixabay Video ${video.id}`,
      thumbnailPath: video.videos.small.thumbnail,
      fullSizePath: best,
      downloadUrl: best,
    };
  });
}

const pixabaySearchParamsSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  query: z.string().default("wallpaper"),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(200).default(30),
  type: z.enum(["image", "video"]).default("image"),
  colors: z
    .enum([
      "grayscale",
      "transparent",
      "red",
      "orange",
      "yellow",
      "green",
      "turquoise",
      "blue",
      "lilac",
      "pink",
      "white",
      "gray",
      "black",
      "brown",
    ])
    .optional(),
  imageType: z.enum(["all", "photo", "illustration", "vector"]).optional(),
  videoType: z.enum(["all", "film", "animation"]).optional(),
  orientation: z.enum(["all", "horizontal", "vertical"]).optional(),
  category: z
    .enum([
      "backgrounds",
      "fashion",
      "nature",
      "science",
      "education",
      "feelings",
      "health",
      "people",
      "religion",
      "places",
      "animals",
      "industry",
      "computer",
      "food",
      "sports",
      "transportation",
      "travel",
      "buildings",
      "business",
      "music",
    ])
    .optional(),
  order: z.enum(["popular", "latest"]).optional(),
  minWidth: z.number().optional(),
  minHeight: z.number().optional(),
  editorsChoice: z.boolean().optional(),
  safeSearch: z.boolean().optional(),
});

export const pixabayRouter = router({
  search: publicProcedure.input(pixabaySearchParamsSchema).query(async ({ input }) => {
    const isImage = input.type === "image";
    const endpoint = isImage ? "https://pixabay.com/api/" : "https://pixabay.com/api/videos/";

    const url = new URL(endpoint);
    url.searchParams.set("key", input.apiKey);
    url.searchParams.set("q", input.query);
    url.searchParams.set("page", input.page.toString());
    url.searchParams.set("per_page", input.perPage.toString());
    if (input.colors) url.searchParams.set("colors", input.colors);
    if (input.imageType && isImage) url.searchParams.set("image_type", input.imageType);
    if (input.videoType && !isImage) url.searchParams.set("video_type", input.videoType);
    if (input.orientation) url.searchParams.set("orientation", input.orientation);
    if (input.category) url.searchParams.set("category", input.category);
    if (input.order) url.searchParams.set("order", input.order);
    if (input.minWidth) url.searchParams.set("min_width", input.minWidth.toString());
    if (input.minHeight) url.searchParams.set("min_height", input.minHeight.toString());
    if (input.editorsChoice)
      url.searchParams.set("editors_choice", input.editorsChoice ? "true" : "false");
    if (input.safeSearch) url.searchParams.set("safesearch", input.safeSearch ? "true" : "false");

    try {
      const response = await fetch(url.toString());
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pixabay API request failed: ${response.statusText}`,
        });

      const data: PixabaySearchResponse<PixabayImage | PixabayVideo> = await response.json();
      const hits = data.hits || [];
      const totalItems = data.totalHits || 0;
      const totalPages = Math.ceil(totalItems / input.perPage);

      return {
        data: isImage
          ? transformPixabayImages(hits as PixabayImage[])
          : transformPixabayVideos(hits as PixabayVideo[]),
        currentPage: input.page,
        prevPage: input.page > 1 ? input.page - 1 : null,
        nextPage: input.page < totalPages ? input.page + 1 : null,
        totalItems,
        totalPages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Pixabay API request failed: ${message}`,
        cause: error,
      });
    }
  }),
});
