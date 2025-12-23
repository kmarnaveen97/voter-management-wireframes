"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type VoterList } from "@/lib/api";
import { Database } from "lucide-react";

interface ListSelectorProps {
  value?: number;
  onChange: (listId: number) => void;
}

export function ListSelector({ value, onChange }: ListSelectorProps) {
  const [lists, setLists] = useState<VoterList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getVoterLists()
      .then((data) => {
        setLists(data.lists || []);
        // Auto-select first list if none selected
        if (!value && data.lists.length > 0) {
          const firstList = data.lists[0];
          onChange(firstList.list_id ?? firstList.id ?? 1);
        }
      })
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, [value, onChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4 animate-pulse" />
        Loading lists...
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4" />
        No voter lists found
      </div>
    );
  }

  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a voter list" />
      </SelectTrigger>
      <SelectContent>
        {lists.map((list) => {
          const listId = list.list_id ?? list.id ?? 0;
          const listName = list.name ?? list.filename ?? `List ${listId}`;
          const dateStr = list.created_at ?? list.upload_date;

          return (
            <SelectItem key={listId} value={listId.toString()}>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <div>
                  <div className="font-medium">{listName}</div>
                  <div className="text-xs text-muted-foreground">
                    {list.total_voters} voters
                    {dateStr
                      ? ` • ${new Date(dateStr).toLocaleDateString()}`
                      : ""}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
