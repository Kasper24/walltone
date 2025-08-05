import React from "react";
import {
  AppWindow,
  SlidersHorizontal,
  FileCode,
  KeyRound,
  HardDrive,
  LucideIcon,
} from "lucide-react";
import { ScrollArea } from "@renderer/components/ui/scroll-area.js";
import { Card, CardHeader, CardContent, CardTitle } from "@renderer/components/ui/card.js";
import { SettingKey } from "@electron/main/trpc/routes/settings.js";
import {
  InputSetting,
  BooleanSetting,
  FolderListSetting,
  ThemeSetting,
  TemplateListSetting,
  DropdownSetting,
  SliderSetting,
} from "./components.js";

interface SettingConfig {
  settingKey: SettingKey;
  title: string;
  description?: string;
  type:
    | "input"
    | "folder"
    | "encrypted"
    | "boolean"
    | "dropdown"
    | "slider"
    | "folder-list"
    | "theme"
    | "template-list";
  placeholder?: string;
  options?: { value: string; label: string }[]; // For dropdown
  min?: number; // For slider
  max?: number; // For slider
  step?: number; // For slider
}

interface SettingsSection {
  title: string;
  description: string;
  icon: LucideIcon;
  settings: SettingConfig[];
}

const SETTINGS_CONFIG: SettingsSection[] = [
  {
    title: "Application",
    description: "Customize the look and feel",
    icon: AppWindow,
    settings: [
      {
        settingKey: "app.uiTheme",
        title: "Dark Mode",
        description: "Toggle between light and dark theme",
        type: "theme",
      },
      {
        settingKey: "app.restoreWallpaperOnStart",
        title: "Restore on Start",
        description: "Restore the last wallpaper on startup",
        type: "boolean",
      },
    ],
  },
  {
    title: "Theme Generation",
    description: "Customize how themes are generated from wallpapers",
    icon: SlidersHorizontal,
    settings: [
      {
        settingKey: "themeGeneration.quantizeLibrary",
        title: "Quantize Library",
        description: "Select the quantization library to use",
        type: "dropdown",
        options: [
          { value: "material", label: "Material" },
          { value: "quantize", label: "Quantize" },
        ],
      },
      {
        settingKey: "themeGeneration.base16.accentMinSaturation",
        title: "Base16 Min Saturation",
        description: "Minimum saturation for accent colors (0 to 1).",
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        settingKey: "themeGeneration.base16.accentMaxSaturation",
        title: "Base16 Max Saturation",
        description: "Maximum saturation for accent colors (0 to 1).",
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        settingKey: "themeGeneration.base16.accentMinLuminance",
        title: "Base16 Min Luminance",
        description: "Minimum luminance for accent colors (0 to 1).",
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        settingKey: "themeGeneration.base16.accentMaxLuminance",
        title: "Base16 Max Luminance",
        description: "Maximum luminance for accent colors (0 to 1).",
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        settingKey: "themeGeneration.base16.accentSaturation",
        title: "Base16 Accent Saturation",
        description: "Boost the saturation of the final accent colors.",
        type: "slider",
        min: -10,
        max: 10,
        step: 0.01,
      },
      {
        settingKey: "themeGeneration.base16.accentDarken",
        title: "Base16 Accent Darken",
        description: "Darken the final accent colors.",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.05,
      },
      {
        settingKey: "themeGeneration.base16.accentLighten",
        title: "Base16 Accent Lighten",
        description: "Lighten the final accent colors.",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.05,
      },
      {
        settingKey: "themeGeneration.base16.backgroundSaturation",
        title: "Base16 Background Saturation",
        description: "Boost the saturation of the final background colors.",
        type: "slider",
        min: -10,
        max: 10,
        step: 0.01,
      },
      {
        settingKey: "themeGeneration.base16.backgroundDarken",
        title: "Base16 Background Darken",
        description: "Darken the final background colors.",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.05,
      },
      {
        settingKey: "themeGeneration.base16.backgroundLighten",
        title: "Base16 Background Lighten",
        description: "Lighten the final background colors.",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.05,
      },
    ],
  },
  {
    title: "Theme Output",
    description: "Configure what happens after a theme is generated",
    icon: FileCode,
    settings: [
      {
        settingKey: "themeOutput.templates",
        title: "Custom Templates",
        description: "Manage your template sources and destinations",
        type: "template-list",
      },
      {
        settingKey: "themeOutput.wallpaperCopyDestinations",
        title: "Wallpaper Copy Destinations",
        description: "Folders to copy wallpapers into",
        type: "folder-list",
      },
    ],
  },
  {
    title: "API Keys",
    description: "Manage API keys for remote wallpaper sources",
    icon: KeyRound,
    settings: [
      {
        settingKey: "apiKeys.unsplash",
        title: "Unsplash API Key",
        description: "Required for retrieving wallpapers from Unsplash",
        type: "encrypted",
        placeholder: "Enter your Unsplash API key",
      },
      {
        settingKey: "apiKeys.pexels",
        title: "Pexels API Key",
        description: "Required for retrieving wallpapers from Pexels",
        type: "encrypted",
        placeholder: "Enter your Pexels API key",
      },
      {
        settingKey: "apiKeys.wallpaperEngine",
        title: "Steam API Key",
        description: "Required for retrieving wallpapers from Wallpaper Engine",
        type: "encrypted",
        placeholder: "Enter your Steam API key",
      },
    ],
  },
  {
    title: "Wallpapers Sources",
    description: "Configure folders for local assets and wallpapers",
    icon: HardDrive,
    settings: [
      {
        settingKey: "wallpaperSources.imageFolders",
        title: "Image Wallpaper Folders",
        description: "Local folders containing wallpaper images",
        type: "folder-list",
      },
      {
        settingKey: "wallpaperSources.videoFolders",
        title: "Video Wallpaper Folders",
        description: "Local folders containing wallpaper videos",
        type: "folder-list",
      },
      {
        settingKey: "wallpaperSources.wallpaperEngineAssetsFolder",
        title: "Wallpaper Engine Assets Folder",
        description: "Location of Wallpaper Engine assets",
        type: "folder",
        placeholder: "Enter Wallpaper Engine assets folder",
      },
      {
        settingKey: "wallpaperSources.wallpaperEngineFolders",
        title: "Wallpaper Engine Wallpaper Folders",
        description: "Additional folders to scan for wallpapers",
        type: "folder-list",
      },
    ],
  },
];

const SettingsTab = () => {
  return (
    <ScrollArea className="mx-auto h-[90vh] max-w-6xl p-6">
      <div className="space-y-8">
        {SETTINGS_CONFIG.map((section) => (
          <SettingsSection key={section.title} section={section} />
        ))}
      </div>
    </ScrollArea>
  );
};

const SettingsSection = ({ section }: { section: SettingsSection }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            {React.createElement(section.icon, {
              className: "size-5",
            })}
          </div>
          <div>
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{section.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {section.settings.map((setting) => (
          <SettingsItem key={setting.settingKey} setting={setting} />
        ))}
      </CardContent>
    </Card>
  );
};

const SettingsItem = ({ setting }: { setting: SettingConfig }) => {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      <div className="space-y-1">
        <h4 className="font-medium">{setting.title}</h4>
        {setting.description && (
          <p className="text-muted-foreground text-sm">{setting.description}</p>
        )}
      </div>
      <div className="lg:col-span-2">
        <SettingField setting={setting} />
      </div>
    </div>
  );
};

const SettingField = ({ setting }: { setting: SettingConfig }) => {
  switch (setting.type) {
    case "input":
      return (
        <InputSetting settingKey={setting.settingKey} placeholder={setting.placeholder || ""} />
      );
    case "folder":
      return (
        <InputSetting
          settingKey={setting.settingKey}
          placeholder={setting.placeholder || ""}
          filePicker="folder"
        />
      );
    case "encrypted":
      return (
        <InputSetting
          settingKey={setting.settingKey}
          placeholder={setting.placeholder || ""}
          encrypted
        />
      );
    case "boolean":
      return <BooleanSetting settingKey={setting.settingKey} />;
    case "dropdown":
      return (
        <DropdownSetting
          settingKey={setting.settingKey}
          options={setting.options || []}
          placeholder={setting.placeholder || ""}
        />
      );
    case "slider":
      return (
        <SliderSetting
          settingKey={setting.settingKey}
          min={setting.min || 0}
          max={setting.max || 100}
        />
      );
    case "folder-list":
      return <FolderListSetting settingKey={setting.settingKey} />;
    case "theme":
      return <ThemeSetting />;
    case "template-list":
      return <TemplateListSetting settingKey={setting.settingKey} />;
    default:
      return <div>Unknown setting type</div>;
  }
};

export default SettingsTab;
