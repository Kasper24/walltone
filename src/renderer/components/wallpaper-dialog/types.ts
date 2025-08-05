export interface DynamicControlDefinition {
  type: "range" | "boolean" | "select";
  key: string;
  title: string;
  description: string;
  defaultValue: string | number | boolean;
  options?: {
    min?: number;
    max?: number;
    step?: number;
    values?: { key: string; text: string }[];
  };
}

export interface DynamicControlValues {
  [key: string]: string | number | boolean;
}

// export type SetDynamicControlValues = React.Dispatch<DynamicControlValues>;
export type SetDynamicControlValues = React.Dispatch<React.SetStateAction<DynamicControlValues>>;
