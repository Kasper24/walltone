import React from "react";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  Search,
  ImageIcon,
  X,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { AutoSizer, Grid } from "react-virtualized";
import { BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/types.js";
import { type SettingKey } from "@electron/main/trpc/routes/settings/index.js";
import { Dialog, DialogTrigger } from "@renderer/components/ui/dialog.js";
import { ScrollArea } from "@renderer/components/ui/scroll-area.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card.js";
import { Button } from "@renderer/components/ui/button.js";
import { Badge } from "@renderer/components/ui/badge.js";
import { Separator } from "@renderer/components/ui/separator.js";
import WallpaperDialog from "@renderer/components/wallpaper-dialog/index.js";
import { type DynamicControlDefinition } from "@renderer/components/wallpaper-dialog/types.js";
import { useCurrentTab } from "@renderer/providers/current-tab/hook.js";
import { ConfigurationRequirement, OnWallpaperApply, OnWallpaperDownload } from "./types.js";

export const ConfigurationScreen = <TConfigKey extends SettingKey>({
  requirement,
  isPending,
  refetch,
}: {
  requirement: ConfigurationRequirement<TConfigKey>;
  isPending: boolean;
  refetch: () => void;
}) => {
  if (isPending) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full"></div>
              <div className="bg-primary/10 relative rounded-full p-3">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Loading</h3>
            <p className="text-muted-foreground text-center text-sm">Checking configuration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[80vh]">
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-lg justify-self-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/20">
                {React.createElement(requirement.icon, {
                  className: "h-6 w-6 text-amber-600 dark:text-amber-400",
                })}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <CardTitle className="text-xl">{requirement.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Setup Required
                  </Badge>
                </div>
                <CardDescription className="text-base">{requirement.description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                <h4 className="text-sm font-semibold">Setup Instructions</h4>
              </div>

              <div className="space-y-3 pl-6">
                {requirement.setupInstructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Settings className="h-4 w-4" />
                Quick Actions
              </h4>

              <div className="grid gap-2">
                {requirement?.actions?.map((action) => (
                  <Button
                    key={action.title}
                    variant={action.variant}
                    className="h-11 w-full justify-start"
                    onClick={() => action.onClick(refetch)}
                  >
                    {React.createElement(action.icon, {
                      className: "mr-3 h-4 w-4",
                    })}
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-muted-foreground text-xs">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-xs leading-relaxed">
                <strong>Need help?</strong> {requirement.helperText}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export const Wallpaper = <T extends BaseWallpaper>({
  wallpaper,
  onWallpaperApply,
  onWallpaperDownload,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: T;
  onWallpaperApply?: OnWallpaperApply<T>;
  onWallpaperDownload?: OnWallpaperDownload<T>;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="group relative h-full w-full overflow-hidden rounded-lg">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="flex h-full w-full">
          <img
            className="bg-secondary h-full w-full transform rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 group-hover:blur-sm"
            src={wallpaper.thumbnailPath}
            alt={wallpaper.name}
            loading="lazy"
            decoding="async"
          />
          <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-50">
            <span className="p-3 text-center font-semibold">{wallpaper.name}</span>
          </div>
        </DialogTrigger>
        <WallpaperDialog
          wallpaper={wallpaper}
          onApply={onWallpaperApply}
          onDownload={onWallpaperDownload}
          scalingOptions={scalingOptions}
          controlDefinitions={controlDefinitions}
          isOpen={isOpen}
        />
      </Dialog>
    </div>
  );
};

export const Error = ({
  error,
  retry,
  retryCount = 0,
}: {
  error: Error;
  retry: () => void;
  retryCount?: number;
}) => {
  return (
    <div className="flex h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <CardTitle className="text-xl">Something went wrong</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
              </div>
              <CardDescription className="text-base">
                {error.message || "An unexpected error occurred while loading wallpapers."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Settings className="h-4 w-4" />
              Quick Actions
            </h4>

            <div className="grid gap-2">
              <Button variant="default" className="h-11 w-full justify-start" onClick={retry}>
                <RotateCcw className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Try Again</div>
                  <div className="text-muted-foreground text-xs">Retry loading wallpapers</div>
                </div>
              </Button>

              {retryCount >= 3 && (
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Refresh Page</div>
                    <div className="text-muted-foreground text-xs">
                      Reload the entire application
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <details className="text-left">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
                Technical Details
              </summary>
              <div className="bg-muted mt-2 rounded p-2 font-mono text-xs break-words">
                {error.stack || error.message}
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const EmptyWallpapers = ({
  query,
  onClearSearch,
  refetch,
}: {
  query?: string;
  onClearSearch?: () => void;
  refetch: () => void;
}) => {
  const { setCurrentTab } = useCurrentTab();
  const isSearchResult = query && query.trim().length > 0;

  return (
    <div className="flex h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
              {isSearchResult ? (
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <CardTitle className="text-xl">
                  {isSearchResult ? "No results found" : "No wallpapers available"}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {isSearchResult ? "Search" : "Empty"}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {isSearchResult
                  ? `No wallpapers match "${query}". Try adjusting your search terms or filters.`
                  : "There are no wallpapers to display. Check your configuration or add some wallpaper sources."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isSearchResult && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="text-muted-foreground h-4 w-4" />
                  <h4 className="text-sm font-semibold">Search Suggestions</h4>
                </div>

                <div className="space-y-3 pl-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      1
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Try using broader or different keywords
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      2
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Clear any active filters that might be limiting results
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      3
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Check your internet connection and try again
                    </p>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Settings className="h-4 w-4" />
              Quick Actions
            </h4>

            <div className="grid gap-2">
              {isSearchResult && onClearSearch ? (
                <Button
                  variant="default"
                  className="h-11 w-full justify-start"
                  onClick={onClearSearch}
                >
                  <X className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Clear Search</div>
                    <div className="text-muted-foreground text-xs">
                      Remove search filters and see all wallpapers
                    </div>
                  </div>
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="h-11 w-full justify-start"
                  onClick={() => setCurrentTab("/settings")}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Go to Settings</div>
                    <div className="text-muted-foreground text-xs">
                      Configure wallpaper sources and preferences
                    </div>
                  </div>
                </Button>
              )}

              <Button variant="outline" className="h-11 w-full justify-start" onClick={refetch}>
                <RefreshCw className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Refresh</div>
                  <div className="text-muted-foreground text-xs">
                    Reload wallpapers from sources
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              <strong>Need help?</strong>{" "}
              {isSearchResult
                ? "If you're still having trouble finding wallpapers, try browsing different categories or check your network connection."
                : "Visit the settings page to configure your wallpaper sources, or check that your internet connection is working properly."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const WallpaperGrid = <T extends BaseWallpaper>({
  isError,
  error,
  refetch,
  failureCount,
  isLoading,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  allWallpapers,
  debouncedInputValue,
  clearSearch,
  onWallpaperApply,
  onWallpaperDownload,
  scalingOptions,
  controlDefinitions,
}: {
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  failureCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  allWallpapers: T[];
  debouncedInputValue: string;
  clearSearch: () => void;
  onWallpaperApply?: OnWallpaperApply<T>;
  onWallpaperDownload?: OnWallpaperDownload<T>;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const gridRef = React.useRef<Grid>(null);

  if (isError) {
    return <Error error={error!} retry={refetch} retryCount={failureCount} />;
  }

  if (isLoading && allWallpapers.length === 0) {
    return (
      <div className="grid h-[75vh] place-content-center place-items-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (allWallpapers.length === 0 && !isLoading && !isFetching) {
    return (
      <EmptyWallpapers query={debouncedInputValue} refetch={refetch} onClearSearch={clearSearch} />
    );
  }

  return (
    <div className={"h-[85vh] w-full"}>
      <AutoSizer
        onResize={() => {
          // Force re-render on resize to recompute grid size
          gridRef.current?.recomputeGridSize();
        }}
      >
        {({ width, height }) => {
          const columnWidth = 300;
          const rowHeight = 250;
          const columnCount = Math.max(1, Math.floor(width / columnWidth));
          const rowCount = Math.ceil(allWallpapers.length / columnCount);

          return (
            <Grid
              ref={gridRef}
              width={width}
              height={height}
              columnWidth={Math.floor(width / columnCount) - 3}
              columnCount={columnCount}
              rowHeight={rowHeight}
              rowCount={rowCount}
              cellRenderer={({ columnIndex, rowIndex, key, style }) => {
                const index = rowIndex * columnCount + columnIndex;
                if (index >= allWallpapers.length) return null;
                const wallpaper = allWallpapers[index];
                return (
                  <div key={key} style={style} className="p-1.5">
                    <Wallpaper
                      wallpaper={wallpaper}
                      onWallpaperApply={onWallpaperApply}
                      onWallpaperDownload={onWallpaperDownload}
                      scalingOptions={scalingOptions}
                      controlDefinitions={controlDefinitions}
                    />
                  </div>
                );
              }}
              onSectionRendered={({ rowStopIndex, columnStopIndex }) => {
                // Infinite loading: if last row is visible, fetch next page
                const lastVisibleIndex = rowStopIndex * columnCount + columnStopIndex;
                if (
                  lastVisibleIndex >= allWallpapers.length - columnCount &&
                  hasNextPage &&
                  !isFetchingNextPage
                ) {
                  fetchNextPage();
                }
              }}
            />
          );
        }}
      </AutoSizer>
      {isFetchingNextPage && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center">
          <div className="bg-background/80 pointer-events-auto mb-8 flex items-center gap-2 rounded-full px-6 py-3 shadow-lg">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            <span className="text-muted-foreground text-sm font-medium">
              Loading more wallpapers…
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
