import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@renderer/providers/theme-provider";
import {
  FileText,
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
  Terminal,
} from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@renderer/components/ui/card";
import { Switch } from "@renderer/components/ui/switch";
import { toast } from "sonner";
import { client } from "@renderer/lib/trpc";
import { RouterInputs } from "@electron/main/trpc/routes/base";

type SettingKey = RouterInputs["settings"]["get"]["key"];

// ========================================================================================
// SETTINGS CONFIGURATION
// ========================================================================================

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
    title: "Templates",
    description: "Manage templates",
    icon: Settings,
    settings: [
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

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

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

const SettingInput = ({ setting }: { setting: SettingConfig }) => {
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

interface InputSettingProps {
  settingKey: SettingKey;
  nestedSettingPath?: (string | number)[];
  encrypt?: boolean;
  filePicker?: "file" | "folder";
  placeholder?: string;
  showOpenInExplorerButton?: boolean;
}

const InputSetting = ({
  settingKey,
  nestedSettingPath,
  placeholder = "",
  encrypt = false,
  filePicker,
  showOpenInExplorerButton = false,
}: InputSettingProps) => {
  const queryClient = useQueryClient();
  const queryKey = nestedSettingPath ? [settingKey, ...nestedSettingPath] : [settingKey];
  const [localValue, setLocalValue] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    data: value,
    isPending,
    isError,
  } = useQuery({
    queryKey: queryKey,
    queryFn: async () =>
      await client.settings.get.query({
        key: settingKey,
        path: nestedSettingPath,
        decrypt: encrypt,
      }),
  });

  React.useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const onBlurMutation = useMutation({
    mutationFn: async (value: string) => {
      await client.settings.set.mutate({
        key: settingKey,
        path: nestedSettingPath,
        value: value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onBrowseFolderMutation = useMutation({
    mutationFn: async () => {
      await client.settings.set.mutate({
        key: settingKey,
        path: nestedSettingPath,
        filePicker,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
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
        {filePicker && (
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
          {filePicker && (
            <Button variant="outline" disabled>
              <Folder className="mr-2 h-4 w-4" />
              Browse
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKey })}
          className="h-8"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-2">
      <div className="relative flex-1">
        <Input
          value={localValue}
          type={encrypt && !showPassword ? "password" : "text"}
          placeholder={placeholder}
          onChange={(e) => {
            setLocalValue(e.target.value);
          }}
          onBlur={(e) => {
            onBlurMutation.mutate(e.target.value);
          }}
          disabled={onBlurMutation.isPending}
        />
        {encrypt && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
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
      {filePicker && (
        <Button
          size="sm"
          variant="ghost"
          disabled={onBlurMutation.isPending}
          onClick={() => onBrowseFolderMutation.mutate()}
        >
          {onBlurMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
        </Button>
      )}
      {filePicker && showOpenInExplorerButton && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            client.file.openInExplorer.mutate({
              path: localValue,
            })
          }
        >
          <ExternalLink className="h-4 w-4" />
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
      await client.settings.add.mutate({
        filePicker: "folder",
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
    mutationFn: async (index: number) => {
      await client.settings.delete.mutate({
        key: settingKey,
        index,
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
    <Card>
      <CardContent className="space-y-3">
        {paths?.map((path: string, index: number) => (
          <div className="flex gap-2" key={index}>
            <InputSetting
              key={path}
              settingKey={settingKey}
              nestedSettingPath={[index]}
              placeholder="Enter folder path"
              filePicker="folder"
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => deletePathMutation.mutate(index)}
            >
              {deletePathMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}

        {(!paths || paths?.length === 0) && (
          <div className="text-muted-foreground py-8 text-center">
            <Folder className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No folders added yet</p>
          </div>
        )}

        <Button
          onClick={() => addPathMutation.mutate()}
          variant="outline"
          className="w-full border-dashed"
          disabled={addPathMutation.isPending}
        >
          {addPathMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Folder
        </Button>
      </CardContent>
    </Card>
  );
};

const TemplateListSetting = ({ settingKey }: { settingKey: SettingKey }) => {
  const queryClient = useQueryClient();

  const {
    data: templates,
    isPending,
    isError,
  } = useQuery({
    queryKey: [settingKey],
    queryFn: async () => {
      return await client.settings.get.query({ key: settingKey });
    },
  });

  const addTemplateMutation = useMutation({
    mutationFn: async () => {
      await client.settings.add.mutate({
        key: "theme.templates",
        value: { src: "", dest: "", postHook: "" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (index: number) => {
      await client.settings.delete.mutate({ key: "theme.templates", index });
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
        <p className="text-destructive text-sm">Failed to load templates</p>
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
    <Card className="space-y-3">
      <CardContent className="space-y-3">
        {templates?.length > 0 && (
          <div className="grid gap-3">
            {templates?.map((_, idx: number) => (
              <div className="space-y-3">
                {/* Source file row */}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-muted-foreground w-12 text-xs font-medium">Source:</span>
                  <InputSetting
                    settingKey={settingKey}
                    nestedSettingPath={[idx, "src"]}
                    placeholder="Enter source template file"
                    showOpenInExplorerButton
                    filePicker="file"
                  />
                </div>

                {/* Destination file row */}
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="text-muted-foreground w-12 text-xs font-medium">Dest:</span>
                  <InputSetting
                    settingKey={settingKey}
                    nestedSettingPath={[idx, "dest"]}
                    placeholder="Enter destination directory"
                    filePicker="folder"
                    showOpenInExplorerButton
                  />
                </div>

                {/* Post hook row */}
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-muted-foreground w-12 text-xs font-medium">Post Hook:</span>
                  <InputSetting
                    settingKey={settingKey}
                    nestedSettingPath={[idx, "postHook"]}
                    placeholder="Enter post hook command"
                  />
                </div>

                {/* Delete button */}
                <Button
                  className="w-full flex-1"
                  variant="destructive"
                  onClick={() => deleteTemplateMutation.mutate(idx)}
                >
                  {deleteTemplateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}

        {(!templates || templates?.length === 0) && (
          <div className="text-muted-foreground py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No templates added yet</p>
          </div>
        )}

        <Button
          onClick={() => addTemplateMutation.mutate()}
          variant="outline"
          className="w-full border-dashed"
          disabled={addTemplateMutation.isPending}
        >
          {addTemplateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Template
        </Button>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
