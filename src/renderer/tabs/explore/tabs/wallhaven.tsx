import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { wallhavenSearch, WallhavenSorting } from "@renderer/api/wallhaven.js";
import { client } from "@renderer/lib/trpc.js";

const ExploreWallhavenTab = () => {
  return (
    <WallpapersGrid
      queryKeys={[`explore-wallhaven`]}
      queryFn={async ({ pageParam, query, sorting, appliedFilters }) =>
        await wallhavenSearch({
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
          title: "Categories",
          values: ["general", "anime", "people"],
        },
        {
          type: "multiple",
          title: "Purity",
          values: ["sfw", "sketchy"],
        },
        {
          type: "multiple",
          title: "Resolutions",
          values: ["1920x1080", "2560x1440", "3840x2160", "5120x2880", "7680x4320", "10240x5760"],
        },
        {
          type: "multiple",
          title: "Ratios",
          values: ["16:9", "16:10", "4:3", "21:9", "32:9"],
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

export default ExploreWallhavenTab;
