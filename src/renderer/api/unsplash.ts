import { type DownloadableWallpaper } from "@electron/main/trpc/routes/theme.js";

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
  current_user_collections: any[];
  sponsorship: any;
  topic_submissions: Record<string, any>;
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
  tags: Array<{
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
  }>;
}

interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

const transformPhotos = (photos: UnsplashPhoto[]): DownloadableWallpaper[] => {
  return photos.map((photo) => ({
    id: photo.id,
    name: photo.alt_description || photo.description || `Photo by ${photo.user.name}`,
    previewPath: photo.urls.regular,
    downloadUrl: photo.urls.full,
  }));
};

export const unsplashSearch = async ({
  apiKey,
  query,
  page = 1,
  perPage = 30,
  orderBy = "relevant",
  orientation,
  color,
}: {
  apiKey: string;
  query: string;
  page?: number;
  perPage?: number;
  orderBy?: "relevant" | "latest";
  orientation?: "landscape" | "portrait" | "squarish";
  color?:
    | "black_and_white"
    | "black"
    | "white"
    | "yellow"
    | "orange"
    | "red"
    | "purple"
    | "magenta"
    | "green"
    | "teal"
    | "blue";
}) => {
  query = query || "wallpaper";

  const params = new URLSearchParams({
    client_id: apiKey,
    page: page.toString(),
    per_page: perPage.toString(),
    order_by: orderBy,
  });

  if (query) params.append("query", query);
  if (orientation) params.append("orientation", orientation);
  if (color) params.append("color", color);

  const url = `https://api.unsplash.com/search/photos?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`);
  }

  const data: UnsplashSearchResult | UnsplashPhoto[] = await response.json();

  // Normalize the response format
  const photos = Array.isArray(data) ? data : data.results;
  const total = Array.isArray(data) ? photos.length : data.total;
  const totalPages = Array.isArray(data) ? Infinity : data.total_pages;

  return {
    data: photos ? transformPhotos(photos) : [],
    currentPage: page,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
    total,
    totalPages,
  };
};
