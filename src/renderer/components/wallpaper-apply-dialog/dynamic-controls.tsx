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
import {
  DynamicControlDefinition,
  DynamicControlValues,
  SetDynamicControlValues,
} from "@renderer/components/wallpaper-dialog/types.js";

export const DynamicControls = ({
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

export const DynamicControl = ({
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

export const RangeControl = ({
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

export const BooleanControl = ({
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

export const SelectControl = ({
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
