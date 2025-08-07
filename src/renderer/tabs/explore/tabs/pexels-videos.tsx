import { ExternalLink, Key, RefreshCcw, Settings } from "lucide-react";
import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { client } from "@renderer/lib/trpc.js";

const ExplorePexelsVideosTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "apiKeys.pexels",
          decrypt: true,
        },
        title: "Pexels API Key Required",
        description: "To browse Pexels wallpapers, you need to configure your API key first.",
        icon: Key,
        helperText:
          "API keys are free and only take a few minutes to set up. They help identify your application and prevent abuse of the service.",
        setupInstructions: [
          "Visit the Pexels api key page and create a new API key",
          "Copy your Access Key and paste it in the settings",
        ],
        actions: [
          {
            title: "Get Pexels API Key",
            description: "Opens in new window",
            icon: ExternalLink,
            variant: "default",
            onClick: () => window.open("https://www.pexels.com/api/key/", "_blank"),
          },
          {
            title: "Open Settings",
            description: "Refresh the image library to load new wallpapers",
            icon: Settings,
            variant: "outline",
            onClick: () => setCurrentTab("settings"),
          },
          {
            title: "Check Again",
            description: "Refresh to load new wallpapers",
            icon: RefreshCcw,
            variant: "ghost",
            onClick: (refresh) => refresh(),
          },
        ],
      }}
      queryKeys={[`wallpapers.explore.pexelsVideos`]}
      queryFn={async ({ pageParam, query, appliedFilters, configValue }) =>
        await client.api.pexels.search.query({
          type: "videos",
          apiKey: configValue!,
          page: pageParam,
          query,
          ...appliedFilters?.strings,
        })
      }
      filterDefinitions={[
        {
          type: "single",
          title: "orientation",
          values: ["landscape", "portrait", "square"],
        },
        {
          type: "single",
          title: "size",
          values: ["small", "medium", "large"],
        },
      ]}
      onWallpaperDownload={async (wallpaper) => {
        await client.file.download.mutate({
          url: wallpaper.downloadUrl,
        });
      }}
    />
  );
};

export default ExplorePexelsVideosTab;
