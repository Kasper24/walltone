import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import generateThemes from "@renderer/lib/theme";
import { client } from "@renderer/lib/trpc";
import { BaseWallpaper } from "@electron/trpc/router/wallpaper";
import { OnWallpaperApply, OnWallpaperDownload } from "../wallpapers-grid/types";

export const useThemeGeneration = () => {
  const [theme, setTheme] = React.useState<any>();

  const generateThemeFromImage = React.useCallback(
    async (element: HTMLImageElement | HTMLVideoElement) => {
      const generatedTheme = await generateThemes(element);
      setTheme(generatedTheme);
    },
    []
  );

  return {
    theme,
    setTheme,
    generateThemeFromImage,
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

export const useThemeEditor = (theme: any, selectedColorKey: string | undefined) => {
  const [activeTheme, setActiveTheme] = React.useState<string>("base16");
  const [activeVariant, setActiveVariant] = React.useState<string>("dark");

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
      return await client.monitor.getAll.query();
    },
    staleTime: 1000 * 60 * 1,
  });

  React.useEffect(() => {
    if (monitorsQuery.data && monitorsQuery.data.length > 0) {
      const firstMonitor = monitorsQuery.data[0];
      if (firstMonitor) {
        setSelectedMonitors(new Set([firstMonitor.name]));
        setMonitorScalingMethods({ [firstMonitor.name]: defaultScalingMethod });
      }
    }
  }, [monitorsQuery.data, defaultScalingMethod]);

  const toggleMonitor = React.useCallback(
    (name: string) => {
      setSelectedMonitors((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(name)) {
          newSet.delete(name);
          setMonitorScalingMethods((prevMethods) => {
            const newMethods = { ...prevMethods };
            delete newMethods[name];
            return newMethods;
          });
        } else {
          newSet.add(name);
          setMonitorScalingMethods((prevMethods) => ({
            ...prevMethods,
            [name]: defaultScalingMethod,
          }));
        }
        return newSet;
      });
    },
    [defaultScalingMethod]
  );

  const updateScalingMethod = React.useCallback((name: string, scalingMethod: string) => {
    setMonitorScalingMethods((prev) => ({
      ...prev,
      [name]: scalingMethod,
    }));
  }, []);

  const selectAll = React.useCallback(() => {
    if (monitorsQuery.data) {
      const allnames = monitorsQuery.data.map((monitor) => monitor.name);
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

export const useWallpaperActions = (wallpaper: BaseWallpaper) => {
  const downloadMutation = useMutation({
    mutationFn: async (onDownload: OnWallpaperDownload) => {
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
    mutationFn: async (theme: any) => {
      await client.wallpaper.setTheme.mutate({
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
      onApply: OnWallpaperApply;
      monitorConfigs: Array<{ name: string; scalingMethod: string }>;
      controlValues?: { [key: string]: any };
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
