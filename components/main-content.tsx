"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useListContext } from "@/contexts/list-context";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Map,
  Home,
  Upload,
  Database,
  ChevronDown,
  AlertCircle,
  Trash2,
  Loader2,
  Menu,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { moduleNavItems, getCurrentModule } from "./sidebar";
import { CandidateProjectionsModal } from "@/components/war-room/candidate-projections-modal";

// Mobile bottom navigation items (most important 4)
const mobileNavItems = [
  { title: "Home", href: "/voters-management", icon: LayoutDashboard },
  { title: "Voters", href: "/voters-management/voters", icon: Users },
  { title: "War Room", href: "/voters-management/war-room", icon: Map },
  { title: "Families", href: "/voters-management/families", icon: Home },
];

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const {
    currentList,
    selectedListId,
    availableLists,
    setSelectedListId,
    isLoading,
    refreshLists,
  } = useListContext();

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<{
    id: number;
    year?: number;
    voters: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProjectionsOpen, setIsProjectionsOpen] = useState(false);

  // Check if a list is selected
  const hasSelectedList = selectedListId && currentList;

  const handleDeleteClick = (
    e: React.MouseEvent,
    listId: number,
    year: number | undefined,
    voters: number
  ) => {
    e.stopPropagation();
    setListToDelete({ id: listId, year, voters });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!listToDelete) return;

    setIsDeleting(true);
    try {
      const result = await api.deleteVoterList(listToDelete.id);
      toast.success(`Deleted List ${listToDelete.id}`, {
        description: `${result.deleted_voters.toLocaleString()} voters removed`,
      });

      // If deleted the currently selected list, select another one
      if (selectedListId === listToDelete.id) {
        const remainingLists = availableLists.filter(
          (l) => l.list_id !== listToDelete.id
        );
        if (remainingLists.length > 0) {
          setSelectedListId(remainingLists[0].list_id);
        }
      }

      // Refresh the lists
      await refreshLists();
    } catch (error) {
      console.error("Failed to delete list:", error);
      toast.error("Failed to delete list", {
        description: "Please try again later",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setListToDelete(null);
    }
  };

  return (
    <>
      <main
        className={cn(
          "min-h-screen bg-background transition-all duration-300 pb-16 md:pb-0",
          isCollapsed ? "ml-0 md:ml-16" : "ml-0 md:ml-64"
        )}
      >
        {/* Persistent List Indicator - Top Banner (Mobile & Desktop) */}
        {availableLists.length > 0 && (
          <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b px-3 py-2 flex items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Active List:
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 gap-1 font-medium",
                      !hasSelectedList && "text-amber-600"
                    )}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="text-xs">Loading...</span>
                    ) : hasSelectedList ? (
                      <>
                        <span className="text-xs truncate max-w-[120px] sm:max-w-none">
                          List {selectedListId} ({currentList.year})
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1 hidden sm:inline-flex"
                        >
                          {currentList.total_voters.toLocaleString()} voters
                        </Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs">Select a list</span>
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs">
                    Switch Voter List
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableLists.map((list) => (
                    <DropdownMenuItem
                      key={list.list_id}
                      onClick={() => setSelectedListId(list.list_id)}
                      className={cn(
                        "flex justify-between group",
                        selectedListId === list.list_id && "bg-primary/10"
                      )}
                    >
                      <span className="flex-1">
                        List {list.list_id} - {list.year}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:hidden">
                        {list.total_voters.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hidden group-hover:flex text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) =>
                          handleDeleteClick(
                            e,
                            list.list_id,
                            list.year,
                            list.total_voters
                          )
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/voters-management/upload"
                      className="text-xs text-muted-foreground"
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload new list
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Quick page indicator for mobile */}
            <div className="text-xs text-muted-foreground md:hidden truncate">
              {pathname === "/voters-management" && "Dashboard"}
              {pathname === "/voters-management/voters" && "Voters"}
              {pathname.startsWith("/voters-management/voters/") &&
                "Voter Details"}
              {pathname === "/voters-management/war-room" && "War Room"}
              {pathname === "/voters-management/war-room-3d" && "3D War Room"}
              {pathname === "/voters-management/families" && "Families"}
              {pathname === "/voters-management/family-mapping" && "Family Map"}
              {pathname === "/voters-management/elections" && "Elections"}
              {pathname === "/voters-management/upload" && "Upload"}
              {pathname === "/voters-management/compare" && "Compare"}
            </div>
          </div>
        )}

        {/* No List Selected Warning */}
        {availableLists.length > 0 && !hasSelectedList && !isLoading && (
          <div className="mx-4 mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 print:hidden">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                No voter list selected
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Please select a voter list from the dropdown above to view and
                manage voter data.
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {children}

        {/* Global Projections Button */}
        {hasSelectedList && (
          <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 print:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-background"
                  onClick={() => setIsProjectionsOpen(true)}
                >
                  <TrendingUp className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>View Election Projections</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t md:hidden print:hidden safe-area-inset-bottom">
          <div className="flex items-center justify-around h-14">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span
                    className={cn(
                      "text-[10px] mt-0.5",
                      isActive ? "font-medium" : "font-normal"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })}

            {/* More Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors text-muted-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 font-normal">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                <SheetHeader className="text-left mb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-4">
                  {moduleNavItems[getCurrentModule(pathname)]?.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-full mb-2",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-center font-medium line-clamp-2">
                          {item.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voter List?</AlertDialogTitle>
            <AlertDialogDescription>
              {listToDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <strong>List {listToDelete.id}</strong>
                  {listToDelete.year && ` (${listToDelete.year})`}? This will
                  permanently remove{" "}
                  <strong>{listToDelete.voters.toLocaleString()} voters</strong>{" "}
                  from the database.
                  <br />
                  <br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete List
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Projections Modal */}
      <CandidateProjectionsModal
        open={isProjectionsOpen}
        onOpenChange={setIsProjectionsOpen}
      />
    </>
  );
}
