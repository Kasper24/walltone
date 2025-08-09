import ExplorePexelsImagesTab from "@renderer/pages/explore/pexels-images.js";
import ExplorePexelsVideosTab from "@renderer/pages/explore/pexels-videos.js";
import ExplorePixabayImagesTab from "@renderer/pages/explore/pixabay-images.js";
import ExplorePixabayVideosTab from "@renderer/pages/explore/pixabay-videos.js";
import ExploreUnsplashTab from "@renderer/pages/explore/unsplash.js";
import ExploreWallhavenTab from "@renderer/pages/explore/wallhaven.js";
import ExploreWallpaperEngineTab from "@renderer/pages/explore/wallpaper-engine.js";
import LibraryImageTab from "@renderer/pages/library/image.js";
import LibraryVideoTab from "@renderer/pages/library/video.js";
import LibraryWallpaperEngineTab from "@renderer/pages/library/wallpaper-engine.js";
import SettingsTab from "@renderer/pages/settings/index.js";

export const routes = {
  discoverPexelsImages: {
    path: "/discover/pexels-images" as const,
    element: <ExplorePexelsImagesTab />,
  },
  discoverPexelsVideos: {
    path: "/discover/pexels-videos" as const,
    element: <ExplorePexelsVideosTab />,
  },
  discoverPixabayImages: {
    path: "/discover/pixabay-images" as const,
    element: <ExplorePixabayImagesTab />,
  },
  discoverPixabayVideos: {
    path: "/discover/pixabay-videos" as const,
    element: <ExplorePixabayVideosTab />,
  },
  discoverUnsplash: {
    path: "/discover/unsplash" as const,
    element: <ExploreUnsplashTab />,
  },
  discoverWallhaven: {
    path: "/discover/wallhaven" as const,
    element: <ExploreWallhavenTab />,
  },
  discoverWallpaperEngine: {
    path: "/discover/wallpaper-engine" as const,
    element: <ExploreWallpaperEngineTab />,
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
