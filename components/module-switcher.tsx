"use client";

import { usePathname, useRouter } from "next/navigation";
import { Users, Globe, Home, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const modules = [
  {
    id: "voters",
    title: "Voters Management",
    shortTitle: "Voters",
    href: "/voters-management",
    icon: Users,
    color: "text-[#4A00B1]",
  },
  {
    id: "website",
    title: "Website Management",
    shortTitle: "Website",
    href: "/website-management",
    icon: Globe,
    color: "text-[#7a8a35]",
  },
];

interface ModuleSwitcherProps {
  collapsed?: boolean;
}

export function ModuleSwitcher({ collapsed = false }: ModuleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentModule =
    modules.find((m) => pathname.startsWith(m.href)) || modules[0];
  const CurrentIcon = currentModule.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-muted/50 transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20",
            collapsed ? "justify-center p-2" : "px-3 py-2 w-full"
          )}
        >
          <CurrentIcon
            className={cn("h-4 w-4 shrink-0", currentModule.color)}
          />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium truncate">
                {currentModule.shortTitle}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={collapsed ? "center" : "start"}
        side="right"
        sideOffset={8}
        className="w-52"
      >
        {/* Home Option */}
        <DropdownMenuItem
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Home className="h-4 w-4 text-muted-foreground" />
          <span>Home</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Module Options */}
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = pathname.startsWith(module.href);
          return (
            <DropdownMenuItem
              key={module.id}
              onClick={() => router.push(module.href)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isActive && "bg-accent"
              )}
            >
              <Icon className={cn("h-4 w-4", module.color)} />
              <span className="flex-1">{module.title}</span>
              {isActive && <Check className="h-3 w-3 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
