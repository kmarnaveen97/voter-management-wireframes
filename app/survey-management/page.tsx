import { ClipboardList, ArrowLeft, Bell, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SurveyManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#4A00B1]/5 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#EFE7D3] to-[#d4cbb5] flex items-center justify-center shadow-2xl shadow-[#EFE7D3]/25 animate-pulse">
            <ClipboardList className="w-12 h-12 text-[#4A00B1]" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A00B1]/10 text-[#4A00B1] dark:text-[#9B6DFF] text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Survey Management
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Create surveys, collect feedback, analyze responses, and gain
            valuable insights from voters and constituents with powerful tools.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4 text-left">
          {[
            "15+ question types",
            "Response analytics",
            "Custom branding",
            "Export reports",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="w-2 h-2 rounded-full bg-[#4A00B1]" />
              {feature}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-[#4A00B1] to-[#3a008d] hover:from-[#3a008d] hover:to-[#2a0069] text-white">
            <Bell className="w-4 h-4" />
            Notify Me When Ready
          </Button>
        </div>
      </div>
    </div>
  );
}
