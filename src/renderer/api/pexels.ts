import { DownloadableWallpaper } from "@electron/trpc/router/wallpaper";

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
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    fps: number;
    link: string;
  }>;
  video_pictures: Array<{
    id: number;
    nr: number;
    picture: string;
  }>;
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

interface PexelsSearchParams {
  apiKey: string;
  query?: string;
  page: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
  color?:
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "turquoise"
    | "blue"
    | "violet"
    | "pink"
    | "brown"
    | "black"
    | "gray"
    | "white";
  locale?: string;
}

const transformPhotos = (photos: PexelsPhoto[]): DownloadableWallpaper[] => {
  return photos.map((photo) => ({
    id: photo.id.toString(),
    name: photo.alt || `Photo by ${photo.photographer}`,
    previewPath: photo.src.large,
    downloadUrl: photo.src.original,
  }));
};

const transformVideos = (videos: PexelsVideo[]): DownloadableWallpaper[] => {
  return videos.map((video) => {
    // Get the highest quality video file
    const bestVideo = video.video_files.reduce((prev, current) => {
      const prevResolution = prev.width * prev.height;
      const currentResolution = current.width * current.height;
      return currentResolution > prevResolution ? current : prev;
    });

    return {
      id: video.id.toString(),
      name: `Video by ${video.user.name}`,
      previewPath: video.image,
      downloadUrl: bestVideo.link,
    };
  });
};

const pexelsPhotosSearch = async (params: PexelsSearchParams) => {
  params.query = params.query || "wallpaper";

  const url = new URL("https://api.pexels.com/v1/search");

  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    per_page: (params.perPage || 30).toString(),
  });

  if (params.query) searchParams.append("query", params.query);
  if (params.orientation) searchParams.append("orientation", params.orientation);
  if (params.size) searchParams.append("size", params.size);
  if (params.color) searchParams.append("color", params.color);
  if (params.locale) searchParams.append("locale", params.locale);

  url.search = searchParams.toString();

  const response = await fetch(url, {
    headers: {
      Authorization: params.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  const data: PexelsSearchResponse<PexelsPhoto> = await response.json();
  const numberOfPages = Math.ceil(data.total_results / (params.perPage || 30));

  return {
    data: data.photos ? transformPhotos(data.photos) : [],
    currentPage: data.page,
    prevPage: data.page > 1 ? data.page - 1 : null,
    nextPage: data.page < numberOfPages ? data.page + 1 : null,
    total: data.total_results,
    totalPages: numberOfPages,
  };
};

const pexelsVideosSearch = async (params: PexelsSearchParams) => {
  params.query = params.query || "wallpaper";

  const url = new URL("https://api.pexels.com/videos/search");

  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    per_page: (params.perPage || 30).toString(),
  });

  if (params.query) searchParams.append("query", params.query);
  if (params.orientation) searchParams.append("orientation", params.orientation);
  if (params.size) searchParams.append("size", params.size);
  if (params.locale) searchParams.append("locale", params.locale);

  url.search = searchParams.toString();

  const response = await fetch(url, {
    headers: {
      Authorization: params.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  const data: PexelsSearchResponse<PexelsVideo> = await response.json();
  const numberOfPages = Math.ceil(data.total_results / (params.perPage || 30));

  return {
    data: data.videos ? transformVideos(data.videos) : [],
    currentPage: data.page,
    prevPage: data.page > 1 ? data.page - 1 : null,
    nextPage: data.page < numberOfPages ? data.page + 1 : null,
    total: data.total_results,
    totalPages: numberOfPages,
  };
};

export { pexelsPhotosSearch, pexelsVideosSearch };
