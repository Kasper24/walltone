import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { type ApiWallpaper } from "@electron/main/trpc/routes/wallpaper.js";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  full_res: string | null;
  tags: string[];
  url: string;
  image: string;
  avg_color: string | null;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    fps: number;
    link: string;
  }[];
  video_pictures: {
    id: number;
    nr: number;
    picture: string;
  }[];
}

interface PexelsSearchResponse<T> {
  total_results: number;
  page: number;
  per_page: number;
  photos?: T[];
  videos?: T[];
  prev_page?: string;
  next_page?: string;
}

const transformPhotos = (photos: PexelsPhoto[]): ApiWallpaper[] => {
  return photos.map((photo) => ({
    type: "api",
    id: photo.id.toString(),
    name: photo.alt || `Photo by ${photo.photographer}`,
    previewPath: photo.src.large,
    downloadUrl: photo.src.original,
  }));
};

const transformVideos = (videos: PexelsVideo[]): ApiWallpaper[] => {
  return videos.map((video) => {
    // Get the highest quality video file
    const bestVideo = video.video_files.reduce((prev, current) => {
      const prevResolution = prev.width * prev.height;
      const currentResolution = current.width * current.height;
      return currentResolution > prevResolution ? current : prev;
    });

    return {
      type: "api",
      id: video.id.toString(),
      name: `Video by ${video.user.name}`,
      previewPath: video.image,
      downloadUrl: bestVideo.link,
    };
  });
};

const pexelsSearchParamsSchema = z.object({
  type: z.enum(["photos", "videos"]),
  apiKey: z.string().min(1, "API Key is required"),
  query: z.string().optional(),
  page: z.number().min(1),
  perPage: z.number().optional(),
  orientation: z.enum(["landscape", "portrait", "square"]).optional(),
  size: z.enum(["large", "medium", "small"]).optional(),
  color: z
    .enum([
      "red",
      "orange",
      "yellow",
      "green",
      "turquoise",
      "blue",
      "violet",
      "pink",
      "brown",
      "black",
      "gray",
      "white",
    ])
    .optional(),
  locale: z.string().optional(),
});

export const pexelsRouter = router({
  search: publicProcedure.input(pexelsSearchParamsSchema).query(async ({ input }) => {
    const baseUrl =
      input.type === "photos"
        ? "https://api.pexels.com/v1/search"
        : "https://api.pexels.com/videos/search";

    const url = new URL(baseUrl);
    const params = url.searchParams;

    params.set("query", input.query || "wallpaper");
    params.set("page", input.page.toString());
    params.set("per_page", (input.perPage || 30).toString());
    if (input.orientation) params.set("orientation", input.orientation);
    if (input.size) params.set("size", input.size);
    if (input.color) params.set("color", input.color);
    if (input.locale) params.set("locale", input.locale);

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: input.apiKey },
      });
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Pexels API request failed: ${response.statusText}`,
        });

      const data: PexelsSearchResponse<PexelsPhoto | PexelsVideo> = await response.json();
      const numberOfPages = Math.ceil(data.total_results / (input.perPage || 30));

      let transformedData: ApiWallpaper[] = [];
      if (input.type === "photos" && data.photos) {
        transformedData = transformPhotos(data.photos as PexelsPhoto[]);
      } else if (input.type === "videos" && data.videos) {
        transformedData = transformVideos(data.videos as PexelsVideo[]);
      }

      return {
        data: transformedData,
        currentPage: data.page,
        prevPage: data.page > 1 ? data.page - 1 : null,
        nextPage: data.page < numberOfPages ? data.page + 1 : null,
        total: data.total_results,
        totalPages: numberOfPages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Pexels API request failed: ${message}`,
        cause: error,
      });
    }
  }),
});
