"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Share2,
  Globe,
  ClipboardList,
  ArrowRight,
  Vote,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  available: boolean;
  stats?: { label: string; value: string }[];
}

const modules: ModuleCard[] = [
  {
    title: "Voters Management",
    description:
      "Manage voter data, family mapping, ward analysis, polling stations, and election campaigns with powerful tools and insights.",
    href: "/voters-management",
    icon: <Users className="w-7 h-7" />,
    gradient: "from-[#4A00B1] to-[#3a008d]",
    iconBg: "bg-[#4A00B1]/10 text-[#4A00B1] dark:text-[#9B6DFF]",
    available: true,
    stats: [
      { label: "Features", value: "10+" },
      { label: "Active", value: "Live" },
    ],
  },
  {
    title: "Social Media Management",
    description:
      "Schedule posts, track engagement, manage multiple platforms, and analyze social media performance across all channels.",
    href: "/social-media-management",
    icon: <Share2 className="w-7 h-7" />,
    gradient: "from-[#FF5E39] to-[#e04a28]",
    iconBg: "bg-[#FF5E39]/10 text-[#FF5E39] dark:text-[#FF8066]",
    available: false,
    stats: [
      { label: "Platforms", value: "5+" },
      { label: "Status", value: "Soon" },
    ],
  },
  {
    title: "Website Management",
    description:
      "Build and manage campaign websites with 8 village election templates. Perfect for Gram Panchayat and local body elections.",
    href: "/website-management",
    icon: <Globe className="w-7 h-7" />,
    gradient: "from-[#B7CF4F] to-[#9ab83d]",
    iconBg: "bg-[#B7CF4F]/15 text-[#7a8a35] dark:text-[#B7CF4F]",
    available: true,
    stats: [
      { label: "Templates", value: "8" },
      { label: "Active", value: "Live" },
    ],
  },
  {
    title: "Survey Management",
    description:
      "Create surveys, collect feedback, analyze responses, and gain insights from voters and constituents.",
    href: "/survey-management",
    icon: <ClipboardList className="w-7 h-7" />,
    gradient: "from-[#EFE7D3] to-[#d4cbb5]",
    iconBg: "bg-[#4A00B1]/10 text-[#4A00B1] dark:text-[#9B6DFF]",
    available: false,
    stats: [
      { label: "Question Types", value: "15+" },
      { label: "Status", value: "Soon" },
    ],
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-card/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/logo.jpeg"
                alt="स्वराज्य चुनाव - Swarajya Chunav"
                width={200}
                height={200}
                className="h-32 sm:h-40 w-auto"
                priority
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              स्वराज्य चुनाव
              <span className="block text-primary mt-2 text-2xl sm:text-3xl font-medium">
                Swarajya Chunav
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Everything you need to run a successful Gram Panchayat election
              campaign. Manage voters, build websites, track surveys, and engage
              with your village — all in one place.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">4</div>
                <div className="text-sm text-muted-foreground">Modules</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">2</div>
                <div className="text-sm text-muted-foreground">Active Now</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">2</div>
                <div className="text-sm text-muted-foreground">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Choose a Module
            </h2>
            <p className="text-muted-foreground mt-1">
              Select a module to get started
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>More coming soon</span>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {modules.map((module) => (
            <button
              key={module.title}
              onClick={() => router.push(module.href)}
              disabled={!module.available}
              className={cn(
                "group relative text-left rounded-2xl border bg-card p-5 sm:p-6 transition-all duration-300",
                module.available
                  ? "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              )}
            >
              {/* Gradient Overlay on Hover */}
              {module.available && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300",
                    module.gradient
                  )}
                />
              )}

              {/* Badge */}
              <div className="absolute top-4 right-4">
                {module.available ? (
                  <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-[#B7CF4F]/20 text-[#5a7030] dark:text-[#B7CF4F]">
                    Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </div>

              <div className="relative">
                {/* Icon */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300",
                    module.iconBg,
                    module.available && "group-hover:scale-110"
                  )}
                >
                  {module.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-1.5 flex items-center gap-2">
                  {module.title}
                  {module.available && (
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  )}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                  {module.description}
                </p>

                {/* Stats */}
                {module.stats && (
                  <div className="flex items-center gap-4 pt-3 border-t">
                    {module.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "text-base font-bold",
                            module.available
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {stat.value}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="स्वराज्य चुनाव"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-semibold text-foreground">
                स्वराज्य चुनाव
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Swarajya Chunav. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
