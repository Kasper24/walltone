import React from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper.js";
import { client } from "@renderer/lib/trpc.js";
import { AppliedFilters, ConfigurationRequirement, WallpapersGridProps } from "./types.js";

export const useWallpaperSearch = () => {
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedInputValue, setDebouncedInputValue] = React.useState("");

  const handleSearch = useDebouncedCallback((newQuery) => {
    setDebouncedInputValue(newQuery);
  }, 300);

  const clearSearch = () => {
    setInputValue("");
    setDebouncedInputValue("");
  };

  return {
    inputValue,
    setInputValue,
    debouncedInputValue,
    handleSearch,
    clearSearch,
  };
};

export const useWallpaperFilters = (sortingOptions?: { key: string; text: string }[]) => {
  const [sorting, setSorting] = React.useState(sortingOptions?.[0]?.key || "");
  const [appliedFilters, setAppliedFilters] = React.useState<AppliedFilters>({
    arrays: {},
    strings: {},
    booleans: {},
  });

  return {
    sorting,
    setSorting,
    appliedFilters,
    setAppliedFilters,
  };
};

export const useConfiguration = (requiresConfiguration?: ConfigurationRequirement) => {
  const {
    data: configValue,
    isPending: isConfigPending,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useQuery({
    enabled: !!requiresConfiguration,
    queryKey: [`${requiresConfiguration?.setting.key}`],
    queryFn: async () => {
      return await client.settings.get.query({
        key: requiresConfiguration!.setting.key,
        decrypt: requiresConfiguration!.setting.decrypt || false,
      });
    },
  });

  const isConfigurationValid = !requiresConfiguration || !!configValue;

  return {
    configValue,
    isConfigPending,
    isConfigError,
    refetchConfig,
    isConfigurationValid,
  };
};

export const useWallpaperData = <T extends BaseWallpaper>({
  queryKeys,
  queryFn,
  queryEnabled,
  debouncedInputValue,
  sorting,
  appliedFilters,
  configValue,
  isConfigurationValid,
}: {
  queryKeys: string[];
  queryFn: WallpapersGridProps<T>["queryFn"];
  queryEnabled: boolean;
  debouncedInputValue: string;
  sorting: string;
  appliedFilters: AppliedFilters;
  configValue: unknown;
  isConfigurationValid: boolean;
}) => {
  const { ref, inView } = useInView();

  const query = useInfiniteQuery({
    queryKey: [...queryKeys, debouncedInputValue, sorting, JSON.stringify(appliedFilters)],
    queryFn: ({ pageParam = 1 }) =>
      queryFn({
        pageParam,
        query: debouncedInputValue,
        sorting,
        appliedFilters,
        configValue,
      }),
    enabled: queryEnabled && isConfigurationValid,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    getPreviousPageParam: (firstPage) => firstPage.prevPage,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  React.useEffect(() => {
    if (inView) {
      query.fetchNextPage();
    }
  }, [query, inView]);

  const allWallpapers = query.data?.pages.flatMap((page) => page.data ?? []) || [];

  return {
    ...query,
    allWallpapers,
    infiniteScrollRef: ref,
  };
};
