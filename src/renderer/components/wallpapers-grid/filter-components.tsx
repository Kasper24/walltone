import React from "react";
import { Filter, X, Search, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@renderer/components/ui/sheet.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select.js";
import { Button } from "@renderer/components/ui/button.js";
import { Label } from "@renderer/components/ui/label.js";
import { Badge } from "@renderer/components/ui/badge.js";
import { Checkbox } from "@renderer/components/ui/checkbox.js";
import { Switch } from "@renderer/components/ui/switch.js";
import { Separator } from "@renderer/components/ui/separator.js";
import { ScrollArea } from "@renderer/components/ui/scroll-area.js";
import { Input } from "@renderer/components/ui/input.js";
import { cn } from "@renderer/lib/cn.js";
import { FilterDefinition, AppliedFilters, SetAppliedFilters } from "./types.js";

export const FilterSheet = ({
  filterDefinitions,
  appliedFilters,
  setAppliedFilters,
}: {
  filterDefinitions?: FilterDefinition[];
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
}) => {
  if (!filterDefinitions || filterDefinitions.length === 0) {
    return null;
  }

  const singleSelectFilters = filterDefinitions.filter((filter) => filter.type === "single");
  const multipleSelectFilters = filterDefinitions.filter((filter) => filter.type === "multiple");
  const booleanSelectFilters = filterDefinitions.filter((filter) => filter.type === "boolean");

  const clearAllFilters = () => {
    setAppliedFilters({
      arrays: {},
      strings: {},
      booleans: {},
    });
  };

  const hasActiveFilters =
    Object.keys(appliedFilters.arrays).some((key) => appliedFilters.arrays[key].length > 0) ||
    Object.keys(appliedFilters.strings).some((key) => appliedFilters.strings[key]) ||
    Object.keys(appliedFilters.booleans).some((key) => appliedFilters.booleans[key] === true);

  const activeFilterCount =
    Object.values(appliedFilters.arrays).reduce((total, values) => total + values.length, 0) +
    Object.values(appliedFilters.strings).filter((value) => value).length +
    Object.values(appliedFilters.booleans).filter((value) => value === true).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] p-4 sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </SheetTitle>
              <SheetDescription>Refine your search with custom filters</SheetDescription>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="space-y-8">
            <ActiveFiltersSection
              filterDefinitions={filterDefinitions}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {booleanSelectFilters.length > 0 && (
              <FilterSection title="Quick Filters">
                <div className="grid grid-cols-1 gap-3">
                  {booleanSelectFilters.map((filter) => (
                    <BooleanSelectFilter
                      key={filter.key}
                      filter={filter}
                      appliedFilters={appliedFilters}
                      setAppliedFilters={setAppliedFilters}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {singleSelectFilters.length > 0 && (
              <FilterSection title="Categories">
                <div className="space-y-4">
                  {singleSelectFilters.map((filter) => (
                    <SingleSelectFilter
                      key={filter.key}
                      filter={filter}
                      appliedFilters={appliedFilters}
                      setAppliedFilters={setAppliedFilters}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {multipleSelectFilters.length > 0 && (
              <FilterSection title="Tags">
                <div className="space-y-6">
                  {multipleSelectFilters.map((filter) => (
                    <MultiSelectFilter
                      key={filter.key}
                      filter={filter}
                      appliedFilters={appliedFilters}
                      setAppliedFilters={setAppliedFilters}
                    />
                  ))}
                </div>
              </FilterSection>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h4 className="text-muted-foreground text-sm font-medium">{title}</h4>
    {children}
  </div>
);

const ActiveFiltersSection = ({
  filterDefinitions,
  appliedFilters,
  setAppliedFilters,
  hasActiveFilters,
}: {
  filterDefinitions: FilterDefinition[];
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
  hasActiveFilters: boolean;
}) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-muted-foreground text-sm font-medium">Active Filters</h4>
      <div className="flex flex-wrap gap-2">
        {/* Array filters (multiple select) */}
        {Object.entries(appliedFilters.arrays)
          .filter(([_, values]) => values.length > 0)
          .map(([filterKey, values]) => {
            const filterDef = filterDefinitions.find((f) => f.key === filterKey);
            return values.map((value) => (
              <ActiveFilterBadge
                key={`${filterKey}-${value}`}
                label={filterDef?.title}
                value={value}
                onRemove={() => {
                  setAppliedFilters((prev) => ({
                    ...prev,
                    arrays: {
                      ...prev.arrays,
                      [filterKey]: prev.arrays[filterKey].filter((v) => v !== value),
                    },
                  }));
                }}
              />
            ));
          })}

        {/* String filters (single select) */}
        {Object.entries(appliedFilters.strings)
          .filter(([_, value]) => value)
          .map(([filterKey, value]) => {
            const filterDef = filterDefinitions.find((f) => f.key === filterKey);
            return (
              <ActiveFilterBadge
                key={filterKey}
                label={filterDef?.title}
                value={value}
                onRemove={() => {
                  setAppliedFilters((prev) => ({
                    ...prev,
                    strings: Object.fromEntries(
                      Object.entries(prev.strings).filter(([key]) => key !== filterKey)
                    ),
                  }));
                }}
              />
            );
          })}

        {/* Boolean filters */}
        {Object.entries(appliedFilters.booleans)
          .filter(([_, value]) => value === true)
          .map(([filterKey]) => {
            const filterDef = filterDefinitions.find((f) => f.key === filterKey);
            return (
              <ActiveFilterBadge
                key={filterKey}
                value={filterDef?.title || filterKey}
                onRemove={() => {
                  setAppliedFilters((prev) => ({
                    ...prev,
                    booleans: Object.fromEntries(
                      Object.entries(prev.booleans).filter(([key]) => key !== filterKey)
                    ),
                  }));
                }}
              />
            );
          })}
      </div>
      <Separator />
    </div>
  );
};

const ActiveFilterBadge = ({
  label,
  value,
  onRemove,
}: {
  label?: string;
  value: string;
  onRemove: () => void;
}) => (
  <Badge variant="secondary" className="gap-1 pr-1">
    {label && <span className="text-muted-foreground text-xs">{label}:</span>}
    {value}
    <Button
      variant="ghost"
      size="sm"
      className="hover:bg-destructive hover:text-destructive-foreground h-3 w-3 p-0"
      onClick={onRemove}
    >
      <X className="h-2 w-2" />
    </Button>
  </Badge>
);

const SingleSelectFilter = ({
  filter,
  appliedFilters,
  setAppliedFilters,
}: {
  filter: FilterDefinition;
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
}) => {
  const filterKey = filter.key;
  const selectedValue = appliedFilters.strings[filterKey] || "";

  const handleValueChange = (value: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      strings: {
        ...prev.strings,
        [filterKey]: value,
      },
    }));
  };

  const clearValue = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      strings: Object.fromEntries(
        Object.entries(prev.strings).filter(([key]) => key !== filterKey)
      ),
    }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{filter.title}</Label>
        {selectedValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearValue()}
            className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      <Select value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${filter.title.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {filter.values!.map((value) => (
            <SelectItem value={value} key={value}>
              <div className="flex items-center gap-2">
                <div className="flex h-3 w-3 items-center justify-center">
                  {selectedValue === value && <Check className="h-3 w-3" />}
                </div>
                {value}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const MultiSelectFilter = ({
  filter,
  appliedFilters,
  setAppliedFilters,
}: {
  filter: FilterDefinition;
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
}) => {
  const filterKey = filter.key;
  const selectedValues = appliedFilters.arrays[filterKey] || [];
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleTagToggle = (value: string) => {
    setAppliedFilters((prev) => {
      const currentValues = prev.arrays[filterKey] || [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        arrays: {
          ...prev.arrays,
          [filterKey]: updatedValues,
        },
      };
    });
  };

  const filteredValues = filter.values!.filter((value) =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearAll = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      arrays: {
        ...prev.arrays,
        [filterKey]: [],
      },
    }));
  };

  const selectAll = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      arrays: {
        ...prev.arrays,
        [filterKey]: filter.values!,
      },
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{filter.title}</Label>
        <div className="flex items-center gap-2">
          {selectedValues.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {selectedValues.length} selected
            </Badge>
          )}
          {selectedValues.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {filter.values!.length > 8 && (
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder={`Search ${filter.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {filter.values!.length > 3 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="h-7 text-xs"
            disabled={selectedValues.length === filter.values!.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="h-7 text-xs"
            disabled={selectedValues.length === 0}
          >
            Clear All
          </Button>
        </div>
      )}

      <ScrollArea className={cn("w-full", filter.values!.length > 6 && "h-48")}>
        <div className="grid grid-cols-1 gap-2">
          {filteredValues.map((value) => (
            <div
              key={value}
              className={cn(
                "hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md border p-2 transition-colors",
                selectedValues.includes(value) && "bg-muted border-primary"
              )}
              onClick={() => handleTagToggle(value)}
            >
              <Checkbox
                checked={selectedValues.includes(value)}
                onChange={() => handleTagToggle(value)}
                className="pointer-events-none"
              />
              <span className="flex-1 text-sm">{value}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {searchTerm && filteredValues.length === 0 && (
        <div className="text-muted-foreground py-4 text-center text-sm">
          No {filter.title.toLowerCase()} found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

const BooleanSelectFilter = ({
  filter,
  appliedFilters,
  setAppliedFilters,
}: {
  filter: FilterDefinition;
  appliedFilters: AppliedFilters;
  setAppliedFilters: SetAppliedFilters;
}) => {
  const filterKey = filter.key;
  const isEnabled = appliedFilters.booleans[filterKey] === true;

  const handleToggle = (checked: boolean) => {
    setAppliedFilters((prev) => ({
      ...prev,
      booleans: {
        ...prev.booleans,
        [filterKey]: checked,
      },
    }));
  };

  return (
    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors">
      <div className="space-y-1">
        <Label className="cursor-pointer text-sm font-medium">{filter.title}</Label>
      </div>
      <Switch checked={isEnabled} onCheckedChange={handleToggle} />
    </div>
  );
};
