import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ThemeType, ThemePolarity, Theme } from "@electron/main/trpc/routes/theme/index.js";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/types.js";
import {
  type OnWallpaperApply,
  type OnWallpaperDownload,
} from "@renderer/components/wallpapers-grid/types.js";

import { client } from "@renderer/lib/trpc.js";
import { DynamicControlValues } from "./types.js";

export const useThemeGeneration = (imageSrc: string, enabled: boolean) => {
  const [theme, setTheme] = React.useState<Theme | undefined>();

  const { data } = useQuery({
    queryKey: ["theme", imageSrc],
    enabled,
    queryFn: async () => {
      return await client.theme.generate.query({
        imageSrc: imageSrc,
      });
    },
  });

  React.useEffect(() => {
    if (data) {
      setTheme(data);
    }
  }, [data]);

  return {
    theme,
    setTheme,
  };
};

export const useColorEditor = () => {
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>();
  const [selectedColorKey, setSelectedColorKey] = React.useState<string | undefined>();

  const selectColor = React.useCallback((colorValue: string, colorKey: string) => {
    setSelectedColor(colorValue);
    setSelectedColorKey(colorKey);
  }, []);

  const updateColor = React.useCallback((newColor: string) => {
    setSelectedColor(newColor);
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedColor(undefined);
    setSelectedColorKey(undefined);
  }, []);

  return {
    selectedColor,
    selectedColorKey,
    selectColor,
    updateColor,
    clearSelection,
  };
};

export const useThemeEditor = (theme: Theme | undefined, selectedColorKey: string | undefined) => {
  const [activeTheme, setActiveTheme] = React.useState<ThemeType>("base16");
  const [activeVariant, setActiveVariant] = React.useState<ThemePolarity>("dark");

  const updateThemeColor = React.useCallback(
    (newColor: string) => {
      if (!theme || !selectedColorKey) return null;

      return {
        ...theme,
        [activeTheme]: {
          ...theme[activeTheme],
          [activeVariant]: {
            ...theme[activeTheme][activeVariant],
            [selectedColorKey]: newColor,
          },
        },
      };
    },
    [theme, selectedColorKey, activeTheme, activeVariant]
  );

  return {
    activeTheme,
    setActiveTheme,
    activeVariant,
    setActiveVariant,
    updateThemeColor,
  };
};

export const useWallpaperActions = <TWallpaper extends BaseWallpaper>(wallpaper: TWallpaper) => {
  const downloadMutation = useMutation({
    mutationFn: async (onDownload: OnWallpaperDownload<TWallpaper>) => {
      return await onDownload(wallpaper);
    },
    onSuccess: () => {
      toast.success("Wallpaper downloaded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      await client.theme.set.mutate({
        wallpaper: wallpaper,
        theme: theme,
      });
    },
    onSuccess: () => {
      toast.success("Theme saved successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async ({
      onApply,
      monitorConfigs,
      controlValues,
    }: {
      onApply: OnWallpaperApply<TWallpaper>;
      monitorConfigs: { id: string; scalingMethod: string }[];
      controlValues?: DynamicControlValues;
    }) => {
      return await onApply(wallpaper, monitorConfigs, controlValues);
    },
  });

  return {
    downloadMutation,
    setThemeMutation,
    applyMutation,
  };
};
