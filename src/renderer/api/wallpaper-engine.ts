import { BaseWallpaper } from "@electron/main/trpc/routes/theme";

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

interface WallpaperEngineWorkshopSearchParams {
  apiKey: string;
  page: number;
  query?: string;
  tags?: string[];
  sorting?: string;
  matchAll?: boolean;
}

interface WallpaperEngineWorkshopSearchResponse {
  response: {
    total: number;
    publishedfiledetails: WallpaperEngineWorkshopItem[];
  };
}

const transformWallpapers = (wallpapers: WallpaperEngineWorkshopItem[]): BaseWallpaper[] => {
  return wallpapers.map((wallpaper) => ({
    id: wallpaper.publishedfileid,
    name: wallpaper.title,
    previewPath: wallpaper.preview_url,
  }));
};

const wallpaperEngineWorkshopSearch = async (options: WallpaperEngineWorkshopSearchParams) => {
  const itemsPerPage = 100;
  const url = new URL(`https://api.steampowered.com/IPublishedFileService/QueryFiles/v1`);

  const params = new URLSearchParams({
    key: options.apiKey,
    creator_appid: "431960",
    appid: "431960",
    page: `${options.page}`,
    numperpage: `${itemsPerPage}`,
    format: "json",
    return_tags: "true",
    return_vote_data: "true",
    return_previews: "true",
    return_short_description: "true",
    return_metadata: "true",
    return_reactions: "true",
  });

  if (options.query) {
    params.append("search_text", options.query);
  }

  if (options.tags) {
    options.tags.forEach((tagValue, index) => {
      params.append(`requiredtags[${index}]`, tagValue);
    });
  }
  if (options.sorting) {
    params.append("query_type", options.sorting);
  }

  if (options.matchAll !== undefined) {
    params.append("match_all_tags", `${options.matchAll}`);
  }
  url.search = params.toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const data: WallpaperEngineWorkshopSearchResponse = await response.json();
  const numberOfPages = Math.ceil(data.response.total / itemsPerPage);

  return {
    data: data.response.publishedfiledetails
      ? transformWallpapers(data.response.publishedfiledetails)
      : [],
    currentPage: options.page,
    prevPage: options.page > 1 ? options.page - 1 : null,
    nextPage: options.page < numberOfPages ? options.page + 1 : null,
  };
};

const wallpaperEngineWorkshopItemSubscribe = async (id: string, apiKey: string) => {
  const url = new URL(`https://api.steampowered.com/IPublishedFileService/Subscribe/v1`);
  const params = new URLSearchParams({
    key: apiKey,
    publishedfileid: id,
    list_type: "1",
    appid: "431960",
    notify_client: "true",
  });
  url.search = params.toString();

  const response = await fetch(url, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error();
  }

  return await response.json();
};

const wallpaperEngineWorkshopItemUnsubscribe = async (id: string, apiKey: string) => {
  const url = new URL(`https://api.steampowered.com/IPublishedFileService/Unsubscribe/v1`);
  const params = new URLSearchParams({
    key: apiKey,
    publishedfileid: id,
    list_type: "1",
    appid: "431960",
    notify_client: "true",
  });
  url.search = params.toString();

  const response = await fetch(url, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return await response.json();
};

const wallpaperEngineGetTags = () => {
  return [
    {
      type: "boolean",
      title: "matchAll",
    },
    {
      type: "multiple",
      title: "Types",
      values: ["Scene", "Video", "Web", "Application"],
    },
    {
      type: "multiple",
      title: "Age",
      values: ["Everyone", "Questionable", "Mature"],
    },
    {
      type: "multiple",
      title: "Genres",
      values: [
        "Abstract",
        "Animal",
        "Anime",
        "Cartoon",
        "CGI",
        "Cyberpunk",
        "Fantasy",
        "Game",
        "Girls",
        "Guys",
        "Landscape",
        "Medieval",
        "Memes",
        "MMD",
        "Music",
        "Nature",
        "Pixel art",
        "Relaxing",
        "Retro",
        "Sci-Fi",
        "Sports",
        "Technology",
        "Television",
        "Vehicle",
        "Unspecified",
      ],
    },
    {
      type: "multiple",
      title: "Resolutions",
      values: [
        "Standard Definition",
        "1280 x 720",
        "1366 x 768",
        "1920 x 1080",
        "2560 x 1440",
        "3840 x 2160",
        "Ultrawide Standard Definition",
        "Ultrawide 2560 x 1080",
        "Ultrawide 3440 x 1440",
        "Dual Standard Definition",
        "Dual 3840 x 1080",
        "Dual 5120 x 1440",
        "Dual 3840 x 2160",
        "Triple Standard Definition",
        "Triple 4096 x 768",
        "Triple 5760 x 1080",
        "Triple 7680 x 1440",
        "Triple 11520 x 2160",
        "Portrait Standard Definition",
        "Portrait 720 x 1280",
        "Portrait 1080 x 1920",
        "Portrait 1440 x 2560",
        "Portrait 2160 x 3840",
        "Other resolution",
        "Dynamic resolution",
      ],
    },
    {
      type: "multiple",
      title: "Categories",
      values: ["Wallpaper", "Preset", "Asset"],
    },
    {
      type: "multiple",
      title: "Asset Types",
      values: [
        "Particle",
        "Image",
        "Sound",
        "Model",
        "Text",
        "Sprite",
        "Fullscreen",
        "Composite",
        "Script",
        "Effect",
      ],
    },
    {
      type: "multiple",
      title: "Asset Genres",
      values: [
        "Audio Visualizer",
        "Background",
        "Character",
        "Clock",
        "Fire",
        "Interactive",
        "Magic",
        "Post Processing",
        "Smoke",
        "Space",
      ],
    },
    {
      type: "multiple",
      title: "Script Types",
      values: ["Boolean", "Number", "Vec2", "Vec3", "Vec4", "String", "No Animation", "Oversized"],
    },
    {
      type: "multiple",
      title: "Miscellaneous",
      values: [
        "Approved",
        "Audio responsive",
        "Customizable",
        "Puppet Warp",
        "HDR",
        "Video Texture",
        "Asset Pack",
        "Media Integration",
        "3D",
      ],
    },
  ];
};

export {
  wallpaperEngineWorkshopSearch,
  wallpaperEngineWorkshopItemSubscribe,
  wallpaperEngineWorkshopItemUnsubscribe,
  wallpaperEngineGetTags,
};
