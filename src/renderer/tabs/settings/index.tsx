import React from "react";
import { Image, Monitor, Settings, Palette, LucideIcon } from "lucide-react";
import { ScrollArea } from "@renderer/components/ui/scroll-area.js";
import { Card, CardHeader, CardContent, CardTitle } from "@renderer/components/ui/card.js";
import { RouterInputs } from "@electron/main/trpc/routes/base.js";
import {
  InputSetting,
  BooleanSetting,
  FolderListSetting,
  ThemeSetting,
  TemplateListSetting,
} from "./components.js";

type SettingKey = RouterInputs["settings"]["get"]["key"];

interface SettingConfig {
  key: SettingKey;
  title: string;
  description?: string;
  type: "input" | "folder" | "encrypted" | "boolean" | "folder-list" | "theme" | "template-list";
  placeholder?: string;
}

interface SettingsSection {
  title: string;
  description: string;
  icon: LucideIcon;
  settings: SettingConfig[];
}

const SETTINGS_CONFIG: SettingsSection[] = [
  {
    title: "Appearance",
    description: "Customize the look and feel",
    icon: Palette,
    settings: [
      {
        key: "app:theme" as SettingKey, // Special key for theme
        title: "Dark Mode",
        description: "Toggle between light and dark theme",
        type: "theme",
      },
    ],
  },
  {
    title: "Theme",
    description: "Manage theme settings",
    icon: Settings,
    settings: [
      {
        key: "theme.restoreOnStart",
        title: "Restore on Start",
        description: "Restore the last wallpaper on startup",
        type: "boolean",
      },
      {
        key: "theme.templates",
        title: "Custom Templates",
        description: "Manage your template sources and destinations",
        type: "template-list",
      },
      {
        key: "theme.wallpaperCopyDestinations",
        title: "Wallpaper Copy Destinations",
        description: "Folders to copy wallpapers into",
        type: "folder-list",
      },
    ],
  },
  {
    title: "Unsplash",
    description: "Configure Unsplash integration",
    icon: Monitor,
    settings: [
      {
        key: "unsplash.apiKey",
        title: "Unsplash API Key",
        description: "Required for downloading wallpapers from Unsplash",
        type: "encrypted",
        placeholder: "Enter your Unsplash API key",
      },
    ],
  },
  {
    title: "Pexels",
    description: "Configure Pexels integration",
    icon: Monitor,
    settings: [
      {
        key: "pexels.apiKey",
        title: "Pexels API Key",
        description: "Required for downloading wallpapers from Unsplash",
        type: "encrypted",
        placeholder: "Enter your Unsplash API key",
      },
    ],
  },
  {
    title: "Wallpaper Engine",
    description: "Configure Wallpaper Engine integration",
    icon: Monitor,
    settings: [
      {
        key: "wallpaperEngine.apiKey",
        title: "Steam API Key",
        description: "Required for downloading wallpapers from Steam Workshop",
        type: "encrypted",
        placeholder: "Enter your Steam API key",
      },
      {
        key: "wallpaperEngine.assetsFolder",
        title: "Assets Path",
        description: "Location of Wallpaper Engine assets",
        type: "folder",
        placeholder: "Enter Wallpaper Engine assets folder",
      },
      {
        key: "wallpaperEngine.wallpaperFolders",
        title: "Wallpaper Folders",
        description: "Additional folders to scan for wallpapers",
        type: "folder-list",
      },
    ],
  },
  {
    title: "Images",
    description: "Configure local image sources",
    icon: Image,
    settings: [
      {
        key: "image.wallpaperFolders",
        title: "Wallpaper Folders",
        description: "Local folders containing wallpaper images",
        type: "folder-list",
      },
    ],
  },
  {
    title: "Videos",
    description: "Configure local video sources",
    icon: Image,
    settings: [
      {
        key: "video.wallpaperFolders",
        title: "Wallpaper Folders",
        description: "Local folders containing wallpaper videos",
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
          <SettingsItem key={setting.key} setting={setting} />
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
      return <InputSetting settingKey={setting.key} placeholder={setting.placeholder || ""} />;
    case "folder":
      return (
        <InputSetting
          settingKey={setting.key}
          placeholder={setting.placeholder || ""}
          filePicker="folder"
        />
      );
    case "encrypted":
      return (
        <InputSetting settingKey={setting.key} placeholder={setting.placeholder || ""} encrypt />
      );
    case "boolean":
      return <BooleanSetting settingKey={setting.key} />;
    case "folder-list":
      return <FolderListSetting settingKey={setting.key} />;
    case "theme":
      return <ThemeSetting />;
    case "template-list":
      return <TemplateListSetting settingKey={setting.key} />;
    default:
      return <div>Unknown setting type</div>;
  }
};

export default SettingsTab;
