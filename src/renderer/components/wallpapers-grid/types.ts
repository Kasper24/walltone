import { LucideIcon } from "lucide-react";
import { type DotNotationValueOf } from "node_modules/conf/dist/source/types.js";
import {
  type BaseWallpaper,
  type WallpaperData,
} from "@electron/main/trpc/routes/wallpaper/types.js";
import { type SettingKey, type SettingsSchema } from "@electron/main/trpc/routes/settings/index.js";
import {
  DynamicControlDefinition,
  DynamicControlValues,
} from "@renderer/components/wallpaper-dialog/types.js";

export type OnWallpaperApply<T extends BaseWallpaper> = (
  wallpaper: T,
  monitorConfigs: { id: string; scalingMethod: string }[],
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

export interface ConfigurationRequirement<TConfigKey extends SettingKey> {
  setting: {
    key: TConfigKey;
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

export interface WallpapersGridProps<
  T extends BaseWallpaper,
  TSorting extends string,
  TConfigKey extends SettingKey,
> {
  queryKeys: string[];
  queryFn: (params: {
    pageParam: number;
    query: string;
    sorting: TSorting;
    appliedFilters?: AppliedFilters;
    configValue?: DotNotationValueOf<SettingsSchema, TConfigKey>;
  }) => Promise<WallpaperData<T>>;
  queryEnabled?: boolean;
  sortingOptions?: {
    key: TSorting;
    text: string;
  }[];
  filterDefinitions?: FilterDefinition[];
  scalingOptions?: {
    key: string;
    text: string;
  }[];
  onWallpaperApply?: OnWallpaperApply<T>;
  onWallpaperDownload?: OnWallpaperDownload<T>;
  requiresConfiguration?: ConfigurationRequirement<TConfigKey>;
  controlDefinitions?: DynamicControlDefinition[];
}
