"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Ward } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";

interface FilterValues {
  ward_no?: string;
  min_age?: number;
  max_age?: number;
  gender?: string;
  house_no?: string;
}

interface VoterFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

const AGE_PRESETS = [
  { label: "Young (18-35)", min: 18, max: 35 },
  { label: "Middle (36-55)", min: 36, max: 55 },
  { label: "Senior (56+)", min: 56, max: 100 },
];

export function VoterFilters({ onFilterChange, onReset }: VoterFiltersProps) {
  const { selectedListId } = useListContext();
  const [filters, setFilters] = useState<FilterValues>({});
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({});
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  // Fetch wards when list changes
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedListId) return;
      setLoadingWards(true);
      try {
        const data = await api.getWards(selectedListId);
        setWards(data.wards || []);
      } catch (err) {
        console.error("Failed to fetch wards:", err);
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedListId]);

  const activeFilters = Object.entries(appliedFilters).filter(([_, v]) => v);

  // Auto-apply on change for better UX
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (JSON.stringify(filters) !== JSON.stringify(appliedFilters)) {
        setAppliedFilters(filters);
        onFilterChange(filters);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  const handleReset = () => {
    setFilters({});
    setAppliedFilters({});
    onReset();
  };

  const removeFilter = (key: keyof FilterValues) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    // If removing min_age or max_age, also clear the other
    if (key === "min_age" || key === "max_age") {
      delete newFilters.min_age;
      delete newFilters.max_age;
    }
    setFilters(newFilters);
  };

  const setAgePreset = (min: number, max: number) => {
    setFilters({ ...filters, min_age: min, max_age: max });
  };

  const getFilterLabel = (key: string, value: unknown): string => {
    switch (key) {
      case "ward_no":
        return `Ward ${value}`;
      case "min_age":
        return `Age ${filters.min_age}-${filters.max_age || "∞"}`;
      case "max_age":
        return ""; // Handled by min_age
      case "gender":
        return `${value}`;
      case "house_no":
        return `House ${value}`;
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-2">
      {/* Compact Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>

        {/* Ward Dropdown */}
        <Select
          value={filters.ward_no || "all"}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              ward_no: value === "all" ? undefined : value,
            })
          }
          disabled={loadingWards}
        >
          <SelectTrigger className="h-8 w-28 text-sm">
            {loadingWards ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <SelectValue placeholder="Ward" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            <SelectItem value="all">All Wards</SelectItem>
            {wards.map((ward) => (
              <SelectItem key={ward.ward_no} value={ward.ward_no}>
                Ward {ward.ward_no}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Gender */}
        <Select
          value={filters.gender || "all"}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              gender: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>

        {/* Age Presets */}
        <div className="flex gap-1">
          {AGE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={
                filters.min_age === preset.min && filters.max_age === preset.max
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => {
                if (
                  filters.min_age === preset.min &&
                  filters.max_age === preset.max
                ) {
                  setFilters({
                    ...filters,
                    min_age: undefined,
                    max_age: undefined,
                  });
                } else {
                  setAgePreset(preset.min, preset.max);
                }
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* House */}
        <Input
          placeholder="House #"
          value={filters.house_no || ""}
          onChange={(e) =>
            setFilters({ ...filters, house_no: e.target.value || undefined })
          }
          className="h-8 w-20 text-sm"
        />

        {/* Clear All */}
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleReset}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map(([key, value]) => {
            const label = getFilterLabel(key, value);
            if (!label) return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => removeFilter(key as keyof FilterValues)}
              >
                {label}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
