import React from "react";
import { Palette, Save, Wallpaper, Copy, X, PaletteIcon } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@uiw/react-color";
import type { ThemeType, ThemePolarity, Theme } from "@electron/main/trpc/routes/theme/index.js";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper.js";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Dialog,
} from "@renderer/components/ui/dialog.js";
import { Button } from "@renderer/components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card.js";
import { Badge } from "@renderer/components/ui/badge.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs.js";
import { ScrollArea } from "@renderer/components/ui/scroll-area.js";
import LoadingButton from "@renderer/components/ui/loading-button.js";
import {
  type OnWallpaperApply,
  type OnWallpaperDownload,
} from "@renderer/components/wallpapers-grid/types.js";
import {
  useThemeGeneration,
  useColorEditor,
  useThemeEditor,
  useWallpaperActions,
} from "./hooks.js";
import ApplyWallpaperDialog from "./apply-dialog.js";
import { type DynamicControlDefinition } from "./types.js";

const WallpaperDialog = <T extends BaseWallpaper>({
  wallpaper,
  onApply,
  onDownload,
  scalingOptions,
  controlDefinitions,
  isOpen,
}: {
  wallpaper: T;
  onApply?: OnWallpaperApply<T>;
  onDownload?: OnWallpaperDownload<T>;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
  isOpen: boolean;
}) => {
  const { theme, setTheme } = useThemeGeneration(wallpaper.previewPath, isOpen);
  const { selectedColor, selectedColorKey, selectColor, updateColor, clearSelection } =
    useColorEditor();
  const { activeTheme, setActiveTheme, activeVariant, setActiveVariant, updateThemeColor } =
    useThemeEditor(theme, selectedColorKey);

  const handleColorSelect = React.useCallback(
    (colorValue: string, colorKey: string) => {
      selectColor(colorValue, colorKey);
    },
    [selectColor]
  );

  const handleColorUpdate = React.useCallback(
    (newColor: string) => {
      const updatedTheme = updateThemeColor(newColor);
      if (updatedTheme) {
        setTheme(updatedTheme);
      }
      updateColor(newColor);
    },
    [updateThemeColor, setTheme, updateColor]
  );

  return (
    <DialogContent className="flex h-[90vh] max-h-[900px] min-h-[600px] w-[95vw] max-w-4xl flex-col p-0 select-none">
      <ScrollArea className="overflow-hidden">
        <div className="flex flex-shrink-0 flex-col p-6 pb-4">
          <Header wallpaper={wallpaper} />
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6">
          <div className="flex-shrink-0">
            <WallpaperImage wallpaper={wallpaper} />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <Tabs
              value={activeTheme}
              onValueChange={(value) => setActiveTheme(value as ThemeType)}
              className="flex flex-1 flex-col"
            >
              <TabsList className="mb-3 grid w-full flex-shrink-0 grid-cols-2">
                <TabsTrigger value="base16">Base 16</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
              </TabsList>

              <div className="flex-shrink-0">
                <ColorEditor
                  selectedColor={selectedColor}
                  onColorChange={handleColorUpdate}
                  onClear={clearSelection}
                />
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="base16" className="h-full">
                  <ThemePanel
                    theme={theme?.base16}
                    activeVariant={activeVariant}
                    setActiveVariant={setActiveVariant}
                    onColorSelect={handleColorSelect}
                    selectedColor={selectedColor}
                    isLoading={!theme}
                  />
                </TabsContent>

                <TabsContent value="material" className="h-full">
                  <ThemePanel
                    theme={theme?.material}
                    activeVariant={activeVariant}
                    setActiveVariant={setActiveVariant}
                    onColorSelect={handleColorSelect}
                    selectedColor={selectedColor}
                    isLoading={!theme}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <div className="flex-shrink-0 border-t p-6 pt-4">
          <WallpaperActions
            wallpaper={wallpaper}
            theme={theme}
            onApply={onApply}
            onDownload={onDownload}
            scalingOptions={scalingOptions}
            controlDefinitions={controlDefinitions}
          />
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

const Header = <T extends BaseWallpaper>({ wallpaper }: { wallpaper: T }) => {
  return (
    <DialogHeader className="flex-shrink-0 space-y-2">
      <DialogTitle className="flex items-center gap-2">
        <Wallpaper className="h-5 w-5" />
        <span className="line-clamp-1">{wallpaper.name}</span>
      </DialogTitle>
      <DialogDescription>Generate and customize color themes from this wallpaper</DialogDescription>
    </DialogHeader>
  );
};

const WallpaperImage = <T extends BaseWallpaper>({ wallpaper }: { wallpaper: T }) => {
  return (
    <Card className="p-1">
      <CardContent className="p-1">
        {wallpaper.type !== "video" ? (
          <img
            className="h-48 w-full rounded-lg object-cover sm:h-56 md:h-64"
            src={wallpaper.previewPath}
            alt={wallpaper.name}
          />
        ) : (
          <video
            className="h-48 w-full rounded-lg object-fill sm:h-56 md:h-64"
            src={wallpaper.previewPath}
            autoPlay
            loop
            playsInline
          ></video>
        )}
      </CardContent>
    </Card>
  );
};

const ColorEditor = ({
  selectedColor,
  onColorChange,
  onClear,
}: {
  selectedColor: string | undefined;
  onColorChange: (color: string) => void;
  onClear: () => void;
}) => {
  if (!selectedColor) return null;

  return (
    <div className="bg-muted/30 mb-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div
          className="border-background h-10 w-10 flex-shrink-0 rounded-lg border-2 shadow-sm"
          style={{ backgroundColor: selectedColor }}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-medium">
              <Palette className="h-3 w-3" />
              Edit Color
            </span>
            <Button size="sm" variant="ghost" onClick={onClear} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>

          <Slider color={selectedColor} onChange={(color) => onColorChange(color.hex)} />
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <code className="bg-background rounded border px-2 py-1 font-mono text-xs">
            {selectedColor.toUpperCase()}
          </code>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(selectedColor);
              toast.success("Copied to clipboard");
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ThemePanel = ({
  theme,
  activeVariant,
  setActiveVariant,
  onColorSelect,
  selectedColor,
  isLoading = false,
}: {
  theme?: Theme[ThemeType];
  activeVariant: ThemePolarity;
  setActiveVariant: (variant: ThemePolarity) => void;
  onColorSelect: (colorValue: string, colorKey: string) => void;
  selectedColor?: string;
  isLoading?: boolean;
}) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Theme Colors</CardTitle>
          <div className="flex gap-1">
            <Badge
              variant={activeVariant === "dark" ? "default" : "secondary"}
              className={`cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}
              onClick={() => !isLoading && setActiveVariant("dark")}
            >
              Dark
            </Badge>
            <Badge
              variant={activeVariant === "light" ? "default" : "secondary"}
              className={`cursor-pointer ${isLoading ? "pointer-events-none opacity-50" : ""}`}
              onClick={() => !isLoading && setActiveVariant("light")}
            >
              Light
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <ScrollArea className="h-64 pr-4">
          <div className="grid grid-cols-4 gap-3">
            {isLoading ? (
              <ThemeColorsSkeleton />
            ) : (
              <ThemeColors
                theme={theme}
                activeVariant={activeVariant}
                onColorSelect={onColorSelect}
                selectedColor={selectedColor}
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const ThemeColorsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 16 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="bg-muted border-muted aspect-square animate-pulse rounded-lg border-2"></div>
          <div className="space-y-1 text-center">
            <div className="bg-muted mx-auto h-3 w-12 animate-pulse rounded"></div>
            <div className="bg-muted mx-auto h-3 w-16 animate-pulse rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
};

const ThemeColors = ({
  theme,
  activeVariant,
  onColorSelect,
  selectedColor,
}: {
  theme?: Theme[ThemeType];
  activeVariant: ThemePolarity;
  onColorSelect: (colorValue: string, colorKey: string) => void;
  selectedColor?: string;
}) => {
  return (
    <>
      {Object.entries(theme?.[activeVariant] || {}).map(([colorName, colorValue]) => {
        const isSelected = selectedColor === colorValue;
        return (
          <div key={colorName} className="space-y-2">
            <div
              className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-primary ring-primary/20 ring-2"
                  : "border-muted hover:border-primary"
              }`}
              style={{ backgroundColor: colorValue as string }}
              onClick={() => onColorSelect(colorValue as string, colorName)}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {isSelected ? (
                  <Palette className="h-4 w-4 text-white" />
                ) : (
                  <Copy className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-xs font-medium">{colorName}</div>
              <code className="bg-muted rounded px-1 text-xs">
                {(colorValue as string).toUpperCase()}
              </code>
            </div>
          </div>
        );
      })}
    </>
  );
};

const WallpaperActions = <T extends BaseWallpaper>({
  wallpaper,
  theme,
  onApply,
  onDownload,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: T;
  theme?: Theme;
  onApply?: OnWallpaperApply<T>;
  onDownload?: OnWallpaperDownload<T>;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const { downloadMutation, setThemeMutation } = useWallpaperActions(wallpaper);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <LoadingButton
        isLoading={setThemeMutation.isPending}
        onClick={() => setThemeMutation.mutate(theme!)}
        className="flex-1 text-sm"
        disabled={!theme}
      >
        <PaletteIcon className="mr-2 h-4 w-4" />
        Set Theme
      </LoadingButton>

      {onDownload && (
        <LoadingButton
          isLoading={downloadMutation.isPending}
          onClick={() => downloadMutation.mutate(onDownload)}
          className="flex-1 text-sm"
        >
          <Save className="mr-2 h-4 w-4" />
          Download Wallpaper
        </LoadingButton>
      )}

      {onApply && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex-1 text-sm">
              <Wallpaper className="mr-2 h-4 w-4" />
              Set Wallpaper
            </Button>
          </DialogTrigger>
          <ApplyWallpaperDialog
            wallpaper={wallpaper}
            onApply={onApply}
            scalingOptions={scalingOptions}
            controlDefinitions={controlDefinitions}
          />
        </Dialog>
      )}
    </div>
  );
};

export default WallpaperDialog;
