import React from "react";
import {
  FileText,
  ExternalLink,
  EyeIcon,
  EyeOffIcon,
  Folder,
  Loader2,
  Plus,
  Trash2,
  Moon,
  Sun,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { type SettingKey, type SettingsSchema } from "@electron/main/trpc/routes/settings.js";
import { useTheme } from "@renderer/providers/theme/hook.js";
import { Button } from "@renderer/components/ui/button.js";
import { Input } from "@renderer/components/ui/input.js";
import { Card, CardContent } from "@renderer/components/ui/card.js";
import { Switch } from "@renderer/components/ui/switch.js";
import { Slider } from "@renderer/components/ui/slider.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select.js";
import { client } from "@renderer/lib/trpc.js";
import { useDebouncedCallback } from "use-debounce";

function useSettings<T>({
  settingKey,
  encrypted = false,
}: {
  settingKey: SettingKey | string;
  encrypted?: boolean;
}) {
  const queryClient = useQueryClient();
  const [localValue, setLocalValue] = React.useState<T | undefined>();

  const {
    data: value,
    isPending,
    isError,
  } = useQuery({
    queryKey: [settingKey],
    queryFn: async () => await client.settings.get.query({ key: settingKey, decrypt: encrypted }),
  });

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const setValueMutation = useMutation({
    mutationFn: async (newValue: T) => {
      await client.settings.set.mutate({
        key: settingKey,
        value: newValue,
        encrypt: encrypted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setValueMutationDebounced = useDebouncedCallback((value) => {
    setValueMutation.mutate(value);
  }, 200);

  const addTemplateMutation = useMutation({
    mutationFn: async (value: unknown) => {
      await client.settings.add.mutate({
        key: settingKey,
        value,
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
      await client.settings.delete.mutate({ key: settingKey, index });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onBrowseFolderMutation = useMutation({
    mutationFn: async (type: "file" | "folder") => {
      await client.settings.set.mutate({
        key: settingKey,
        filePicker: type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [settingKey] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onChange = (value: T) => {
    setLocalValue(value);
    setValueMutationDebounced(value);
  };

  return {
    isPending,
    isError,
    value: localValue,
    onChange,
    onAdd: addTemplateMutation.mutate,
    onDelete: deleteTemplateMutation.mutate,
    onBrowseFolder: onBrowseFolderMutation.mutate,
  };
}

const Error = ({ settingKey }: { settingKey: SettingKey | string }) => {
  const queryClient = useQueryClient();

  return (
    <div className="py-8 text-center">
      <p className="text-destructive text-sm">Failed to load</p>
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
};

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
  settingKey: SettingKey | string;
  encrypted?: boolean;
  filePicker?: "file" | "folder";
  placeholder?: string;
  showOpenInExplorerButton?: boolean;
}

const InputSetting = ({
  settingKey,
  placeholder = "",
  encrypted = false,
  filePicker,
  showOpenInExplorerButton = false,
}: InputSettingProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { isPending, isError, value, onChange, onBrowseFolder } = useSettings({
    settingKey,
    encrypted,
  });

  const onOpenInExplorerMutation = useMutation({
    mutationFn: async () => {
      await client.file.openInExplorer.mutate({
        path: value as string,
      });
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
    return <Error settingKey={settingKey} />;
  }

  return (
    <div className="flex flex-1 gap-2">
      <div className="relative flex-1">
        <Input
          value={value as string}
          type={encrypted && !showPassword ? "password" : "text"}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
        {isPending && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
        {encrypted && (
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
          disabled={isPending}
          onClick={() => onBrowseFolder(filePicker)}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
        </Button>
      )}
      {filePicker && showOpenInExplorerButton && (
        <Button size="sm" variant="ghost" onClick={() => onOpenInExplorerMutation.mutate()}>
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

const BooleanSetting = ({ settingKey }: { settingKey: SettingKey }) => {
  const { isPending, isError, value, onChange } = useSettings({ settingKey });

  if (isPending) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <Error settingKey={settingKey} />;
  }

  const isEnabled = Boolean(value);

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={isEnabled}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={isPending}
      />
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
};

interface DropdownSettingProps {
  settingKey: SettingKey | string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const DropdownSetting = ({
  settingKey,
  options,
  placeholder = "Select an option",
}: DropdownSettingProps) => {
  const { isPending, isError, value, onChange } = useSettings({ settingKey });

  if (isPending) {
    return (
      <div className="flex gap-2">
        <div className="bg-muted flex h-10 flex-1 items-center rounded-md border px-3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return <Error settingKey={settingKey} />;
  }

  return (
    <Select
      value={value as string}
      onValueChange={(newValue) => onChange(newValue)}
      disabled={isPending}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
        {isPending && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface SliderSettingProps {
  settingKey: SettingKey | string;
  min?: number;
  max?: number;
  step?: number;
}

const SliderSetting = ({ settingKey, min = 0, max = 1, step = 0.01 }: SliderSettingProps) => {
  const { isPending, isError, value, onChange } = useSettings({ settingKey });

  if (isPending) {
    return (
      <div className="flex h-10 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <Error settingKey={settingKey} />;
  }

  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[value as number]}
        onValueChange={(vals) => {
          onChange(vals[0]);
        }}
        min={min}
        max={max}
        step={step}
        disabled={isPending}
      />
      <Input
        className="w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        type="number"
        value={value as number}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const val = Number(e.target.value);
          onChange(val);
        }}
      />
    </div>
  );
};

const FolderListSetting = ({ settingKey }: { settingKey: SettingKey }) => {
  const { isPending, isError, value, onAdd, onDelete } = useSettings<string[]>({ settingKey });

  const pathsWithId = React.useMemo(
    () => value?.map((path) => ({ id: uuidv4(), value: path })),
    [value]
  );

  if (isPending) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <Error settingKey={settingKey} />;
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        {pathsWithId?.map((path, index: number) => (
          <div className="flex gap-2" key={path.id}>
            <InputSetting
              settingKey={`${settingKey}[${index}]`}
              placeholder="Enter folder path"
              filePicker="folder"
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(index)}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}

        {(!pathsWithId || pathsWithId?.length === 0) && (
          <div className="text-muted-foreground py-8 text-center">
            <Folder className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No folders added yet</p>
          </div>
        )}

        <Button
          onClick={() => onAdd("")}
          variant="outline"
          className="w-full border-dashed"
          disabled={isPending}
        >
          {isPending ? (
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
  const { isPending, isError, value, onAdd, onDelete } = useSettings<
    SettingsSchema["themeOutput"]["templates"]
  >({
    settingKey,
  });

  const templatesWithId = React.useMemo(
    () => value?.map((tpl) => ({ id: uuidv4(), ...tpl })),
    [value]
  );

  if (isPending) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <Error settingKey={settingKey} />;
  }

  return (
    <Card className="space-y-3">
      <CardContent className="space-y-3">
        {templatesWithId && templatesWithId?.length > 0 && (
          <div className="grid gap-3">
            {templatesWithId?.map((tpl, index: number) => (
              <div className="space-y-3" key={tpl.id}>
                {/* Source file row */}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-muted-foreground w-12 text-xs font-medium">Source:</span>
                  <InputSetting
                    settingKey={`${settingKey}[${index}].src`}
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
                    settingKey={`${settingKey}[${index}].dest`}
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
                    settingKey={`${settingKey}[${index}].postHook`}
                    placeholder="Enter post hook command"
                  />
                </div>

                {/* Delete button */}
                <Button
                  className="w-full flex-1"
                  variant="destructive"
                  onClick={() => onDelete(index)}
                >
                  {isPending ? (
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
        {(!templatesWithId || templatesWithId?.length === 0) && (
          <div className="text-muted-foreground py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No templates added yet</p>
          </div>
        )}
        <Button
          onClick={() => onAdd({ src: "", dest: "", postHook: "" })}
          variant="outline"
          className="w-full border-dashed"
          disabled={isPending}
        >
          {isPending ? (
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

export {
  ThemeSetting,
  InputSetting,
  BooleanSetting,
  DropdownSetting,
  SliderSetting,
  FolderListSetting,
  TemplateListSetting,
};
