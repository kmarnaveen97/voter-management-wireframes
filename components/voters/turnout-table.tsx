"use client";

import { useState } from "react";
import { Voter, TurnoutStatus } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Home as HomeIcon,
  Check,
  Car,
  UserX,
  Skull,
  Ban,
  MoreVertical,
  FileText,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TurnoutTableProps {
  voters: Voter[];
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onMarkTurnout?: (
    voterId: number,
    status: TurnoutStatus,
    note?: string
  ) => Promise<void>;
  totalMatchingVoters?: number;
}

const turnoutStatusConfig: Record<
  TurnoutStatus,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  will_vote: {
    label: "Will Vote",
    icon: CheckCircle2,
    color: "text-green-700",
    bgColor: "bg-green-100 dark:bg-green-950",
  },
  wont_vote: {
    label: "Won't Vote",
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-100 dark:bg-red-950",
  },
  unsure: {
    label: "Unsure",
    icon: HelpCircle,
    color: "text-amber-700",
    bgColor: "bg-amber-100 dark:bg-amber-950",
  },
  not_home: {
    label: "Not Home",
    icon: HomeIcon,
    color: "text-gray-700",
    bgColor: "bg-gray-100 dark:bg-gray-900",
  },
  already_voted: {
    label: "Already Voted",
    icon: Check,
    color: "text-blue-700",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  needs_transport: {
    label: "Needs Transport",
    icon: Car,
    color: "text-purple-700",
    bgColor: "bg-purple-100 dark:bg-purple-950",
  },
  migrated: {
    label: "Migrated",
    icon: UserX,
    color: "text-orange-700",
    bgColor: "bg-orange-100 dark:bg-orange-950",
  },
  deceased: {
    label: "Deceased",
    icon: Skull,
    color: "text-slate-700",
    bgColor: "bg-slate-100 dark:bg-slate-900",
  },
  invalid: {
    label: "Invalid",
    icon: Ban,
    color: "text-rose-700",
    bgColor: "bg-rose-100 dark:bg-rose-950",
  },
};

export function TurnoutTable({
  voters,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onMarkTurnout,
  totalMatchingVoters,
}: TurnoutTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentVoterId, setCurrentVoterId] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TurnoutStatus | null>(
    null
  );
  const [note, setNote] = useState("");

  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds;

  const openNoteDialog = (
    voterId: number,
    status: TurnoutStatus,
    existingNote?: string
  ) => {
    setCurrentVoterId(voterId);
    setCurrentStatus(status);
    setNote(existingNote || "");
    setNoteDialogOpen(true);
  };

  const handleMarkWithNote = async () => {
    if (currentVoterId && currentStatus) {
      await onMarkTurnout?.(currentVoterId, currentStatus, note || undefined);
      setNoteDialogOpen(false);
      setNote("");
      setCurrentVoterId(null);
      setCurrentStatus(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === voters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(voters.map((v) => String(v.voter_id || v.serial_no)))
      );
    }
  };

  const toggleSelect = (voterId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(voterId)) {
      newSelected.delete(voterId);
    } else {
      newSelected.add(voterId);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="rounded-lg border">
      {selectedIds.size > 0 && (
        <div className="bg-muted/50 px-4 py-2 border-b">
          <span className="text-sm font-medium">
            {selectedIds.size} voter{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  voters.length > 0 && selectedIds.size === voters.length
                }
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>S.No</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Relative</TableHead>
            <TableHead>House No</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Ward</TableHead>
            <TableHead>Turnout Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center py-8 text-muted-foreground"
              >
                No voters found
              </TableCell>
            </TableRow>
          ) : (
            voters.map((voter) => {
              const voterId = String(voter.voter_id || voter.serial_no);
              const isSelected = selectedIds.has(voterId);
              const turnoutStatus = voter.turnout_status;
              const config = turnoutStatus
                ? turnoutStatusConfig[turnoutStatus]
                : null;

              return (
                <TableRow
                  key={voterId}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(voterId)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {voter.serial_no}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{voter.name}</div>
                        {voter.name_hindi && (
                          <div className="text-sm text-muted-foreground">
                            {voter.name_hindi}
                          </div>
                        )}
                      </div>
                      {voter.mobile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${voter.mobile}`, "_self");
                          }}
                          className="h-7 w-7 rounded flex items-center justify-center bg-green-600 hover:bg-green-700 text-white transition-colors shrink-0"
                          title="Call voter"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{voter.relative_name}</div>
                      {voter.relative_name_hindi && (
                        <div className="text-muted-foreground">
                          {voter.relative_name_hindi}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{voter.house_no}</TableCell>
                  <TableCell>{voter.age}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        voter.gender === "Male" || voter.gender === "पु"
                          ? "border-blue-300 text-blue-700"
                          : "border-pink-300 text-pink-700"
                      }
                    >
                      {voter.gender === "पु"
                        ? "Male"
                        : voter.gender === "म"
                        ? "Female"
                        : voter.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{voter.ward_no}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {config ? (
                        <>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "gap-1",
                              config.bgColor,
                              config.color
                            )}
                          >
                            <config.icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {voter.turnout_note && turnoutStatus && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                openNoteDialog(
                                  voter.voter_id ||
                                    parseInt(voter.serial_no, 10),
                                  turnoutStatus,
                                  voter.turnout_note || undefined
                                )
                              }
                              title={voter.turnout_note}
                            >
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not marked
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Mark Turnout</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "will_vote",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          Will Vote (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "already_voted",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <Check className="h-4 w-4 mr-2 text-blue-600" />
                          Already Voted (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "wont_vote",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Won't Vote (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "unsure",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <HelpCircle className="h-4 w-4 mr-2 text-amber-600" />
                          Unsure (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "not_home",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <HomeIcon className="h-4 w-4 mr-2 text-gray-600" />
                          Not Home (with note)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "needs_transport",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <Car className="h-4 w-4 mr-2 text-purple-600" />
                          Needs Transport (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "migrated",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <UserX className="h-4 w-4 mr-2 text-orange-600" />
                          Migrated (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "deceased",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <Skull className="h-4 w-4 mr-2 text-slate-600" />
                          Deceased (with note)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openNoteDialog(
                              voter.voter_id || parseInt(voter.serial_no, 10),
                              "invalid",
                              voter.turnout_note || undefined
                            )
                          }
                        >
                          <Ban className="h-4 w-4 mr-2 text-rose-600" />
                          Invalid (with note)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Turnout Note</DialogTitle>
            <DialogDescription>
              {currentStatus && turnoutStatusConfig[currentStatus] && (
                <span>
                  Marking as{" "}
                  <strong>{turnoutStatusConfig[currentStatus].label}</strong>.
                  Add an optional note below.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="E.g., Will come to vote after 3 PM, Needs pickup from home, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkWithNote}>Mark Turnout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
