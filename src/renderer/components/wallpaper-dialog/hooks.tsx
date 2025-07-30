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

export const useScreenSelection = (scalingOptions?: { key: string; text: string }[]) => {
  const queryClient = useQueryClient();
  const [selectedScreens, setSelectedScreens] = React.useState<Set<string>>(new Set());
  const [screenScalingMethods, setScreenScalingMethods] = React.useState<Record<string, string>>(
    {}
  );

  const defaultScalingMethod = scalingOptions?.[0]?.key || "fill";

  const screensQuery = useQuery({
    queryKey: ["monitor-screens"],
    queryFn: async () => {
      const allScreens = await client.monitor.getAll.query();
      return allScreens.filter((screen) => screen.enabled);
    },
    staleTime: 1000 * 60 * 1,
  });

  React.useEffect(() => {
    if (screensQuery.data && screensQuery.data.length > 0) {
      const firstScreen = screensQuery.data.find((screen) => screen.enabled);
      if (firstScreen) {
        setSelectedScreens(new Set([firstScreen.name]));
        setScreenScalingMethods({ [firstScreen.name]: defaultScalingMethod });
      }
    }
  }, [screensQuery.data, defaultScalingMethod]);

  const toggleScreen = React.useCallback(
    (name: string) => {
      setSelectedScreens((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(name)) {
          newSet.delete(name);
          setScreenScalingMethods((prevMethods) => {
            const newMethods = { ...prevMethods };
            delete newMethods[name];
            return newMethods;
          });
        } else {
          newSet.add(name);
          setScreenScalingMethods((prevMethods) => ({
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
    setScreenScalingMethods((prev) => ({
      ...prev,
      [name]: scalingMethod,
    }));
  }, []);

  const selectAll = React.useCallback(() => {
    if (screensQuery.data) {
      const allnames = screensQuery.data.map((screen) => screen.name);
      setSelectedScreens(new Set(allnames));

      const allMethods = allnames.reduce(
        (acc, name) => ({
          ...acc,
          [name]: defaultScalingMethod,
        }),
        {}
      );
      setScreenScalingMethods(allMethods);
    }
  }, [screensQuery.data, defaultScalingMethod]);

  const selectNone = React.useCallback(() => {
    setSelectedScreens(new Set());
    setScreenScalingMethods({});
  }, []);

  return {
    ...screensQuery,
    selectedScreens,
    screenScalingMethods,
    toggleScreen,
    updateScalingMethod,
    selectAll,
    selectNone,
    retryQuery: () => queryClient.invalidateQueries({ queryKey: ["monitor-screens"] }),
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
      screenConfigs,
      controlValues,
    }: {
      onApply: OnWallpaperApply;
      screenConfigs: Array<{ name: string; scalingMethod: string }>;
      controlValues?: { [key: string]: any };
    }) => {
      return await onApply(wallpaper, screenConfigs, controlValues);
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
