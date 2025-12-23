"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  api,
  type Voter,
  type Candidate,
  type ElectionSymbol,
} from "@/lib/api";
import {
  Plus,
  Search,
  Loader2,
  User,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useListContext } from "@/contexts/list-context";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddCandidateDialogProps {
  onSuccess: () => void;
}

export function AddCandidateDialog({ onSuccess }: AddCandidateDialogProps) {
  const { selectedListId } = useListContext();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"voter" | "manual">("voter");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Voter[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Symbol picker state
  const [symbols, setSymbols] = useState<ElectionSymbol[]>([]);
  const [symbolSearch, setSymbolSearch] = useState("");
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    party_name: string;
    party_symbol: string;
    ward_no: string;
    status: "active" | "withdrawn" | "disqualified";
  }>({
    name: "",
    party_name: "",
    party_symbol: "",
    ward_no: "",
    status: "active",
  });

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedSymbolSearch = useDebounce(symbolSearch, 300);

  // Load symbols when dialog opens
  useEffect(() => {
    if (open && symbols.length === 0) {
      setLoadingSymbols(true);
      api
        .getSymbols()
        .then((data) => {
          setSymbols(data.symbols || []);
        })
        .catch((err) => {
          console.error("[v0] Failed to load symbols:", err);
        })
        .finally(() => {
          setLoadingSymbols(false);
        });
    }
  }, [open, symbols.length]);

  // Search symbols
  useEffect(() => {
    if (debouncedSymbolSearch && debouncedSymbolSearch.length >= 1) {
      setLoadingSymbols(true);
      api
        .searchSymbols(debouncedSymbolSearch)
        .then((data) => {
          setSymbols(data.symbols || []);
        })
        .catch((err) => {
          console.error("[v0] Symbol search failed:", err);
        })
        .finally(() => {
          setLoadingSymbols(false);
        });
    } else if (!debouncedSymbolSearch && open) {
      // Reset to all symbols
      api.getSymbols().then((data) => setSymbols(data.symbols || []));
    }
  }, [debouncedSymbolSearch, open]);

  // Search for voters when query changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 1 && mode === "voter") {
      setSearching(true);

      // Check if input is a number (serial_no or house_no search)
      const isNumericSearch = /^\d+$/.test(debouncedSearch.trim());

      if (isNumericSearch) {
        // Use filter API for numeric searches (house_no)
        api
          .filterVoters({
            list_id: selectedListId,
            house_no: debouncedSearch.trim(),
            per_page: 20,
          })
          .then((data) => {
            setSearchResults(data.voters || []);
            setShowDropdown(true);
          })
          .catch((err) => {
            console.error("[v0] Filter failed:", err);
            setSearchResults([]);
          })
          .finally(() => {
            setSearching(false);
          });
      } else if (debouncedSearch.length >= 2) {
        // Use search API for name searches (min 2 chars)
        api
          .searchVoters(debouncedSearch, selectedListId)
          .then((data) => {
            setSearchResults(data.voters || []);
            setShowDropdown(true);
          })
          .catch((err) => {
            console.error("[v0] Search failed:", err);
            setSearchResults([]);
          })
          .finally(() => {
            setSearching(false);
          });
      } else {
        setSearching(false);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      if (!debouncedSearch) setShowDropdown(false);
    }
  }, [debouncedSearch, mode, selectedListId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVoterSelect = (voter: Voter) => {
    setSelectedVoter(voter);
    setFormData({
      ...formData,
      name: voter.name,
      ward_no: voter.ward_no,
    });
    setSearchQuery(voter.name);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedVoter(null);
    setSearchQuery("");
    setFormData({
      ...formData,
      name: "",
      ward_no: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const candidateData = {
        list_id: selectedListId || 1,
        name: formData.name,
        party_name: formData.party_name,
        party_symbol: formData.party_symbol,
        ward_no: formData.ward_no,
        voter_id: mode === "voter" ? selectedVoter?.voter_id : undefined,
      };

      const newCandidate = await api.createCandidate(candidateData);

      // Check if this is the first candidate (no primary candidate exists yet)
      // If so, automatically mark it as primary
      try {
        const { candidates } = await api.getCandidates({
          list_id: selectedListId || 1,
        });
        const hasPrimaryCandidate = candidates?.some((c) => c.is_our_candidate);

        // If no primary candidate exists and we just created a candidate, make it primary
        if (!hasPrimaryCandidate && newCandidate?.candidate_id) {
          await api.setOurCandidate(
            newCandidate.candidate_id,
            selectedListId || 1
          );
        }
      } catch (err) {
        console.error("[v0] Failed to auto-set primary candidate:", err);
        // Don't fail the whole operation if auto-setting primary fails
      }

      setOpen(false);
      onSuccess();

      // Reset form
      setFormData({
        name: "",
        party_name: "",
        party_symbol: "",
        ward_no: "",
        status: "active",
      });
      setSelectedVoter(null);
      setSearchQuery("");
    } catch (err) {
      console.error("[v0] Failed to create candidate:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogDescription>
            Link an existing voter or manually enter candidate details
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "voter" | "manual")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voter">Select Existing Voter</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <TabsContent value="voter" className="space-y-4">
              <div className="space-y-2">
                <Label>Search Voter</Label>
                <div className="relative" ref={dropdownRef}>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
                  )}
                  {selectedVoter && !searching && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <Input
                    placeholder="Search by name or house number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedVoter) setSelectedVoter(null);
                    }}
                    onFocus={() =>
                      searchResults.length > 0 && setShowDropdown(true)
                    }
                    className={cn(
                      "pl-10 pr-10",
                      selectedVoter &&
                        "border-green-500 bg-green-50 dark:bg-green-950/20"
                    )}
                  />

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                      {searchResults.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          {searching ? "Searching..." : "No voters found"}
                        </div>
                      ) : (
                        searchResults.map((voter) => (
                          <button
                            key={voter.voter_id}
                            type="button"
                            onClick={() => handleVoterSelect(voter)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                              selectedVoter?.voter_id === voter.voter_id &&
                                "bg-accent"
                            )}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {voter.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {voter.age} yrs • {voter.gender} • Ward{" "}
                                {voter.ward_no} • #{voter.serial_no}
                              </p>
                            </div>
                            {selectedVoter?.voter_id === voter.voter_id && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedVoter && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {selectedVoter.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Ward {selectedVoter.ward_no} • {selectedVoter.age} yrs •{" "}
                        {selectedVoter.gender} • #{selectedVoter.serial_no}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter candidate name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ward_no_manual">Ward Number</Label>
                <Input
                  id="ward_no_manual"
                  value={formData.ward_no}
                  onChange={(e) =>
                    setFormData({ ...formData, ward_no: e.target.value })
                  }
                  placeholder="e.g., 01"
                />
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label htmlFor="party_name">Party</Label>
              <Input
                id="party_name"
                value={formData.party_name}
                onChange={(e) =>
                  setFormData({ ...formData, party_name: e.target.value })
                }
                placeholder="e.g., Independent, BJP, Congress"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Popover
                  open={symbolPickerOpen}
                  onOpenChange={setSymbolPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      type="button"
                      className="w-full justify-between h-10 font-normal"
                    >
                      {formData.party_symbol ? (
                        <span className="text-sm truncate">
                          {formData.party_symbol}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Select symbol...
                        </span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search symbols..."
                          value={symbolSearch}
                          onChange={(e) => setSymbolSearch(e.target.value)}
                          className="pl-8 h-8"
                          autoFocus={false}
                        />
                      </div>
                    </div>
                    <div
                      className="max-h-64 overflow-y-auto overscroll-contain"
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      {loadingSymbols ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : symbols.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No symbols found
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {symbols.map((symbol) => (
                            <button
                              key={symbol.id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  party_symbol: symbol.name_hi,
                                });
                                setSymbolPickerOpen(false);
                                setSymbolSearch("");
                              }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                                formData.party_symbol === symbol.name_hi &&
                                  "bg-accent"
                              )}
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-mono">
                                {symbol.id}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {symbol.name_hi}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {symbol.name_en}
                                </p>
                              </div>
                              {formData.party_symbol === symbol.name_hi && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: "active" | "withdrawn" | "disqualified"
                  ) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Candidate"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
