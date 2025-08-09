import DiscoverPexelsImagesTab from "@renderer/pages/discover/pexels-images.js";
import DiscoverPexelsVideosTab from "@renderer/pages/discover/pexels-videos.js";
import DiscoverPixabayImagesTab from "@renderer/pages/discover/pixabay-images.js";
import DiscoverPixabayVideosTab from "@renderer/pages/discover/pixabay-videos.js";
import DiscoverUnsplashTab from "@renderer/pages/discover/unsplash.js";
import DiscoverWallhavenTab from "@renderer/pages/discover/wallhaven.js";
import DiscoverWallpaperEngineTab from "@renderer/pages/discover/wallpaper-engine.js";
import LibraryImageTab from "@renderer/pages/library/image.js";
import LibraryVideoTab from "@renderer/pages/library/video.js";
import LibraryWallpaperEngineTab from "@renderer/pages/library/wallpaper-engine.js";
import SettingsTab from "@renderer/pages/settings/index.js";

export const routes = {
  discoverPexelsImages: {
    path: "/discover/pexels-images" as const,
    element: <DiscoverPexelsImagesTab />,
  },
  discoverPexelsVideos: {
    path: "/discover/pexels-videos" as const,
    element: <DiscoverPexelsVideosTab />,
  },
  discoverPixabayImages: {
    path: "/discover/pixabay-images" as const,
    element: <DiscoverPixabayImagesTab />,
  },
  discoverPixabayVideos: {
    path: "/discover/pixabay-videos" as const,
    element: <DiscoverPixabayVideosTab />,
  },
  discoverUnsplash: {
    path: "/discover/unsplash" as const,
    element: <DiscoverUnsplashTab />,
  },
  discoverWallhaven: {
    path: "/discover/wallhaven" as const,
    element: <DiscoverWallhavenTab />,
  },
  discoverWallpaperEngine: {
    path: "/discover/wallpaper-engine" as const,
    element: <DiscoverWallpaperEngineTab />,
  },
  libraryImages: {
    path: "/library/images" as const,
    element: <LibraryImageTab />,
  },
  libraryVideos: {
    path: "/library/videos" as const,
    element: <LibraryVideoTab />,
  },
  libraryWallpaperEngine: {
    path: "/library/wallpaper-engine" as const,
    element: <LibraryWallpaperEngineTab />,
  },
  settings: {
    path: "/settings" as const,
    element: <SettingsTab />,
  },
};
