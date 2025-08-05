import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "@electron/main/trpc/index.js";
import { type ApiWallpaper } from "@electron/main/trpc/routes/wallpaper.js";

interface UnsplashPhoto {
  id: string;
  created_at: string;
  updated_at: string;
  promoted_at: string | null;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  likes: number;
  liked_by_user: boolean;
  current_user_collections: {
    id: number;
    title: string;
    published_at: string;
    last_collected_at: string;
    updated_at: string;
    cover_photo: string | null;
    user: string | null;
  }[];
  sponsorship: {
    impression_urls: string[];
    tagline: string;
    tagline_url: string;
    sponsor: {
      id: string;
      updated_at: string;
      username: string;
      name: string;
      first_name: string;
      last_name: string | null;
      twitter_username: string | null;
      portfolio_url: string | null;
      bio: string | null;
      location: string | null;
      links: {
        self: string;
        html: string;
        photos: string;
        likes: string;
        portfolio: string;
      };
      profile_image: {
        small: string;
        medium: string;
        large: string;
      };
      instagram_username: string | null;
      total_collections: number;
      total_likes: number;
      total_photos: number;
      total_promoted_photos: number;
      total_illustrations: number;
      total_promoted_illustrations: number;
      accepted_tos: boolean;
      for_hire: boolean;
      social: {
        instagram_username: string | null;
        portfolio_url: string | null;
        twitter_username: string | null;
        paypal_email: string | null;
      };
    };
  };
  topic_submissions: Record<
    string,
    {
      status: string;
    }
  >;
  user: {
    id: string;
    updated_at: string;
    username: string;
    name: string;
    first_name: string;
    last_name: string | null;
    twitter_username: string | null;
    portfolio_url: string | null;
    bio: string | null;
    location: string | null;
    links: {
      self: string;
      html: string;
      photos: string;
      likes: string;
      portfolio: string;
      following: string;
      followers: string;
    };
    profile_image: {
      small: string;
      medium: string;
      large: string;
    };
    instagram_username: string | null;
    total_collections: number;
    total_likes: number;
    total_photos: number;
    accepted_tos: boolean;
    for_hire: boolean;
    social: {
      instagram_username: string | null;
      portfolio_url: string | null;
      twitter_username: string | null;
      paypal_email: string | null;
    };
  };
  tags: {
    type: string;
    title: string;
    source?: {
      ancestry: {
        type: { slug: string; pretty_slug: string };
        category: { slug: string; pretty_slug: string };
        subcategory?: { slug: string; pretty_slug: string };
      };
      title: string;
      subtitle: string;
      description: string;
      meta_title: string;
      meta_description: string;
      cover_photo: UnsplashPhoto;
    };
  }[];
}

interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

const transformWallpapers = (photos: UnsplashPhoto[]): ApiWallpaper[] => {
  return photos.map((photo) => ({
    type: "api",
    id: photo.id,
    name: photo.alt_description || photo.description || `Photo by ${photo.user.name}`,
    previewPath: photo.urls.regular,
    downloadUrl: photo.urls.full,
  }));
};

const unsplashSearchParamsSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  query: z.string(),
  page: z.number().min(1),
  perPage: z.number().min(1).optional().default(30),
  orderBy: z.enum(["relevant", "latest"]).optional().default("relevant"),
  orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
  color: z
    .enum([
      "black_and_white",
      "black",
      "white",
      "yellow",
      "orange",
      "red",
      "purple",
      "magenta",
      "green",
      "teal",
      "blue",
    ])
    .optional(),
});

export const unsplashRouter = router({
  search: publicProcedure.input(unsplashSearchParamsSchema).query(async ({ input }) => {
    const url = new URL("https://api.unsplash.com/search/photos");
    const params = url.searchParams;

    params.set("client_id", input.apiKey);
    params.set("page", input.page.toString());
    params.set("per_page", input.perPage.toString());
    params.set("order_by", input.orderBy);
    params.set("query", input.query || "wallpaper");
    if (input.orientation) params.set("orientation", input.orientation);
    if (input.color) params.set("color", input.color);

    try {
      const response = await fetch(url.toString());
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsplash API request failed: ${response.statusText}`,
        });

      const data: UnsplashSearchResult | UnsplashPhoto[] = await response.json();

      // Normalize the response format
      const photos = Array.isArray(data) ? data : data.results;
      const total = Array.isArray(data) ? photos.length : data.total;
      const totalPages = Array.isArray(data) ? Infinity : data.total_pages;

      return {
        data: photos ? transformWallpapers(photos) : [],
        currentPage: input.page,
        prevPage: input.page > 1 ? input.page - 1 : null,
        nextPage: input.page < totalPages ? input.page + 1 : null,
        total,
        totalPages,
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
