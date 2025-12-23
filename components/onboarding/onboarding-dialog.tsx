"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Home,
  Upload,
  Vote,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Map,
  Keyboard,
  Target,
  Smartphone,
  Database,
  Search,
  MousePointer,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "voter_management_onboarding_completed";
const ONBOARDING_VERSION = "2"; // Increment to re-show onboarding on major updates

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features?: string[];
  tip?: string;
  action?: string;
  route?: string;
  highlight?: "primary" | "success" | "warning";
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Voter Management",
    description:
      "Your complete election campaign management platform. Let's get you started with a quick tour of the key features.",
    icon: Home,
    features: [
      "Upload and manage voter lists",
      "Analyze family voting patterns",
      "Plan door-to-door campaigns",
      "Track voter sentiment in real-time",
    ],
    highlight: "primary",
  },
  {
    title: "Step 1: Select Your Voter List",
    description:
      "The active list selector at the top of every page shows which voter list you're working with. All data displayed depends on this selection.",
    icon: Database,
    features: [
      "Switch between multiple uploaded lists",
      "See voter count at a glance",
      "Upload new lists anytime",
    ],
    tip: "💡 Always verify the correct list is selected before tagging voters!",
    highlight: "warning",
  },
  {
    title: "Step 2: Upload Voter Data",
    description:
      "Import PDF voter lists and let our AI extract all voter information automatically. The system handles Hindi text, tables, and multiple formats.",
    icon: Upload,
    features: [
      "Drag & drop PDF files",
      "Automatic data extraction",
      "Hindi/English language support",
      "Bulk import thousands of records",
    ],
    action: "Go to Upload",
    route: "/upload",
  },
  {
    title: "Step 3: Search & Tag Voters",
    description:
      "Find any voter instantly by name, serial number, or house number. Tag their political sentiment for campaign tracking.",
    icon: Users,
    features: [
      "Search in Hindi or English",
      "Filter by ward, age, gender",
      "Bulk select and tag multiple voters",
      "View detailed voter profiles",
    ],
    tip: "💡 Use keyboard shortcuts: S = Support, O = Oppose, W = Swing",
    action: "View Voters",
    route: "/voters",
  },
  {
    title: "Step 4: War Room Dashboard",
    description:
      "The War Room gives you a bird's-eye view of every house in every ward. See sentiment distribution at a glance and identify priority targets.",
    icon: Map,
    features: [
      "Visual ward-by-ward breakdown",
      "Color-coded sentiment indicators",
      "Click any house to see family details",
      "Track campaign coverage progress",
    ],
    tip: "💡 Green = Support, Red = Oppose, Yellow = Swing voter (priority!)",
    action: "Open War Room",
    route: "/war-room",
    highlight: "success",
  },
  {
    title: "Step 5: Family Analysis",
    description:
      "Voters are grouped by household. Understand family dynamics to plan more effective outreach - one family member can influence the entire house.",
    icon: Home,
    features: [
      "See all members of each household",
      "Tag entire families at once",
      "Identify influential family heads",
      "Plan family-level visits",
    ],
    action: "See Families",
    route: "/families",
  },
  {
    title: "Keyboard Shortcuts",
    description:
      "Work faster with keyboard shortcuts. These are available throughout the app when viewing voter lists.",
    icon: Keyboard,
    features: [
      "S - Mark as Supporter",
      "O - Mark as Opposition",
      "W - Mark as Swing/Undecided",
      "Ctrl+F - Quick search",
      "? - Show all shortcuts",
    ],
    tip: "💡 Press ? anytime to see the full shortcuts reference",
  },
  {
    title: "You're Ready!",
    description:
      "Start by uploading a voter list, then explore the War Room to plan your campaign strategy. Good luck!",
    icon: CheckCircle2,
    features: [
      "Upload your first voter list",
      "Tag a few voters to test",
      "Explore the War Room view",
      "Check family groupings",
    ],
    action: "Get Started",
    route: "/upload",
    highlight: "success",
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if onboarding has been completed for current version
    const completedVersion = localStorage.getItem(ONBOARDING_KEY);
    if (completedVersion !== ONBOARDING_VERSION) {
      // Small delay for better UX
      setTimeout(() => setOpen(true), 800);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
    setOpen(false);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
    setOpen(false);
    const finalRoute = steps[currentStep].route || "/upload";
    router.push(finalRoute);
  };

  const handleActionClick = () => {
    localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
    setOpen(false);
    const route = steps[currentStep].route || "/";
    router.push(route);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={handleSkip}
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className="pt-2">
          <div
            className={cn(
              "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
              currentStepData.highlight === "success" &&
                "bg-green-100 dark:bg-green-900/30",
              currentStepData.highlight === "warning" &&
                "bg-amber-100 dark:bg-amber-900/30",
              (!currentStepData.highlight ||
                currentStepData.highlight === "primary") &&
                "bg-primary/10"
            )}
          >
            <Icon
              className={cn(
                "h-8 w-8",
                currentStepData.highlight === "success" && "text-green-600",
                currentStepData.highlight === "warning" && "text-amber-600",
                (!currentStepData.highlight ||
                  currentStepData.highlight === "primary") &&
                  "text-primary"
              )}
            />
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl">
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base leading-relaxed px-2">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Features List */}
          {currentStepData.features && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {currentStepData.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pro Tip */}
          {currentStepData.tip && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
              {currentStepData.tip}
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      idx === currentStep
                        ? "bg-primary"
                        : idx < currentStep
                        ? "bg-primary/50"
                        : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Action Button */}
          {currentStepData.action && (
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleActionClick}
            >
              {currentStepData.action}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground order-2 sm:order-1"
            size="sm"
          >
            Skip Tour
          </Button>

          <div className="flex gap-2 order-1 sm:order-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} size="sm">
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep < steps.length - 1 && (
                <ArrowRight className="ml-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
