import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@renderer/providers/theme-provider";
import {
  ExternalLink,
  EyeIcon,
  EyeOffIcon,
  Folder,
  Image,
  Loader2,
  Monitor,
  Plus,
  Settings,
  Trash2,
  Moon,
  Sun,
  Palette,
  LucideIcon,
} from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Card, CardHeader, CardContent, CardTitle } from "@renderer/components/ui/card";
import { Switch } from "@renderer/components/ui/switch";
import { toast } from "sonner";
import { client } from "@renderer/lib/trpc";
import { RouterInputs } from "@electron/trpc/router/base";

type SettingKey = RouterInputs["settings"]["get"]["key"];

// ========================================================================================
// SETTINGS CONFIGURATION
// ========================================================================================

interface SettingConfig {
  key: SettingKey;
  title: string;
  description?: string;
  type: "input" | "folder" | "encrypted" | "boolean" | "folder-list" | "theme";
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
    title: "General",
    description: "Basic application settings",
    icon: Settings,
    settings: [
      {
        key: "theme:output-path",
        title: "Theme Output Path",
        description: "Where generated themes will be saved",
        type: "folder",
        placeholder: "Enter theme output path",
      },
    ],
  },
  {
    title: "Unsplash",
    description: "Configure Unsplash integration",
    icon: Monitor,
    settings: [
      {
        key: "unsplash:api-key",
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
        key: "pexels:api-key",
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
        key: "wallpaper-engine:api-key",
        title: "Steam API Key",
        description: "Required for downloading wallpapers from Steam Workshop",
        type: "encrypted",
        placeholder: "Enter your Steam API key",
      },
      {
        key: "wallpaper-engine:assets-folder",
        title: "Assets Path",
        description: "Location of Wallpaper Engine assets",
        type: "folder",
        placeholder: "Enter Wallpaper Engine assets folder",
      },
      {
        key: "wallpaper-engine:wallpaper-folders",
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
        key: "image:wallpaper-folders",
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
        key: "video:wallpaper-folders",
        title: "Wallpaper Folders",
        description: "Local folders containing wallpaper videos",
        type: "folder-list",
      },
    ],
  },
];

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

const SettingsTab = () => {
  return (
    <ScrollArea className="mx-auto h-[95vh] max-w-4xl p-6">
      <div className="space-y-8">
        {SETTINGS_CONFIG.map((section) => (
          <SettingsSection key={section.title} section={section} />
        ))}
      </div>
    </ScrollArea>
  );
};

// ========================================================================================
// SECTION COMPONENTS
// ========================================================================================

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
        <SettingInput setting={setting} />
      </div>
    </div>
  );
};

// ========================================================================================
// DYNAMIC SETTING INPUT COMPONENT
// ========================================================================================

const SettingInput = ({ setting }: { setting: SettingConfig }) => {
  switch (setting.type) {
    case "input":
      return <InputSetting settingKey={setting.key} placeholder={setting.placeholder || ""} />;
    case "folder":
      return (
        <InputSetting settingKey={setting.key} placeholder={setting.placeholder || ""} folder />
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
    default:
      return <div>Unknown setting type</div>;
  }
};

// ========================================================================================
// INDIVIDUAL SETTING COMPONENTS
// ========================================================================================

const ThemeSetting = () => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={isDarkMode}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <div className="flex items-center gap-2">
        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span className="text-sm">{isDarkMode ? "Dark" : "Light"}</span>
      </div>
    </div>
  );
};

const InputSetting = ({
  settingKey,
  placeholder,
  encrypt = false,
  folder = false,
}: {
  settingKey: SettingKey;
  placeholder: string;
  encrypt?: boolean;
  folder?: boolean;
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const queryClient = useQueryClient();

  const {
    data: value,
    isPending,
    isError,
  } = useQuery({
    queryKey: [settingKey],
    queryFn: async () => {
      return await client.settings.get.query({
        key: settingKey,
        decrypt: encrypt,
      });
    },
  });

  const setValue = useMutation({
    mutationFn: async (value: string) => {
      await client.settings.set.mutate({
        key: settingKey,
        value: value,
        encrypt: encrypt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isPending) {
    return (
      <div className="flex gap-2">
        <div className="bg-muted flex h-10 flex-1 items-center rounded-md border px-3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
        {folder && (
          <Button variant="outline" disabled>
            <Folder className="mr-2 h-4 w-4" />
            Browse
          </Button>
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="border-destructive bg-destructive/10 flex h-10 flex-1 items-center rounded-md border px-3">
            <span className="text-destructive text-sm">Failed to load setting</span>
          </div>
          {folder && (
            <Button variant="outline" disabled>
              <Folder className="mr-2 h-4 w-4" />
              Browse
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: [settingKey] })}
          className="h-8"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type={encrypt && !showPassword ? "password" : "text"}
          placeholder={placeholder}
          value={(value as string) || ""}
          onChange={(event) => {
            setValue.mutate(event.target.value);
          }}
          disabled={setValue.isPending}
        />
        {encrypt && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </Button>
        )}
      </div>
      {folder && (
        <Button
          variant="outline"
          disabled={setValue.isPending}
          onClick={async () => {
            const path = await client.file.pickFolder.mutate();
            if (path) {
              setValue.mutate(path);
            }
          }}
        >
          {setValue.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Folder className="mr-2 h-4 w-4" />
          )}
          Browse
        </Button>
      )}
    </div>
  );
};

const BooleanSetting = ({ settingKey }: { settingKey: SettingKey }) => {
  const queryClient = useQueryClient();

  const {
    data: value,
    isPending,
    isError,
  } = useQuery({
    queryKey: [settingKey],
    queryFn: async () => {
      return await client.settings.get.query({
        key: settingKey,
      });
    },
  });

  const setValue = useMutation({
    mutationFn: async (value: boolean) => {
      await client.settings.set.mutate({
        key: settingKey,
        value: value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <span className="text-destructive text-sm">Failed to load setting</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: [settingKey] })}
          className="h-8"
        >
          Retry
        </Button>
      </div>
    );
  }

  const isEnabled = Boolean(value);

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={isEnabled}
        onCheckedChange={(checked) => setValue.mutate(checked)}
        disabled={setValue.isPending}
      />
      {setValue.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
};

const FolderListSetting = ({ settingKey }: { settingKey: SettingKey }) => {
  const queryClient = useQueryClient();

  const {
    data: paths,
    isPending,
    isError,
  } = useQuery({
    queryKey: [settingKey],
    queryFn: async () => {
      return await client.settings.get.query({
        key: settingKey,
      });
    },
  });

  const addPathMutation = useMutation({
    mutationFn: async () => {
      await client.settings.addFolder.mutate({
        key: settingKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deletePathMutation = useMutation({
    mutationFn: async (path: string) => {
      await client.settings.deleteFolder.mutate({
        key: settingKey,
        folder: path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isPending) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive text-sm">Failed to load folders</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: [settingKey] })}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paths?.length > 0 && (
        <div className="grid gap-3">
          {paths.map((path) => (
            <Card key={path} className="group hover:bg-muted/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-muted rounded-lg p-2">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{path.split("/").pop()}</p>
                      <p className="text-muted-foreground truncate text-xs">{path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        client.file.openInExplorer.mutate({
                          path,
                        })
                      }
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePathMutation.mutate(path)}
                      disabled={deletePathMutation.isPending}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {deletePathMutation.isPending && deletePathMutation.variables === path ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        onClick={() => addPathMutation.mutate()}
        variant="outline"
        className="h-12 w-full border-dashed"
        disabled={addPathMutation.isPending}
      >
        {addPathMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Add Folder
      </Button>

      {!paths ||
        (paths?.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            <Folder className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No folders added yet</p>
          </div>
        ))}
    </div>
  );
};

export default SettingsTab;
