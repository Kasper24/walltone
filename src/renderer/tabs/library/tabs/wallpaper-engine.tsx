import { Folder, RefreshCcw, Settings } from "lucide-react";
import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { client } from "@renderer/lib/trpc.js";

const LibraryWallpaperEngineTab = () => {
  const { setCurrentTab } = useCurrentTab();

  return (
    <WallpapersGrid
      requiresConfiguration={{
        setting: {
          key: "wallpaperEngine.wallpaperFolders",
        },
        title: "Wallpaper Engine Library Configuration",
        description:
          "To browse wallpaper engine wallpapers, you need to add wallpaper folders first.",
        icon: Folder,
        setupInstructions: [
          "Add folders containing wallpapers in the settings",
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
      queryKeys={[`library-wallpaper-engine`]}
      queryFn={async ({ pageParam, query, sorting, appliedFilters }) => {
        const tags = Object.entries(appliedFilters?.arrays || {}).flatMap(([_, values]) => values);

        return await client.wallpaper.search.query({
          type: "wallpaper-engine",
          page: pageParam,
          limit: 50,
          sorting: sorting,
          query,
          tags,
          matchAll: appliedFilters?.booleans.matchall,
        });
      }}
      sortingOptions={[
        { key: "name", text: "Name" },
        { key: "id", text: "ID" },
        { key: "date_added", text: "Date Added" },
      ]}
      scalingOptions={[
        { key: "default", text: "Default" },
        { key: "stretch", text: "Stretch" },
        { key: "fit", text: "Fit" },
        { key: "fill", text: "Fill" },
      ]}
      filterDefinitions={[
        {
          type: "boolean",
          title: "matchAll",
        },
        {
          type: "multiple",
          title: "Types",
          values: ["Scene", "Video", "Web", "Application"],
        },
        {
          type: "multiple",
          title: "Age",
          values: ["Everyone", "Questionable", "Mature"],
        },
        {
          type: "multiple",
          title: "Genres",
          values: [
            "Abstract",
            "Animal",
            "Anime",
            "Cartoon",
            "CGI",
            "Cyberpunk",
            "Fantasy",
            "Game",
            "Girls",
            "Guys",
            "Landscape",
            "Medieval",
            "Memes",
            "MMD",
            "Music",
            "Nature",
            "Pixel art",
            "Relaxing",
            "Retro",
            "Sci-Fi",
            "Sports",
            "Technology",
            "Television",
            "Vehicle",
            "Unspecified",
          ],
        },
        {
          type: "multiple",
          title: "Resolutions",
          values: [
            "Standard Definition",
            "1280 x 720",
            "1366 x 768",
            "1920 x 1080",
            "2560 x 1440",
            "3840 x 2160",
            "Ultrawide Standard Definition",
            "Ultrawide 2560 x 1080",
            "Ultrawide 3440 x 1440",
            "Dual Standard Definition",
            "Dual 3840 x 1080",
            "Dual 5120 x 1440",
            "Dual 3840 x 2160",
            "Triple Standard Definition",
            "Triple 4096 x 768",
            "Triple 5760 x 1080",
            "Triple 7680 x 1440",
            "Triple 11520 x 2160",
            "Portrait Standard Definition",
            "Portrait 720 x 1280",
            "Portrait 1080 x 1920",
            "Portrait 1440 x 2560",
            "Portrait 2160 x 3840",
            "Other resolution",
            "Dynamic resolution",
          ],
        },
        {
          type: "multiple",
          title: "Categories",
          values: ["Wallpaper", "Preset", "Asset"],
        },
        {
          type: "multiple",
          title: "Asset Types",
          values: [
            "Particle",
            "Image",
            "Sound",
            "Model",
            "Text",
            "Sprite",
            "Fullscreen",
            "Composite",
            "Script",
            "Effect",
          ],
        },
        {
          type: "multiple",
          title: "Asset Genres",
          values: [
            "Audio Visualizer",
            "Background",
            "Character",
            "Clock",
            "Fire",
            "Interactive",
            "Magic",
            "Post Processing",
            "Smoke",
            "Space",
          ],
        },
        {
          type: "multiple",
          title: "Script Types",
          values: [
            "Boolean",
            "Number",
            "Vec2",
            "Vec3",
            "Vec4",
            "String",
            "No Animation",
            "Oversized",
          ],
        },
        {
          type: "multiple",
          title: "Miscellaneous",
          values: [
            "Approved",
            "Audio responsive",
            "Customizable",
            "Puppet Warp",
            "HDR",
            "Video Texture",
            "Asset Pack",
            "Media Integration",
            "3D",
          ],
        },
      ]}
      controlDefinitions={[
        {
          type: "boolean",
          key: "silent",
          title: "Silent",
          description: "Mute background audio",
          defaultValue: false,
        },
        {
          type: "range",
          key: "volume",
          title: "Volume",
          description: "Audio volume level",
          defaultValue: 100,
          options: { min: 0, max: 100, step: 1 },
        },
        {
          type: "boolean",
          key: "noAutomute",
          title: "No Auto Mute",
          description: "Don't mute when other apps play audio",
          defaultValue: false,
        },
        {
          type: "boolean",
          key: "noAudioProcessing",
          title: "No Audio Processing",
          description: "Disable audio reactive features",
          defaultValue: false,
        },
        {
          type: "range",
          key: "fps",
          title: "FPS Limit",
          description: "Limit frame rate",
          defaultValue: 24,
          options: { min: 10, max: 144, step: 1 },
        },
        {
          type: "select",
          key: "clamping",
          title: "Texture Clamping",
          description: "Set texture clamping mode",
          defaultValue: "clamp",
          options: {
            values: [
              { key: "clamp", text: "Clamp" },
              { key: "border", text: "Border" },
              { key: "repeat", text: "Repeat" },
            ],
          },
        },
        {
          type: "boolean",
          key: "disableMouse",
          title: "Disable Mouse",
          description: "Disable mouse interactions",
          defaultValue: false,
        },
        {
          type: "boolean",
          key: "disableParallax",
          title: "Disable Parallax",
          description: "Disable parallax effects",
          defaultValue: false,
        },
        {
          type: "boolean",
          key: "noFullscreenPause",
          title: "No Fullscreen Pause",
          description: "Don't pause when apps go fullscreen",
          defaultValue: false,
        },
      ]}
      onWallpaperApply={async (wallpaper, monitors, controlValues) => {
        await client.wallpaper.set.mutate({
          type: "wallpaper-engine",
          id: wallpaper.id,
          name: wallpaper.name,
          path: wallpaper.path,
          monitors,
          wallpaperEngineOptions: controlValues,
        });
      }}
    />
  );
};

export default LibraryWallpaperEngineTab;
