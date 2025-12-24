"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Home,
  Vote,
  Upload,
  HelpCircle,
  GitCompare,
  PanelLeftClose,
  PanelLeft,
  Map as MapIcon,
  Building2,
  Globe,
  Layout,
  Palette,
  FileText,
  Settings,
  Layers,
  Lock,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/contexts/sidebar-context";
import { ModuleSwitcher } from "@/components/module-switcher";
import { useListContext } from "@/contexts/list-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  requiresList?: boolean; // Marks items that need at least 1 list
  requiresCandidate?: boolean; // Marks items that need a candidate
  requiresMultipleLists?: boolean; // Marks items that need more than 1 list
}

// Navigation items for each module
export const moduleNavItems: Record<string, NavItem[]> = {
  "voters-management": [
    {
      title: "Dashboard",
      href: "/voters-management",
      icon: LayoutDashboard,
    },
    {
      title: "Voters",
      href: "/voters-management/voters",
      icon: Users,
      description: "Search & tag voters",
      requiresCandidate: true,
    },
    {
      title: "Voter Turnout",
      href: "/voters-management/voter-turnout",
      icon: Vote,
      description: "Track voter turnout",
      requiresCandidate: true,
    },
    {
      title: "D-Day Dashboard",
      href: "/voters-management/dday",
      icon: Clock,
      description: "Election day management",
      badge: "Live",
      requiresCandidate: true,
    },
    {
      title: "War Room",
      href: "/voters-management/war-room",
      icon: MapIcon,
      description: "Visual campaign planner",
      requiresCandidate: true,
    },
    {
      title: "3D War Room",
      href: "/voters-management/war-room-3d",
      icon: Globe,
      description: "3D ward view",
      requiresCandidate: true,
    },
    {
      title: "Families",
      href: "/voters-management/families",
      icon: Home,
      description: "Household view",
      requiresCandidate: true,
    },
    {
      title: "Polling Stations",
      href: "/voters-management/polling-stations",
      icon: Building2,
      description: "Station & booth data",
      requiresCandidate: true,
    },
    {
      title: "Elections",
      href: "/voters-management/elections",
      icon: Vote,
      description: "Candidates & results",
      requiresList: true,
    },
    {
      title: "Compare Lists",
      href: "/voters-management/compare",
      icon: GitCompare,
      description: "Diff voter lists",
      requiresMultipleLists: true,
    },
    {
      title: "Import Data",
      href: "/voters-management/upload",
      icon: Upload,
      description: "Upload PDFs",
    },
  ],
  "website-management": [
    {
      title: "Templates",
      href: "/website-management",
      icon: Layout,
      description: "Election website templates",
    },
    {
      title: "My Websites",
      href: "/website-management/my-websites",
      icon: Layers,
      description: "Manage your sites",
    },
    {
      title: "Pages",
      href: "/website-management/pages",
      icon: FileText,
      description: "Page builder",
    },
    {
      title: "Themes",
      href: "/website-management/themes",
      icon: Palette,
      description: "Customize look & feel",
    },
    {
      title: "Settings",
      href: "/website-management/settings",
      icon: Settings,
      description: "Site configuration",
    },
    {
      title: "Help",
      href: "/website-management/help",
      icon: HelpCircle,
      description: "Documentation",
    },
  ],
};

// Get current module from pathname
export function getCurrentModule(pathname: string): string {
  if (pathname.startsWith("/website-management")) return "website-management";
  if (pathname.startsWith("/voters-management")) return "voters-management";
  return "voters-management"; // default
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { selectedListId, availableLists } = useListContext();

  const currentModule = getCurrentModule(pathname);
  const navItems = moduleNavItems[currentModule] || [];
  const isVotersModule = currentModule === "voters-management";

  // Fetch candidates for the current list to check if any exist
  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", selectedListId],
    queryFn: () => api.getCandidates({ list_id: selectedListId }),
    enabled: !!selectedListId && isVotersModule,
    staleTime: 60 * 1000, // 1 minute
  });

  const hasList = (availableLists?.length ?? 0) > 0;
  const hasCandidate = (candidatesData?.candidates?.length ?? 0) > 0;
  const hasMultipleLists = (availableLists?.length ?? 0) > 1;

  const handleRestartOnboarding = () => {
    localStorage.removeItem("voter_management_onboarding_completed");
    window.location.reload();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 h-screen border-r border-border bg-card transition-all duration-300 hidden md:block",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={cn(
              "flex h-16 items-center border-b border-border",
              isCollapsed
                ? "flex-col justify-center gap-1 px-2"
                : "justify-between px-4"
            )}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Back to Home"
                >
                  <Image
                    src="/logo.jpeg"
                    alt="स्वराज्य चुनाव"
                    width={28}
                    height={28}
                    className="h-7 w-auto"
                  />
                  <span className="text-sm font-semibold truncate">
                    स्वराज्य चुनाव
                  </span>
                </Link>
              </div>
            )}
            {isCollapsed && (
              <Link href="/" title="Back to Home">
                <Image
                  src="/logo.jpeg"
                  alt="स्वराज्य चुनाव"
                  width={28}
                  height={28}
                  className="h-7 w-auto"
                />
              </Link>
            )}
            {/* Collapse/Expand button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 shrink-0"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Module Switcher */}
          <div
            className={cn(
              "border-b border-border",
              isCollapsed ? "p-2" : "p-3"
            )}
          >
            <ModuleSwitcher collapsed={isCollapsed} />
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              "flex-1 space-y-1 overflow-y-auto",
              isCollapsed ? "p-2" : "p-3"
            )}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check if this is the base route for the module
              const isModuleBase = item.href === `/${currentModule}`;
              const isActive = isModuleBase
                ? pathname === item.href
                : pathname.startsWith(item.href);

              // Check if this item is disabled
              const isDisabledNoList = item.requiresList && !hasList;
              const isDisabledNoCandidate =
                item.requiresCandidate && !hasCandidate;
              const isDisabledNoMultipleLists =
                item.requiresMultipleLists && !hasMultipleLists;
              const isDisabled =
                isDisabledNoList ||
                isDisabledNoCandidate ||
                isDisabledNoMultipleLists;

              // Determine the disabled reason for tooltip
              const disabledReason = isDisabledNoList
                ? "Import a voter list first"
                : isDisabledNoCandidate
                ? "Add a candidate in Elections first"
                : isDisabledNoMultipleLists
                ? "Import at least 2 voter lists to compare"
                : "";

              // Disabled state - show as non-clickable
              if (isDisabled) {
                const disabledContent = (
                  <div
                    key={item.href}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors relative cursor-not-allowed",
                      isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
                      "text-muted-foreground/50 opacity-60"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        <Lock className="h-3 w-3 text-muted-foreground/40" />
                      </>
                    )}
                  </div>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{disabledContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-amber-500">
                          {disabledReason}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{disabledContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs text-amber-500">{disabledReason}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors relative",
                    isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="flex-1">{item.title}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="text-xs">{item.badge}</span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>

          {/* Footer */}
          <div
            className={cn(
              "border-t border-border space-y-3",
              isCollapsed ? "p-2" : "p-4"
            )}
          >
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full"
                    onClick={handleRestartOnboarding}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Help</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                {isVotersModule && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 bg-transparent"
                    onClick={handleRestartOnboarding}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Restart Tour
                  </Button>
                )}

                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p className="font-medium">
                    {isVotersModule ? "API Status" : "Website Management"}
                  </p>
                  <p className="mt-1">
                    {isVotersModule ? "Connected to localhost:5002" : "v1.0"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
