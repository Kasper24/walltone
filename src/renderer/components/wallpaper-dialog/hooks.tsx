import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ThemeType, ThemePolarity, Theme } from "@electron/main/trpc/routes/theme/index.js";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/index.js";
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

export const useMonitorSelection = (scalingOptions?: { key: string; text: string }[]) => {
  const queryClient = useQueryClient();
  const [selectedMonitors, setSelectedMonitors] = React.useState<Set<string>>(new Set());
  const [monitorScalingMethods, setMonitorScalingMethods] = React.useState<Record<string, string>>(
    {}
  );

  const defaultScalingMethod = scalingOptions?.[0]?.key || "fill";

  const monitorsQuery = useQuery({
    queryKey: ["all-monitors"],
    queryFn: async () => {
      return await client.monitor.search.query();
    },
    staleTime: 1000 * 60 * 1,
  });

  React.useEffect(() => {
    if (monitorsQuery.data && monitorsQuery.data.length > 0) {
      const firstMonitor = monitorsQuery.data[0];
      if (firstMonitor) {
        setSelectedMonitors(new Set([firstMonitor.id]));
        setMonitorScalingMethods({ [firstMonitor.id]: defaultScalingMethod });
      }
    }
  }, [monitorsQuery.data, defaultScalingMethod]);

  const toggleMonitor = React.useCallback(
    (id: string) => {
      setSelectedMonitors((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
          setMonitorScalingMethods((prevMethods) => {
            const newMethods = { ...prevMethods };
            delete newMethods[id];
            return newMethods;
          });
        } else {
          newSet.add(id);
          setMonitorScalingMethods((prevMethods) => ({
            ...prevMethods,
            [id]: defaultScalingMethod,
          }));
        }
        return newSet;
      });
    },
    [defaultScalingMethod]
  );

  const updateScalingMethod = React.useCallback((id: string, scalingMethod: string) => {
    setMonitorScalingMethods((prev) => ({
      ...prev,
      [id]: scalingMethod,
    }));
  }, []);

  const selectAll = React.useCallback(() => {
    if (monitorsQuery.data) {
      const allnames = monitorsQuery.data.map((monitor) => monitor.id);
      setSelectedMonitors(new Set(allnames));

      const allMethods = allnames.reduce(
        (acc, name) => ({
          ...acc,
          [name]: defaultScalingMethod,
        }),
        {}
      );
      setMonitorScalingMethods(allMethods);
    }
  }, [monitorsQuery.data, defaultScalingMethod]);

  const selectNone = React.useCallback(() => {
    setSelectedMonitors(new Set());
    setMonitorScalingMethods({});
  }, []);

  return {
    ...monitorsQuery,
    selectedMonitors,
    monitorScalingMethods,
    toggleMonitor,
    updateScalingMethod,
    selectAll,
    selectNone,
    retryQuery: () => queryClient.invalidateQueries({ queryKey: ["all-monitors"] }),
  };
};

export const useWallpaperActions = <T extends BaseWallpaper>(wallpaper: T) => {
  const downloadMutation = useMutation({
    mutationFn: async (onDownload: OnWallpaperDownload<T>) => {
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
      onApply: OnWallpaperApply<T>;
      monitorConfigs: { id: string; scalingMethod: string }[];
      controlValues?: DynamicControlValues;
    }) => {
      return await onApply(wallpaper, monitorConfigs, controlValues);
    },
    onSuccess: () => {
      toast.success("Wallpaper applied successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    downloadMutation,
    setThemeMutation,
    applyMutation,
  };
};
