import React from "react";
import { Palette, Save, Wallpaper, Copy, X } from "lucide-react";
import { Slider } from "@uiw/react-color";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Dialog,
} from "@renderer/components/ui/dialog";
import { Button } from "@renderer/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card";
import { Badge } from "@renderer/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import LoadingButton from "@renderer/components/loading-button";
import { BaseWallpaper } from "@electron/trpc/router/wallpaper";
import { OnWallpaperApply, OnWallpaperDownload } from "../wallpapers-grid/types";
import { useThemeGeneration, useColorEditor, useThemeEditor, useWallpaperActions } from "./hooks";
import { copyToClipboard } from "./utils";
import ApplyWallpaperDialog, { DynamicControlDefinition } from "./apply-dialog";

const WallpaperDialog = ({
  wallpaper,
  onApply,
  onDownload,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: BaseWallpaper;
  onApply?: OnWallpaperApply;
  onDownload?: OnWallpaperDownload;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const { theme, setTheme, generateThemeFromImage } = useThemeGeneration();
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
      <div className="flex flex-shrink-0 flex-col p-6 pb-4">
        <Header wallpaper={wallpaper} />
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6">
        <div className="flex-shrink-0">
          <WallpaperImage wallpaper={wallpaper} onThemeGenerated={generateThemeFromImage} />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs value={activeTheme} onValueChange={setActiveTheme} className="flex flex-1 flex-col">
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
    </DialogContent>
  );
};

const Header = ({ wallpaper }: { wallpaper: BaseWallpaper }) => {
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

const WallpaperImage = ({
  wallpaper,
  onThemeGenerated,
}: {
  wallpaper: BaseWallpaper;
  onThemeGenerated: (imageElement: HTMLImageElement) => Promise<void>;
}) => {
  const ref = React.useRef<HTMLImageElement>(null);

  const handleImageLoad = React.useCallback(async () => {
    if (ref.current) {
      await onThemeGenerated(ref.current);
    }
  }, [onThemeGenerated]);

  return (
    <Card className="p-1">
      <CardContent className="p-1">
        <img
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          className="h-48 w-full rounded-lg object-cover sm:h-56 md:h-64"
          src={wallpaper.previewPath}
          alt={wallpaper.name}
          ref={ref}
          onLoad={handleImageLoad}
        />
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
            onClick={() => copyToClipboard(selectedColor)}
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
  theme?: any;
  activeVariant: string;
  setActiveVariant: (variant: string) => void;
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
  theme?: any;
  activeVariant: string;
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

const WallpaperActions = ({
  wallpaper,
  theme,
  onApply,
  onDownload,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: BaseWallpaper;
  theme?: unknown;
  onApply?: OnWallpaperApply;
  onDownload?: OnWallpaperDownload;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const { downloadMutation, saveThemeMutation } = useWallpaperActions(wallpaper);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <LoadingButton
        isLoading={saveThemeMutation.isPending}
        onClick={() => saveThemeMutation.mutate(theme)}
        className="flex-1 text-sm"
        disabled={!theme}
        variant="outline"
      >
        <Save className="mr-2 h-4 w-4" />
        Save Theme
      </LoadingButton>

      {onDownload && (
        <LoadingButton
          isLoading={downloadMutation.isPending}
          onClick={() => downloadMutation.mutate(onDownload)}
          className="flex-1 text-sm"
        >
          <Save className="mr-2 h-4 w-4" />
          Download
        </LoadingButton>
      )}

      {onApply && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex-1 text-sm">
              <Wallpaper className="mr-2 h-4 w-4" />
              Apply
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
