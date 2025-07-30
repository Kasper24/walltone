import { LucideIcon } from "lucide-react";
import { RouterInputs } from "@electron/trpc/router/base";
import { BaseWallpaper, WallpaperData } from "@electron/trpc/router/wallpaper";

export type OnWallpaperApply = (
  wallpaper: BaseWallpaper,
  monitorConfigs: { name: string; scalingMethod: string }[],
  controlValues?: { [key: string]: any }
) => Promise<void>;

export type OnWallpaperDownload = (wallpaper: BaseWallpaper) => Promise<void>;

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
    key: RouterInputs["settings"]["get"]["key"];
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

export interface DynamicControlDefinition {
  type: "range" | "boolean" | "select";
  key: string;
  title: string;
  description?: string;
  defaultValue?: any;
  options?: {
    min?: number;
    max?: number;
    step?: number;
    values?: { key: string; text: string }[];
  };
}

export interface WallpapersGridProps {
  queryKeys: string[];
  queryFn: (params: {
    pageParam: number;
    query: string;
    sorting: string;
    appliedFilters?: AppliedFilters;
    configValue?: any;
  }) => Promise<WallpaperData>;
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
  onWallpaperApply?: OnWallpaperApply;
  onWallpaperDownload?: OnWallpaperDownload;
  requiresConfiguration?: ConfigurationRequirement;
  controlDefinitions?: DynamicControlDefinition[];
}
