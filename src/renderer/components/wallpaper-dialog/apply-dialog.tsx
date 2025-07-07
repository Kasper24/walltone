import React from "react";
import { Check, Monitor, Loader2 } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@renderer/components/ui/dialog";
import { Button } from "@renderer/components/ui/button";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { Slider } from "@renderer/components/ui/slider";
import { Switch } from "@renderer/components/ui/switch";
import { BaseWallpaper } from "@electron/trpc/router/wallpaper";
import { RouterOutputs } from "@electron/trpc/router/base";
import { OnWallpaperApply } from "../wallpapers-grid/types";
import { useScreenSelection, useWallpaperActions } from "./hooks";
import { getCurrentResolution, getRelativePosition } from "./utils";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";

type Screen = RouterOutputs["monitor"]["getAll"][number];

// Add new types for dynamic controls
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

export interface ApplyDialogValues {
  [key: string]: any;
}

const ApplyWallpaperDialog = ({
  wallpaper,
  onApply,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: BaseWallpaper;
  onApply?: OnWallpaperApply;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const {
    data: screens,
    isPending,
    isError,
    selectedScreens,
    screenScalingMethods,
    toggleScreen,
    updateScalingMethod,
    selectAll,
    selectNone,
    retryQuery,
  } = useScreenSelection(scalingOptions);

  const { applyMutation } = useWallpaperActions(wallpaper);

  // Initialize dynamic control values
  const [controlValues, setControlValues] = React.useState<ApplyDialogValues>(() => {
    const initialValues: ApplyDialogValues = {};
    controlDefinitions?.forEach((control) => {
      initialValues[control.key] = control.defaultValue;
    });
    return initialValues;
  });

  const handleApply = React.useCallback(() => {
    if (onApply) {
      const screenConfigs = Array.from(selectedScreens).map((name) => ({
        name,
        scalingMethod: screenScalingMethods[name] || scalingOptions?.[0]?.key || "fill",
      }));
      applyMutation.mutate({
        onApply,
        screenConfigs,
        controlValues, // Pass the control values separately
      });
    }
  }, [
    onApply,
    selectedScreens,
    screenScalingMethods,
    scalingOptions,
    controlValues,
    applyMutation,
  ]);

  if (isPending) {
    return <ApplyDialogSkeleton />;
  }

  if (isError) {
    return <ApplyDialogError onRetry={retryQuery} />;
  }

  return (
    <DialogContent className="max-h-[80vh] max-w-[700px] select-none">
      <DialogHeader className="space-y-2">
        <DialogTitle className="line-clamp-1">Apply Wallpaper: {wallpaper.name}</DialogTitle>
        <DialogDescription>
          Select monitors and configure scaling methods for each display.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-4 pr-4">
          <WallpaperPreview wallpaper={wallpaper} />

          <QuickSelectionButtons onSelectAll={selectAll} onSelectNone={selectNone} />

          {screens && screens.length > 1 && (
            <VisualMonitorLayout
              screens={screens}
              selectedScreens={selectedScreens}
              onToggleScreen={toggleScreen}
            />
          )}

          <MonitorList
            screens={screens || []}
            selectedScreens={selectedScreens}
            screenScalingMethods={screenScalingMethods}
            scalingOptions={scalingOptions}
            onToggleScreen={toggleScreen}
            onUpdateScalingMethod={updateScalingMethod}
          />

          {controlDefinitions && controlDefinitions.length > 0 && (
            <DynamicControls
              controlDefinitions={controlDefinitions}
              controlValues={controlValues}
              setControlValues={setControlValues}
            />
          )}

          {selectedScreens.size === 0 && (
            <div className="text-muted-foreground py-2 text-center text-sm">
              Select at least one monitor to apply the wallpaper
            </div>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="flex-row justify-end space-x-2">
        <DialogClose asChild>
          <Button disabled={selectedScreens.size === 0} onClick={handleApply}>
            Apply to {selectedScreens.size} Monitor{selectedScreens.size !== 1 ? "s" : ""}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

const ApplyDialogSkeleton = () => {
  return (
    <DialogContent className="">
      <div className="bg-muted/20 relative h-32 rounded-lg border p-4">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <span className="text-muted-foreground text-sm">Loading monitors...</span>
          </div>
        </div>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto">
        {Array.from({ length: 1 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="bg-muted h-4 w-4 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="bg-muted h-4 w-4 rounded"></div>
                    <div className="bg-muted h-4 w-32 rounded"></div>
                  </div>
                  <div className="bg-muted h-3 w-48 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DialogContent>
  );
};

const ApplyDialogError = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <DialogContent className="py-8 text-center">
      <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Monitor className="text-destructive h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">Failed to load monitors</h3>
      <p className="text-muted-foreground text-sm">
        Unable to detect available monitors. Please check your display settings.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </DialogContent>
  );
};

const WallpaperPreview = ({ wallpaper }: { wallpaper: BaseWallpaper }) => {
  return (
    <div className="flex justify-center">
      <img
        src={wallpaper.previewPath}
        alt={wallpaper.name}
        className="h-20 w-32 rounded-md object-cover"
      />
    </div>
  );
};

const QuickSelectionButtons = ({
  onSelectAll,
  onSelectNone,
}: {
  onSelectAll: () => void;
  onSelectNone: () => void;
}) => {
  return (
    <div className="flex justify-center gap-2">
      <Button variant="outline" size="sm" onClick={onSelectAll}>
        Select All
      </Button>
      <Button variant="outline" size="sm" onClick={onSelectNone}>
        Select None
      </Button>
    </div>
  );
};

const VisualMonitorLayout = ({
  screens,
  selectedScreens,
  onToggleScreen,
}: {
  screens: Screen[];
  selectedScreens: Set<string>;
  onToggleScreen: (name: string) => void;
}) => {
  return (
    <div className="bg-muted/20 relative h-32 rounded-lg border p-4">
      {screens.map((screen) => {
        const position = getRelativePosition(screen, screens);
        const isSelected = selectedScreens.has(screen.name);

        return (
          <div
            key={screen.name}
            className={`absolute cursor-pointer rounded border-2 transition-all ${
              isSelected
                ? "border-primary bg-primary/20"
                : "border-muted-foreground/40 bg-background hover:border-primary/60"
            }`}
            style={{
              left: `${position.left}%`,
              top: `${position.top}%`,
              width: `${position.width}%`,
              height: `${position.height}%`,
              minWidth: "60px",
              minHeight: "40px",
            }}
            onClick={() => onToggleScreen(screen.name)}
          >
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Monitor className="mx-auto mb-1 h-4 w-4" />
                <div className="text-xs font-medium">{screen.name}</div>
                {isSelected && <Check className="text-primary mx-auto mt-1 h-3 w-3" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MonitorList = ({
  screens,
  selectedScreens,
  screenScalingMethods,
  scalingOptions,
  onToggleScreen,
  onUpdateScalingMethod,
}: {
  screens: Screen[];
  selectedScreens: Set<string>;
  screenScalingMethods: Record<string, string>;
  scalingOptions?: { key: string; text: string }[];
  onToggleScreen: (name: string) => void;
  onUpdateScalingMethod: (name: string, scalingMethod: string) => void;
}) => {
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {screens.map((screen) => {
        const currentResolution = getCurrentResolution(screen);
        const isSelected = selectedScreens.has(screen.name);
        const currentScalingMethod =
          screenScalingMethods[screen.name] || scalingOptions?.[0]?.key || "fill";

        return (
          <Card key={screen.name} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-start space-x-3">
                <div className="pt-0.5">
                  <Checkbox
                    id={screen.name}
                    checked={isSelected}
                    onCheckedChange={() => onToggleScreen(screen.name)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span className="font-medium">
                      {screen.make} {screen.model}
                      <span className="text-muted-foreground ml-2 text-xs">({screen.name})</span>
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {currentResolution.width} × {currentResolution.height} @{" "}
                    {currentResolution.refresh_rate}Hz
                    {screen.scale !== 1 && <span className="ml-2">• Scale: {screen.scale}x</span>}
                  </div>

                  {isSelected && scalingOptions && scalingOptions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <label className="text-muted-foreground text-xs font-medium">Scaling:</label>
                      <Select
                        value={currentScalingMethod}
                        onValueChange={(value) => onUpdateScalingMethod(screen.name, value)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {scalingOptions.map((option) => (
                            <SelectItem key={option.key} value={option.key} className="text-xs">
                              {option.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ========================================================================================
// DYNAMIC CONTROLS COMPONENTS
// ========================================================================================

const DynamicControls = ({
  controlDefinitions,
  controlValues,
  setControlValues,
}: {
  controlDefinitions: DynamicControlDefinition[];
  controlValues: ApplyDialogValues;
  setControlValues: React.Dispatch<React.SetStateAction<ApplyDialogValues>>;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Additional Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {controlDefinitions.map((control) => (
          <DynamicControl
            key={control.key}
            control={control}
            value={controlValues[control.key]}
            onChange={(value) =>
              setControlValues((prev) => ({
                ...prev,
                [control.key]: value,
              }))
            }
          />
        ))}
      </CardContent>
    </Card>
  );
};

const DynamicControl = ({
  control,
  value,
  onChange,
}: {
  control: DynamicControlDefinition;
  value: any;
  onChange: (value: any) => void;
}) => {
  switch (control.type) {
    case "range":
      return <RangeControl control={control} value={value} onChange={onChange} />;
    case "boolean":
      return <BooleanControl control={control} value={value} onChange={onChange} />;
    case "select":
      return <SelectControl control={control} value={value} onChange={onChange} />;
    default:
      return null;
  }
};

const RangeControl = ({
  control,
  value,
  onChange,
}: {
  control: DynamicControlDefinition;
  value: number;
  onChange: (value: number) => void;
}) => {
  const min = control.options?.min ?? 0;
  const max = control.options?.max ?? 100;
  const step = control.options?.step ?? 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-medium">{control.title}</Label>
          {control.description && (
            <p className="text-muted-foreground text-xs">{control.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {value ?? control.defaultValue ?? min}
          </span>
        </div>
      </div>
      <Slider
        value={[value ?? control.defaultValue ?? min]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

const BooleanControl = ({
  control,
  value,
  onChange,
}: {
  control: DynamicControlDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="space-y-1">
        <Label className="cursor-pointer text-sm font-medium">{control.title}</Label>
        {control.description && (
          <p className="text-muted-foreground text-xs">{control.description}</p>
        )}
      </div>
      <Switch checked={value ?? control.defaultValue ?? false} onCheckedChange={onChange} />
    </div>
  );
};

const SelectControl = ({
  control,
  value,
  onChange,
}: {
  control: DynamicControlDefinition;
  value: string;
  onChange: (value: string) => void;
}) => {
  const options = control.options?.values ?? [];

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{control.title}</Label>
        {control.description && (
          <p className="text-muted-foreground text-xs">{control.description}</p>
        )}
      </div>
      <Select value={value ?? control.defaultValue ?? options[0]?.key} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${control.title.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ApplyWallpaperDialog;
