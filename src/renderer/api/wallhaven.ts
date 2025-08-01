import { DownloadableWallpaper } from "@electron/main/trpc/routes/theme";

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

interface WallhavenSearchParams {
  query?: string;
  categories?: WallhavenCategory[];
  purity?: WallhavenPurity[];
  sorting?: WallhavenSorting;
  order?: "desc" | "asc";
  topRange?: "1d" | "3d" | "1w" | "1M" | "3M" | "6M" | "1y";
  atleast?: string;
  resolutions?: string[];
  ratios?: string[];
  colors?: string[];
  page: number;
  seed?: string;
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

const wallhavenSearch = async (params: WallhavenSearchParams) => {
  const url = new URL(`https://wallhaven.cc/api/v1/search`);

  if (params.query) url.searchParams.set("q", params.query);
  if (params.categories) url.searchParams.set("categories", convertCategories(params.categories));
  if (params.purity) url.searchParams.set("purity", convertPurity(params.purity));
  if (params.sorting) url.searchParams.set("sorting", params.sorting);
  if (params.order) url.searchParams.set("order", params.order);
  if (params.topRange) url.searchParams.set("topRange", params.topRange);
  if (params.atleast) url.searchParams.set("atleast", params.atleast);
  if (params.resolutions) url.searchParams.set("resolutions", params.resolutions.join(","));
  if (params.ratios) url.searchParams.set("ratios", params.ratios.join(","));
  if (params.colors) url.searchParams.set("colors", params.colors.join(","));
  if (params.page) url.searchParams.set("page", params.page.toString());
  if (params.seed) url.searchParams.set("seed", params.seed);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data: WallhavenSearchResult = await response.json();
  const numberOfPages = Math.ceil(data.meta.total / data.meta.per_page);

  return {
    data: transformWallpaper(data.data),
    currentPage: data.meta.current_page,
    prevPage: data.meta.current_page > 1 ? data.meta.current_page - 1 : null,
    nextPage: data.meta.current_page < numberOfPages ? data.meta.current_page + 1 : null,
  };
};

export { wallhavenSearch };
