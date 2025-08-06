import { Folder, RefreshCcw, Settings } from "lucide-react";
import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { client } from "@renderer/lib/trpc.js";

const LibraryImageTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "wallpaperSources.imageFolders",
        },
        title: "Image Library Configuration",
        description: "To browse image wallpapers, you need to add wallpaper folders first.",
        icon: Folder,
        setupInstructions: [
          "Add folders containing images in the settings",
          "Ensure the folders are accessible by the application",
        ],
        helperText:
          "Add folders containing your wallpapers to browse and manage them from this interface.",
        actions: [
          {
            title: "Open Settings",
            description: "Configure your image library folders",
            icon: Settings,
            variant: "default",
            onClick: () => setCurrentTab("settings"),
          },
          {
            title: "Check Again",
            description: "Refresh the image library to load new wallpapers",
            icon: RefreshCcw,
            variant: "ghost",
            onClick: (refetch) => refetch(),
          },
        ],
      }}
      queryKeys={["library-image"]}
      queryFn={async ({ pageParam, query }) =>
        await client.wallpaper.search.query({
          type: "image",
          page: pageParam,
          query: query || "",
        })
      }
      sortingOptions={[
        { key: "name", text: "Name" },
        { key: "date_added", text: "Date" },
      ]}
      scalingOptions={[
        { key: "stretch", text: "Stretch" },
        { key: "fit", text: "Fit" },
        { key: "fill", text: "Fill" },
        { key: "center", text: "Center" },
        { key: "tile", text: "Tile" },
      ]}
      onWallpaperApply={async (wallpaper, monitors) => {
        await client.wallpaper.set.mutate({
          type: "image",
          id: wallpaper.id,
          name: wallpaper.name,
          path: wallpaper.path,
          monitors,
        });
      }}
    />
  );
};

export default LibraryImageTab;
