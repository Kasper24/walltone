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

export type SetApplyDialogValues = React.Dispatch<React.SetStateAction<ApplyDialogValues>>;
