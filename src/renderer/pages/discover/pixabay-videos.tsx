import { ExternalLink, Key, RefreshCcw, Settings } from "lucide-react";
import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { client } from "@renderer/lib/trpc.js";

const DiscoverPixabayVideosTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "apiKeys.pixabay",
          decrypt: true,
        },
        title: "Pixabay API Key Required",
        description: "To browse Pixabay wallpapers, you need to configure your API key first.",
        icon: Key,
        helperText:
          "API keys are free and only take a few minutes to set up. They help identify your application and prevent abuse of the service.",
        setupInstructions: [
          "Visit the Pixabay api key page and create a new API key",
          "Copy your Access Key and paste it in the settings",
        ],
        actions: [
          {
            title: "Get Pixabay API Key",
            description: "Opens in new window",
            icon: ExternalLink,
            variant: "default",
            onClick: () => window.open("https://pixabay.com/api/docs/", "_blank"),
          },
          {
            title: "Open Settings",
            description: "Refresh the image library to load new wallpapers",
            icon: Settings,
            variant: "outline",
            onClick: () => setCurrentTab("/settings"),
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
      queryKeys={[`wallpapers.discover.pixabayVideos`]}
      queryFn={async ({ pageParam, query, appliedFilters, configValue }) =>
        await client.api.pixabay.search.query({
          type: "video",
          apiKey: configValue!,
          page: pageParam,
          query,
          ...appliedFilters?.booleans,
          ...appliedFilters?.strings,
        })
      }
      filterDefinitions={[
        {
          type: "single",
          key: "videoType",
          title: "Video Type",
          values: ["all", "film", "animation"],
        },
        {
          type: "single",
          key: "orientation",
          title: "Orientation",
          values: ["all", "horizontal", "vertical"],
        },
        {
          type: "single",
          key: "category",
          title: "Category",
          values: [
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
          ],
        },
        {
          type: "single",
          key: "colors",
          title: "Colors",
          values: [
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
          ],
        },
        {
          type: "boolean",
          key: "editorsChoice",
          title: "Editors Choice",
        },
        {
          type: "boolean",
          key: "safeSearch",
          title: "Safe Search",
        },
        {
          type: "single",
          key: "order",
          title: "Order",
          values: ["popular", "latest"],
        },
      ]}
      onWallpaperApply={async (wallpaper, monitors) => {
        await client.wallpaper.set.mutate({
          type: "video",
          id: wallpaper.id,
          name: wallpaper.name,
          applyPath: wallpaper.downloadUrl,
          monitors,
        });
      }}
    />
  );
};

export default DiscoverPixabayVideosTab;
