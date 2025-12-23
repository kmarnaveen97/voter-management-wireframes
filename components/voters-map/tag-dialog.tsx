"use client";

import React, { useState, memo } from "react";
import {
  Check,
  Loader2,
  Tag,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voter: { id: number; name: string } | null;
  onSubmit: (data: {
    sentiment: "support" | "oppose" | "swing" | "unknown";
    confidence: number;
    notes: string;
  }) => void;
  isLoading: boolean;
}

export const TagDialog = memo(function TagDialog({
  open,
  onOpenChange,
  voter,
  onSubmit,
  isLoading,
}: TagDialogProps) {
  const [sentiment, setSentiment] = useState<
    "support" | "oppose" | "swing" | "unknown"
  >("support");
  const [confidence, setConfidence] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = () => {
    onSubmit({ sentiment, confidence, notes });
    setSentiment("support");
    setConfidence(3);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag size={18} className="text-primary" />
            Tag Voter
          </DialogTitle>
          <DialogDescription>
            {voter?.name
              ? `Tag ${voter.name}'s sentiment`
              : "Tag voter sentiment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sentiment Selection */}
          <div className="space-y-2">
            <Label>Sentiment</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  value: "support",
                  label: "Support",
                  icon: ThumbsUp,
                  color: "green",
                },
                {
                  value: "oppose",
                  label: "Oppose",
                  icon: ThumbsDown,
                  color: "red",
                },
                {
                  value: "swing",
                  label: "Swing",
                  icon: HelpCircle,
                  color: "yellow",
                },
              ].map(({ value, label, icon: Icon, color }) => (
                <Button
                  key={value}
                  variant={sentiment === value ? "default" : "outline"}
                  className={cn(
                    "h-16 flex-col gap-1",
                    sentiment === value &&
                      color === "green" &&
                      "bg-green-500 hover:bg-green-600",
                    sentiment === value &&
                      color === "red" &&
                      "bg-red-500 hover:bg-red-600",
                    sentiment === value &&
                      color === "yellow" &&
                      "bg-yellow-500 hover:bg-yellow-600"
                  )}
                  onClick={() =>
                    setSentiment(
                      value as "support" | "oppose" | "swing" | "unknown"
                    )
                  }
                >
                  <Icon size={20} />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Confidence Level</Label>
              <span className="text-sm font-medium">{confidence}/5</span>
            </div>
            <Slider
              value={[confidence]}
              onValueChange={(v) => setConfidence(v[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this voter..."
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Check size={16} className="mr-2" />
            )}
            Save Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
