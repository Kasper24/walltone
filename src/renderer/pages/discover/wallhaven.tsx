import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { client } from "@renderer/lib/trpc.js";
import { WallhavenSorting } from "@electron/main/trpc/routes/api/wallhaven/index.js";

const DiscoverWallhavenTab = () => {
  return (
    <WallpapersGrid
      queryKeys={[`wallpapers.discover.wallhaven`]}
      queryFn={async ({ pageParam, query, sorting, appliedFilters }) =>
        await client.api.wallhaven.search.query({
          page: pageParam,
          query,
          sorting: sorting as WallhavenSorting,
          ...appliedFilters?.arrays,
        })
      }
      sortingOptions={[
        { key: "date_added", text: "Date added" },
        { key: "random", text: "Random" },
        { key: "views", text: "Views" },
        { key: "favorites", text: "Favorites" },
        { key: "toplist", text: "Toplist" },
      ]}
      filterDefinitions={[
        {
          type: "multiple",
          key: "categories",
          title: "Categories",
          values: ["general", "anime", "people"],
        },
        {
          type: "multiple",
          key: "purity",
          title: "Purity",
          values: ["sfw", "sketchy"],
        },
        {
          type: "multiple",
          key: "resolutions",
          title: "Resolutions",
          values: ["1920x1080", "2560x1440", "3840x2160", "5120x2880", "7680x4320", "10240x5760"],
        },
        {
          type: "multiple",
          key: "ratios",
          title: "Ratios",
          values: ["16:9", "16:10", "4:3", "21:9", "32:9"],
        },
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
          applyPath: wallpaper.downloadUrl,
          monitors,
        });
      }}
    />
  );
};

export default DiscoverWallhavenTab;
