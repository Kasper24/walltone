import { RefreshCw } from "lucide-react";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/types.js";
import { type SettingKey } from "@electron/main/trpc/routes/settings/index.js";
import { Input } from "@renderer/components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select.js";
import { Button } from "@renderer/components/ui/button.js";
import {
  useWallpaperSearch,
  useWallpaperFilters,
  useConfiguration,
  useWallpaperData,
} from "./hooks.js";
import { FilterSheet } from "./filter-components.js";
import { ConfigurationScreen, WallpaperGrid } from "./content-components.js";
import {
  WallpapersGridProps,
  AppliedFilters,
  SetAppliedFilters,
  FilterDefinition,
} from "./types.js";

const WallpaperGridControls = <TSorting extends string>({
  inputValue,
  onInputChange,
  onSortingChange,
  sortingOptions,
  filterDefinitions,
  appliedFilters,
  setAppliedFilters,
  onRefresh,
}: {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSortingChange: (value: TSorting) => void;
  sortingOptions?: { key: TSorting; text: string }[];
  filterDefinitions?: FilterDefinition[];
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
  onRefresh: () => void;
}) => {
  return (
    <div className="ml-2 flex gap-x-4">
      <Input
        autoFocus
        placeholder="Search wallpapers..."
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
      />
      <div className="flex gap-2">
        {sortingOptions && sortingOptions.length > 0 && (
          <Select defaultValue={sortingOptions[0].key} onValueChange={onSortingChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortingOptions.map((sortingOption) => (
                <SelectItem key={sortingOption.key} value={sortingOption.key}>
                  {sortingOption.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <FilterSheet
          filterDefinitions={filterDefinitions}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
        />
        <Button variant="ghost" size="icon" onClick={onRefresh}>
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
};

const WallpapersGrid = <
  T extends BaseWallpaper,
  TSorting extends string,
  TConfigKey extends SettingKey,
>({
  queryKeys,
  queryFn,
  queryEnabled = true,
  sortingOptions,
  filterDefinitions,
  scalingOptions,
  onWallpaperApply,
  onWallpaperDownload,
  requiresConfiguration,
  controlDefinitions,
}: WallpapersGridProps<T, TSorting, TConfigKey>) => {
  const { inputValue, setInputValue, debouncedInputValue, handleSearch, clearSearch } =
    useWallpaperSearch();

  const { sorting, setSorting, appliedFilters, setAppliedFilters } =
    useWallpaperFilters(sortingOptions);

  const { configValue, isConfigPending, isConfigError, refetchConfig, isConfigurationValid } =
    useConfiguration(requiresConfiguration);

  const {
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isError,
    error,
    refetch,
    failureCount,
    allWallpapers,
  } = useWallpaperData({
    queryKeys,
    queryFn,
    queryEnabled,
    debouncedInputValue,
    sorting,
    appliedFilters,
    configValue,
    isConfigurationValid,
  });

  if (
    requiresConfiguration &&
    (isConfigPending ||
      isConfigError ||
      !configValue ||
      (Array.isArray(configValue) && configValue.length === 0))
  ) {
    return (
      <ConfigurationScreen
        requirement={requiresConfiguration}
        isPending={isConfigPending}
        refetch={refetchConfig}
      />
    );
  }

  return (
    <div className="space-y-4">
      <WallpaperGridControls
        inputValue={inputValue}
        onInputChange={(value) => {
          setInputValue(value);
          handleSearch(value);
        }}
        onSortingChange={setSorting}
        sortingOptions={sortingOptions}
        filterDefinitions={filterDefinitions}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        onRefresh={refetch}
      />
      <WallpaperGrid
        isError={isError}
        error={error}
        refetch={refetch}
        failureCount={failureCount}
        isLoading={isLoading}
        isFetching={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        allWallpapers={allWallpapers}
        debouncedInputValue={debouncedInputValue}
        clearSearch={clearSearch}
        onWallpaperApply={onWallpaperApply}
        onWallpaperDownload={onWallpaperDownload}
        scalingOptions={scalingOptions}
        controlDefinitions={controlDefinitions}
      />
    </div>
  );
};

export default WallpapersGrid;
