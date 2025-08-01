import React from "react";
import { Folder, RefreshCcw, Settings } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DialogClose } from "@renderer/components/ui/dialog";
import WallpapersGrid from "@renderer/components/wallpapers-grid";
import LoadingButton from "@renderer/components/ui/loading-button";
import { useCurrentTab } from "@renderer/providers/current-tab-provider";
import useWallpaperEngineApiKey from "@renderer/hooks/useWallpaperEngineApiKey";
import { client } from "@renderer/lib/trpc";
import {
  wallpaperEngineGetTags,
  wallpaperEngineWorkshopItemUnsubscribe,
} from "@renderer/api/wallpaper-engine";

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

        return await client.theme.getWallpapers.query({
          type: "wallpaper-engine",
          page: pageParam,
          limit: 50,
          sorting: sorting as any,
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
      filterDefinitions={wallpaperEngineGetTags() as any}
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
        await client.theme.setWallpaper.mutate({
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

const UnsubscribeButton = ({ id }: { id: string }) => {
  const { data: apiKey } = useWallpaperEngineApiKey();
  const unsubscribe = useMutation({
    mutationFn: () => {
      return wallpaperEngineWorkshopItemUnsubscribe(id, apiKey as string);
    },
    onSuccess: () => {
      toast.success("Successfully unsubscribed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <DialogClose asChild>
      <LoadingButton
        isLoading={unsubscribe.isPending}
        variant="destructive"
        onClick={() => unsubscribe.mutate()}
      >
        Unsubscribe
      </LoadingButton>
    </DialogClose>
  );
};

export default LibraryWallpaperEngineTab;
