import React from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/types.js";
import { type SettingKey, type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";
import { client } from "@renderer/lib/trpc.js";
import { AppliedFilters, ConfigurationRequirement, WallpapersGridProps } from "./types.js";
import { DotNotationValueOf } from "node_modules/conf/dist/source/types.js";

export const useWallpaperSearch = () => {
  const [debouncedInputValue, setDebouncedInputValue] = React.useState("");
  const [_, startTransition] = React.useTransition();

  const handleSearchDebounced = useDebouncedCallback((newQuery) => {
    startTransition(() => {
      setDebouncedInputValue(newQuery);
    });
  }, 300);

  const handleSearch = (newQuery: string) => {
    handleSearchDebounced(newQuery);
  };

  const clearSearch = () => {
    setDebouncedInputValue("");
  };

  return {
    debouncedInputValue,
    handleSearch,
    clearSearch,
  };
};

export const useWallpaperFilters = <TSorting extends string>(
  sortingOptions?: { key: TSorting; text: string }[]
) => {
  const [sorting, setSorting] = React.useState<TSorting>(
    sortingOptions?.[0]?.key ?? ("" as TSorting)
  );
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

export const useConfiguration = <TConfigKey extends SettingKey>(
  requiresConfiguration?: ConfigurationRequirement<TConfigKey>
) => {
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

export const useWallpaperData = <
  TWallpaper extends BaseWallpaper,
  TSorting extends string,
  TConfigKey extends SettingKey,
>({
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
  queryFn: WallpapersGridProps<TWallpaper, TSorting, TConfigKey>["queryFn"];
  queryEnabled: boolean;
  debouncedInputValue: string;
  sorting: TSorting;
  appliedFilters: AppliedFilters;
  configValue: DotNotationValueOf<SettingsSchema, TConfigKey>;
  isConfigurationValid: boolean;
}) => {
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

  const allWallpapers = React.useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data ?? []) || [];
  }, [query.data?.pages]);

  return {
    ...query,
    allWallpapers,
  };
};
