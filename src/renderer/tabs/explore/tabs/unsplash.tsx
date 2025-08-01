import { ExternalLink, Key, RefreshCcw, Settings } from "lucide-react";
import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { useCurrentTab } from "@renderer/providers/current-tab-provider.js";
import { client } from "@renderer/lib/trpc.js";
import { unsplashSearch } from "@renderer/api/unsplash.js";

const ExploreUnsplashTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "unsplash.apiKey",
        },
        title: "Unsplash API Key Required",
        description: "To browse Unsplash wallpapers, you need to configure your API key first.",
        icon: Key,
        helperText:
          "API keys are free and only take a few minutes to set up. They help identify your application and prevent abuse of the service.",
        setupInstructions: [
          "Visit the Unsplash application page and create an application",
          "Copy your Access Key and paste it in the settings",
        ],
        actions: [
          {
            title: "Get Unsplash API Key",
            description: "Opens in new window",
            icon: ExternalLink,
            variant: "default",
            onClick: () => window.open("https://unsplash.com/developers", "_blank"),
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
      queryKeys={[`explore-unsplash`]}
      queryFn={async ({ pageParam, query, sorting, appliedFilters, configValue }) =>
        await unsplashSearch({
          apiKey: configValue,
          page: pageParam,
          query,
          orderBy: sorting as any,
          ...appliedFilters?.strings,
        })
      }
      sortingOptions={[
        { key: "latest", text: "Date added" },
        { key: "relevant", text: "Relevant" },
      ]}
      filterDefinitions={[
        {
          type: "single",
          title: "orientation",
          values: ["landscape", "portrait", "squarish"],
        },
        {
          type: "single",
          title: "color",
          values: [
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
          ],
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

export default ExploreUnsplashTab;
