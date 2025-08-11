import React from "react";
import { toast } from "sonner";
import { ExternalLink, Key, RefreshCcw, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@renderer/components/ui/dialog.js";
import { Input } from "@renderer/components/ui/input.js";
import { Button } from "@renderer/components/ui/button.js";
import WallpapersGrid from "@renderer/components/wallpapers-grid/index.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { client } from "@renderer/lib/trpc.js";
import {
  type MonitorConfig,
  type WallpaperEngineWallpaper,
} from "@electron/main/trpc/routes/wallpaper/types.js";
import { useMutation } from "@tanstack/react-query";
import LoadingButton from "@renderer/components/ui/loading-button.js";

const SteamCredentialDialog = ({
  showSteamDialog,
  setShowSteamDialog,
  selectedWallpaper,
  selectedMonitors,
}: {
  showSteamDialog: boolean;
  setShowSteamDialog: (value: boolean) => void;
  selectedWallpaper: WallpaperEngineWallpaper | null;
  selectedMonitors: MonitorConfig | null;
}) => {
  const [steamUsername, setSteamUsername] = React.useState("");
  const [steamPassword, setSteamPassword] = React.useState("");
  const [steamGuard, setSteamGuard] = React.useState("");

  const downloadMutation = useMutation({
    mutationFn: async () => {
      return await client.api.wallpaperEngine.download.mutate({
        workshopId: selectedWallpaper!.id,
        username: steamUsername,
        password: steamPassword,
        guard: steamGuard,
      });
    },
    onSuccess: async (applyPath: string) => {
      client.wallpaper.set.mutate({
        type: "wallpaper-engine",
        id: selectedWallpaper!.id,
        name: selectedWallpaper!.name,
        applyPath,
        monitors: selectedMonitors!,
      });
      setShowSteamDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={showSteamDialog} onOpenChange={setShowSteamDialog}>
      <DialogContent className="w-1/3">
        <DialogHeader>
          <DialogTitle>Steam Login Required</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Steam Username"
            value={steamUsername}
            onChange={(e) => setSteamUsername(e.target.value)}
          />
          <Input
            placeholder="Steam Password (optional)"
            type="password"
            value={steamPassword}
            onChange={(e) => setSteamPassword(e.target.value)}
          />
          <Input
            placeholder="Steam Guard Code (optional)"
            value={steamGuard}
            onChange={(e) => setSteamGuard(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <LoadingButton
            isLoading={downloadMutation.isPending}
            onClick={() => {
              downloadMutation.mutate();
            }}
            className="flex-1 text-sm"
          >
            Apply
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DiscoverWallpaperEngineTab = () => {
  const { setCurrentTab } = useCurrentTab();
  const [showSteamDialog, setShowSteamDialog] = React.useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = React.useState<WallpaperEngineWallpaper | null>(
    null
  );
  const [selectedMonitors, setSelectedMonitors] = React.useState<MonitorConfig | null>(null);

  return (
    <div>
      <SteamCredentialDialog
        showSteamDialog={showSteamDialog}
        setShowSteamDialog={setShowSteamDialog}
        selectedWallpaper={selectedWallpaper}
        selectedMonitors={selectedMonitors}
      />
      <WallpapersGrid
        requiresConfiguration={{
          setting: {
            key: "apiKeys.wallpaperEngine",
            decrypt: true,
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
        queryKeys={[`wallpapers.discover.wallpaperEngine`]}
        queryFn={async ({ pageParam, query, sorting, appliedFilters, configValue }) => {
          const tags = Object.entries(appliedFilters?.arrays || {}).flatMap(
            ([_, values]) => values
          );

          return await client.api.wallpaperEngine.search.query({
            apiKey: configValue!,
            page: pageParam,
            query,
            sorting,
            tags,
            ...appliedFilters?.booleans,
          });
        }}
        sortingOptions={[
          { key: "0", text: "Vote" },
          { key: "1", text: "Date" },
          { key: "3", text: "Trend" },
          { key: "9", text: "Subscriptions" },
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
            key: "matchAll",
            title: "Match All",
          },
          {
            type: "multiple",
            key: "types",
            title: "Types",
            values: ["Scene", "Video", "Web", "Application"],
          },
          {
            type: "multiple",
            key: "ages",
            title: "Age",
            values: ["Everyone", "Questionable", "Mature"],
          },
          {
            type: "multiple",
            key: "genres",
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
            key: "resolutions",
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
            key: "categories",
            title: "Categories",
            values: ["Wallpaper", "Preset", "Asset"],
          },
          {
            type: "multiple",
            key: "assetTypes",
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
            key: "assetGenres",
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
            key: "scriptTypes",
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
            key: "miscellaneous",
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
        onWallpaperApply={async (wallpaper, monitors) => {
          setSelectedWallpaper(wallpaper as WallpaperEngineWallpaper);
          setSelectedMonitors(monitors);
          setShowSteamDialog(true);
        }}
      />
    </div>
  );
};

export default DiscoverWallpaperEngineTab;
