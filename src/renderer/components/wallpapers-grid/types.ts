import { LucideIcon } from "lucide-react";
import { BaseWallpaper, WallpaperData } from "@electron/main/trpc/routes/wallpaper.js";
import {
  DynamicControlDefinition,
  DynamicControlValues,
} from "@renderer/components/wallpaper-dialog/types.js";
import { SettingKey } from "@electron/main/trpc/routes/settings.js";

export type OnWallpaperApply<T extends BaseWallpaper> = (
  wallpaper: T,
  monitorConfigs: { name: string; scalingMethod: string }[],
  controlValues?: DynamicControlValues
) => Promise<void>;

export type OnWallpaperDownload<T extends BaseWallpaper> = (wallpaper: T) => Promise<void>;

export interface FilterDefinition {
  type: "single" | "multiple" | "boolean";
  title: string;
  values?: string[];
}

export type ArrayFilters = Record<string, string[]>;
export type StringFilters = Record<string, string>;
export type BooleanFilters = Record<string, boolean>;

export interface AppliedFilters {
  arrays: ArrayFilters;
  strings: StringFilters;
  booleans: BooleanFilters;
}

export type SetAppliedFilters = React.Dispatch<React.SetStateAction<AppliedFilters>>;

export interface ConfigurationRequirement {
  setting: {
    key: SettingKey;
    decrypt?: boolean;
  };
  title: string;
  description: string;
  icon: LucideIcon;
  setupInstructions: string[];
  helperText: string;
  actions: {
    title: string;
    description: string;
    icon: LucideIcon;
    variant: "default" | "outline" | "ghost";
    onClick: (refetch: () => void) => void;
  }[];
}

export interface WallpapersGridProps<T extends BaseWallpaper> {
  queryKeys: string[];
  queryFn: (params: {
    pageParam: number;
    query: string;
    sorting: string;
    appliedFilters?: AppliedFilters;
    configValue?: unknown;
  }) => Promise<WallpaperData<T>>;
  queryEnabled?: boolean;
  sortingOptions?: {
    key: string;
    text: string;
  }[];
  filterDefinitions?: FilterDefinition[];
  scalingOptions?: {
    key: string;
    text: string;
  }[];
  onWallpaperApply?: OnWallpaperApply<T>;
  onWallpaperDownload?: OnWallpaperDownload<T>;
  requiresConfiguration?: ConfigurationRequirement;
  controlDefinitions?: DynamicControlDefinition[];
}
