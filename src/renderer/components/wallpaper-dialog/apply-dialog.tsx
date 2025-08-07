import React from "react";
import { Check, Monitor as MonitorIcon, Loader2 } from "lucide-react";
import { type Monitor } from "@electron/main/trpc/routes/monitor/index.js";
import { type BaseWallpaper } from "@electron/main/trpc/routes/wallpaper/index.js";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@renderer/components/ui/dialog.js";
import { Button } from "@renderer/components/ui/button.js";
import { Checkbox } from "@renderer/components/ui/checkbox.js";
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select.js";
import { Slider } from "@renderer/components/ui/slider.js";
import { Switch } from "@renderer/components/ui/switch.js";
import { Label } from "@renderer/components/ui/label.js";
import { ScrollArea } from "@renderer/components/ui/scroll-area.js";
import { OnWallpaperApply } from "@renderer/components/wallpapers-grid/types.js";
import { useMonitorSelection, useWallpaperActions } from "./hooks.js";
import {
  DynamicControlDefinition,
  DynamicControlValues,
  SetDynamicControlValues,
} from "./types.js";

const ApplyWallpaperDialog = <T extends BaseWallpaper>({
  wallpaper,
  onApply,
  scalingOptions,
  controlDefinitions,
}: {
  wallpaper: T;
  onApply?: OnWallpaperApply<T>;
  scalingOptions?: { key: string; text: string }[];
  controlDefinitions?: DynamicControlDefinition[];
}) => {
  const {
    data: monitors,
    isPending,
    isError,
    selectedMonitors,
    monitorScalingMethods,
    toggleMonitor,
    updateScalingMethod,
    selectAll,
    selectNone,
    retryQuery,
  } = useMonitorSelection(scalingOptions);

  const { applyMutation } = useWallpaperActions(wallpaper);

  const [controlValues, setControlValues] = React.useState<DynamicControlValues>(() => {
    const initialValues: DynamicControlValues = {};
    controlDefinitions?.forEach((control) => {
      initialValues[control.key] = control.defaultValue;
    });
    return initialValues;
  });

  const handleApply = React.useCallback(() => {
    if (onApply) {
      const monitorConfigs = Array.from(selectedMonitors).map((id) => ({
        id,
        scalingMethod: monitorScalingMethods[id] || scalingOptions?.[0]?.key || "fill",
      }));
      applyMutation.mutate({
        onApply,
        monitorConfigs,
        controlValues, // Pass the control values separately
      });
    }
  }, [
    onApply,
    selectedMonitors,
    monitorScalingMethods,
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
    <DialogContent className="select-none">
      <DialogHeader className="space-y-2">
        <DialogTitle className="line-clamp-1">Apply Wallpaper: {wallpaper.name}</DialogTitle>
        <DialogDescription>
          Select monitors and configure scaling methods for each display.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] pr-5">
        <div className="space-y-4">
          <WallpaperPreview wallpaper={wallpaper} />

          <QuickSelectionButtons onSelectAll={selectAll} onSelectNone={selectNone} />

          {monitors && monitors.length > 1 && (
            <VisualMonitorLayout
              monitors={monitors}
              selectedMonitors={selectedMonitors}
              onToggleMonitor={toggleMonitor}
            />
          )}

          <MonitorList
            monitors={monitors || []}
            selectedMonitors={selectedMonitors}
            monitorScalingMethods={monitorScalingMethods}
            scalingOptions={scalingOptions}
            onToggleMonitor={toggleMonitor}
            onUpdateScalingMethod={updateScalingMethod}
          />

          {controlDefinitions && controlDefinitions.length > 0 && (
            <DynamicControls
              controlDefinitions={controlDefinitions}
              controlValues={controlValues}
              setControlValues={setControlValues}
            />
          )}

          {selectedMonitors.size === 0 && (
            <div className="text-muted-foreground py-2 text-center text-sm">
              Select at least one monitor to apply the wallpaper
            </div>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="flex-row justify-end space-x-2 pr-5">
        <DialogClose asChild>
          <Button disabled={selectedMonitors.size === 0} onClick={handleApply}>
            Apply to {selectedMonitors.size} Monitor{selectedMonitors.size !== 1 ? "s" : ""}
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
        <MonitorIcon className="text-destructive h-6 w-6" />
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
      {wallpaper.type !== "video" ? (
        <img
          className="h-20 w-32 rounded-md object-cover"
          src={wallpaper.thumbnailPath}
          alt={wallpaper.name}
        />
      ) : (
        <video
          className="h-20 w-32 rounded-md object-fill"
          src={wallpaper.thumbnailPath}
          autoPlay
          loop
          muted
          playsInline
        ></video>
      )}
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
  monitors,
  selectedMonitors,
  onToggleMonitor,
}: {
  monitors: Monitor[];
  selectedMonitors: Set<string>;
  onToggleMonitor: (id: string) => void;
}) => {
  const getRelativePosition = (monitor: Monitor, monitors: Monitor[]) => {
    if (monitors.length <= 1) return { left: 0, top: 0, width: 100, height: 100 };

    const minX = Math.min(...monitors.map((s) => s.x));
    const minY = Math.min(...monitors.map((s) => s.y));
    const maxX = Math.max(
      ...monitors.map((s) => {
        return s.x + s.width;
      })
    );
    const maxY = Math.max(
      ...monitors.map((s) => {
        return s.y + s.height;
      })
    );

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    return {
      left: ((monitor.x - minX) / totalWidth) * 100,
      top: ((monitor.y - minY) / totalHeight) * 100,
      width: (monitor.width / totalWidth) * 100,
      height: (monitor.height / totalHeight) * 100,
    };
  };

  return (
    <div className="bg-muted/20 relative h-32 rounded-lg border p-4">
      {monitors.map((monitor) => {
        const position = getRelativePosition(monitor, monitors);
        const isSelected = selectedMonitors.has(monitor.id);

        return (
          <div
            key={monitor.id}
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
            onClick={() => onToggleMonitor(monitor.id)}
          >
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MonitorIcon className="mx-auto mb-1 h-4 w-4" />
                <div className="text-xs font-medium">{monitor.id}</div>
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
  monitors,
  selectedMonitors,
  monitorScalingMethods,
  scalingOptions,
  onToggleMonitor,
  onUpdateScalingMethod,
}: {
  monitors: Monitor[];
  selectedMonitors: Set<string>;
  monitorScalingMethods: Record<string, string>;
  scalingOptions?: { key: string; text: string }[];
  onToggleMonitor: (id: string) => void;
  onUpdateScalingMethod: (id: string, scalingMethod: string) => void;
}) => {
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {monitors.map((monitor) => {
        const isSelected = selectedMonitors.has(monitor.id);
        const currentScalingMethod =
          monitorScalingMethods[monitor.id] || scalingOptions?.[0]?.key || "fill";

        return (
          <Card key={monitor.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-start space-x-3">
                <div className="pt-0.5">
                  <Checkbox
                    id={monitor.id}
                    checked={isSelected}
                    onCheckedChange={() => onToggleMonitor(monitor.id)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <MonitorIcon className="h-4 w-4" />
                    <span className="font-medium">
                      {monitor.name}
                      <span className="text-muted-foreground ml-2 text-xs">({monitor.id})</span>
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {monitor.width} × {monitor.height}
                    {monitor.scale !== 1 && <span className="ml-2">• Scale: {monitor.scale}x</span>}
                  </div>

                  {isSelected && scalingOptions && scalingOptions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <label className="text-muted-foreground text-xs font-medium">Scaling:</label>
                      <Select
                        value={currentScalingMethod}
                        onValueChange={(value) => onUpdateScalingMethod(monitor.id, value)}
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
  controlValues: DynamicControlValues;
  setControlValues: SetDynamicControlValues;
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
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}) => {
  switch (control.type) {
    case "range":
      return <RangeControl control={control} value={value as number} onChange={onChange} />;
    case "boolean":
      return <BooleanControl control={control} value={value as boolean} onChange={onChange} />;
    case "select":
      return <SelectControl control={control} value={value as string} onChange={onChange} />;
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
