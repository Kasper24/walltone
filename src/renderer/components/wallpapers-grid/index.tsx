import { RefreshCw } from "lucide-react";
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

const WallpaperGridControls = ({
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
  onSortingChange: (value: string) => void;
  sortingOptions?: { key: string; text: string }[];
  filterDefinitions?: FilterDefinition[];
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
  onRefresh: () => void;
}) => {
  return (
    <div className="flex gap-x-4">
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
        <Button variant="ghost" onClick={onRefresh}>
          <RefreshCw />
        </Button>
      </div>
    </div>
  );
};

const WallpapersGrid = ({
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
}: WallpapersGridProps) => {
  // Custom hooks for state management
  const { inputValue, setInputValue, debouncedInputValue, handleSearch, clearSearch } =
    useWallpaperSearch();

  const { sorting, setSorting, appliedFilters, setAppliedFilters } =
    useWallpaperFilters(sortingOptions);

  const { configValue, isConfigPending, isConfigError, refetchConfig, isConfigurationValid } =
    useConfiguration(requiresConfiguration);

  const {
    isFetching,
    isLoading,
    isError,
    error,
    refetch,
    failureCount,
    allWallpapers,
    infiniteScrollRef,
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

  // Show configuration requirement screen
  if (requiresConfiguration && (isConfigPending || isConfigError || !configValue)) {
    return (
      <ConfigurationScreen
        requirement={requiresConfiguration}
        configValue={configValue}
        isPending={isConfigPending}
        isError={isConfigError}
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
        allWallpapers={allWallpapers}
        debouncedInputValue={debouncedInputValue}
        clearSearch={clearSearch}
        onWallpaperApply={onWallpaperApply}
        onWallpaperDownload={onWallpaperDownload}
        scalingOptions={scalingOptions}
        infiniteScrollRef={infiniteScrollRef}
        controlDefinitions={controlDefinitions}
      />
    </div>
  );
};

export default WallpapersGrid;
