import React from "react";
import { ExternalLink, Key, RefreshCcw, Settings } from "lucide-react";
import { useCurrentTab } from "@renderer/providers/current-tab-provider";
import WallpapersGrid from "@renderer/components/wallpapers-grid";
import {
  wallpaperEngineWorkshopSearch,
  wallpaperEngineWorkshopItemSubscribe,
  wallpaperEngineGetTags,
} from "@renderer/api/wallpaper-engine";
import { client } from "@renderer/lib/trpc";

const ExploreWallpaperEngineTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "wallpaper-engine:api-key",
        },
        title: "Wallpaper Engine API Key Required",
        description: "To browse Unsplash wallpapers, you need to configure your API key first.",
        icon: Key,
        helperText:
          "API keys are free and only take a few minutes to set up. They help identify your application and prevent abuse of the service.",
        setupInstructions: [
          "Visit the steam API key page",
          "Copy your Access Key and paste it in the settings",
        ],
        actions: [
          {
            title: "Get Wallpaper Engine API Key",
            description: "Opens in new window",
            icon: ExternalLink,
            variant: "default",
            onClick: () => window.open("https://steamcommunity.com/dev/apikey", "_blank"),
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
      queryKeys={[`explore-wallpaper-engine`]}
      queryFn={async ({ pageParam, query, sorting, appliedFilters, configValue }) => {
        const tags = Object.entries(appliedFilters?.arrays || {}).flatMap(([_, values]) => values);

        return await wallpaperEngineWorkshopSearch({
          apiKey: configValue as string,
          page: pageParam,
          query,
          sorting,
          tags,
          matchAll: appliedFilters?.booleans.matchall,
        });
      }}
      sortingOptions={[
        { key: "0", text: "Vote" },
        { key: "1", text: "Date" },
        { key: "3", text: "Trend" },
        { key: "9", text: "Subscriptions" },
      ]}
      filterDefinitions={wallpaperEngineGetTags() as any}
      onWallpaperDownload={async (wallpaper) => {
        const apiKey = (await client.settings.get.query({
          key: "wallpaper-engine:api-key",
        })) as string;
        await wallpaperEngineWorkshopItemSubscribe(wallpaper.id, apiKey as string);
      }}
    />
  );
};

export default ExploreWallpaperEngineTab;
