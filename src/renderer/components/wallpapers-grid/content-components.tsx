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
import { Dialog, DialogTrigger } from "@renderer/components/ui/dialog";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { Button } from "@renderer/components/ui/button";
import { Badge } from "@renderer/components/ui/badge";
import { Separator } from "@renderer/components/ui/separator";
import { useCurrentTab } from "@renderer/providers/current-tab-provider";
import { cn } from "@renderer/lib/cn";
import { BaseWallpaper } from "@electron/trpc/router/wallpaper";
import WallpaperDialog from "../wallpaper-dialog";
import { DynamicControlDefinition } from "../wallpaper-dialog/apply-dialog";
import { ConfigurationRequirement, OnWallpaperApply, OnWallpaperDownload } from "./types";

export const ConfigurationScreen = ({
  requirement,
  configValue,
  isPending,
  isError,
  refetch,
}: {
  requirement: ConfigurationRequirement;
  configValue?: any;
  isPending: boolean;
  isError: boolean;
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

  if (isError || !configValue) {
    return (
      <div className="flex h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg">
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
    );
  }

  return null;
};

export const Wallpaper = ({
  wallpaper,
  onWallpaperApply,
  onWallpaperDownload,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: BaseWallpaper;
  onWallpaperApply?: OnWallpaperApply;
  onWallpaperDownload?: OnWallpaperDownload;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  return (
    <div key={wallpaper.id} className="group relative overflow-hidden rounded-lg">
      <Dialog>
        <DialogTrigger className="flex w-full">
          <img
            className="h-56 w-full transform rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:blur-sm"
            src={wallpaper.previewPath}
            alt={wallpaper.name}
            loading="lazy"
            decoding="async"
          />
          <div className="bg-background absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-50">
            <span className="p-3 text-center font-semibold">{wallpaper.name}</span>
          </div>
        </DialogTrigger>
        <WallpaperDialog
          wallpaper={wallpaper}
          onApply={onWallpaperApply}
          onDownload={onWallpaperDownload}
          scalingOptions={scalingOptions}
          controlDefinitions={controlDefinitions}
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
                  onClick={() => setCurrentTab("settings")}
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

export const WallpaperGrid = ({
  isError,
  error,
  refetch,
  failureCount,
  isLoading,
  isFetching,
  allWallpapers,
  debouncedInputValue,
  clearSearch,
  onWallpaperApply,
  onWallpaperDownload,
  scalingOptions,
  infiniteScrollRef,
  controlDefinitions,
}: {
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  failureCount: number;
  isLoading: boolean;
  isFetching: boolean;
  allWallpapers: BaseWallpaper[];
  debouncedInputValue: string;
  clearSearch: () => void;
  onWallpaperApply?: OnWallpaperApply;
  onWallpaperDownload?: OnWallpaperDownload;
  scalingOptions?: { key: string; text: string }[];
  infiniteScrollRef: (node?: Element | null | undefined) => void;
  controlDefinitions?: DynamicControlDefinition[];
}) => {
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
    <ScrollArea
      className={cn("h-[80vh]", {
        "opacity-20": isFetching,
      })}
    >
      <div className="mr-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {allWallpapers.map((wallpaper) => (
          <Wallpaper
            key={wallpaper.id}
            wallpaper={wallpaper}
            onWallpaperApply={onWallpaperApply}
            onWallpaperDownload={onWallpaperDownload}
            scalingOptions={scalingOptions}
            controlDefinitions={controlDefinitions}
          />
        ))}
        <div className="h-5 w-5" ref={infiniteScrollRef}></div>
      </div>
    </ScrollArea>
  );
};
