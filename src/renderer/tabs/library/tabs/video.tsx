import React from "react";
import { Folder, RefreshCcw, Settings } from "lucide-react";
import WallpapersGrid from "@renderer/components/wallpapers-grid";
import { useCurrentTab } from "@renderer/providers/current-tab-provider";
import { client } from "@renderer/lib/trpc";

const LibraryVideoTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "video:wallpaper-folders",
        },
        title: "Video Library Configuration",
        description: "To browse video wallpapers, you need to add wallpaper folders first.",
        icon: Folder,
        setupInstructions: [
          "Add folders containing videos in the settings",
          "Ensure the folders are accessible by the application",
        ],
        helperText:
          "Add folders containing your wallpapers to browse and manage them from this interface.",
        actions: [
          {
            title: "Open Settings",
            description: "Configure your video library folders",
            icon: Settings,
            variant: "default",
            onClick: () => setCurrentTab("settings"),
          },
          {
            title: "Check Again",
            description: "Refresh the video library to load new wallpapers",
            icon: RefreshCcw,
            variant: "ghost",
            onClick: (refetch) => refetch(),
          },
        ],
      }}
      queryKeys={["library-video"]}
      queryFn={async ({ pageParam, query }) =>
        await client.wallpaper.getWallpapers.query({
          type: "video",
          page: pageParam,
          limit: 20,
          query: query || "",
        })
      }
      sortingOptions={[
        { key: "name", text: "Name" },
        { key: "date_added", text: "Date" },
      ]}
      scalingOptions={[
        { key: "fill", text: "Fill" },
        { key: "fit", text: "Fit" },
        { key: "center", text: "Center" },
        { key: "stretch", text: "Stretch" },
        { key: "tile", text: "Tile" },
      ]}
      controlDefinitions={[
        {
          type: "boolean",
          key: "mute",
          title: "Mute Audio",
          description: "Mute video audio playback",
          defaultValue: false,
        },
      ]}
      onWallpaperApply={async (wallpaper, screens, controlValues) => {
        await client.wallpaper.setWallpaper.mutate({
          type: "video",
          id: wallpaper.id,
          name: wallpaper.name,
          path: wallpaper.path,
          screens,
          videoOptions: controlValues,
        });
      }}
    />
  );
};

export default LibraryVideoTab;
