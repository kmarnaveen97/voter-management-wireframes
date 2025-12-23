"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type VoterProfile, type VoterProfileUpdate } from "@/lib/api";
import { useListContext } from "@/contexts/list-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Phone,
  Briefcase,
  Award,
  Tag,
  Flag,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface VoterProfilePanelProps {
  voterId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoterProfilePanel({
  voterId,
  open,
  onOpenChange,
}: VoterProfilePanelProps) {
  const { currentList } = useListContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VoterProfileUpdate>>({});

  // Fetch voter profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["voterProfile", voterId, currentList?.list_id],
    queryFn: () =>
      voterId && currentList?.list_id
        ? api.getVoterProfile(voterId, currentList.list_id)
        : null,
    enabled: !!voterId && !!currentList?.list_id && open,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: VoterProfileUpdate) =>
      api.updateVoterProfile(voterId!, data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["voterProfile", voterId],
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Reset form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({});
      setIsEditing(false);
    }
  }, [profile]);

  const handleSave = () => {
    if (Object.keys(formData).length > 0) {
      updateMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  const updateField = (field: keyof VoterProfileUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getValue = (field: keyof VoterProfile) => {
    return formData[field as keyof VoterProfileUpdate] !== undefined
      ? formData[field as keyof VoterProfileUpdate]
      : profile?.[field];
  };

  if (!profile && !isLoading) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                {profile?.name || "Loading..."}
              </SheetTitle>
              <SheetDescription>
                Voter ID: {voterId} • Ward: {profile?.ward_id}
              </SheetDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <div className="space-y-6 pr-4">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Age
                      </Label>
                      <p className="font-medium">{profile?.age}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Gender
                      </Label>
                      <p className="font-medium">{profile?.gender}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        House No
                      </Label>
                      <p className="font-medium">{profile?.house_no}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Serial No
                      </Label>
                      <p className="font-medium">{profile?.serial_no}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Relative Name
                    </Label>
                    <p className="font-medium text-sm">
                      {profile?.relative_name}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      placeholder="Enter mobile number"
                      value={(getValue("mobile_number") as string) || ""}
                      onChange={(e) =>
                        updateField("mobile_number", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="alt_mobile">Alternate Mobile</Label>
                    <Input
                      id="alt_mobile"
                      placeholder="Enter alternate mobile"
                      value={(getValue("alt_mobile_number") as string) || ""}
                      onChange={(e) =>
                        updateField("alt_mobile_number", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whatsapp"
                      checked={getValue("has_whatsapp") as boolean}
                      onCheckedChange={(checked) =>
                        updateField("has_whatsapp", checked)
                      }
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="whatsapp"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Has WhatsApp
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Caste Information */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Caste Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="caste">Verified Caste</Label>
                    <Input
                      id="caste"
                      placeholder="Enter caste"
                      value={(getValue("verified_caste") as string) || ""}
                      onChange={(e) =>
                        updateField("verified_caste", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="caste_category">Caste Category</Label>
                    <Select
                      value={(getValue("caste_category") as string) || ""}
                      onValueChange={(value) =>
                        updateField("caste_category", value)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="caste_category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="OBC">OBC</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="ST">ST</SelectItem>
                        <SelectItem value="EWS">EWS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="caste_source">Caste Source</Label>
                    <Select
                      value={(getValue("caste_source") as string) || ""}
                      onValueChange={(value) =>
                        updateField("caste_source", value)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="caste_source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_declared">
                          Self Declared
                        </SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="field_worker">
                          Field Worker
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {profile?.detected_caste && (
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <Label className="text-xs text-muted-foreground">
                        Detected Caste
                      </Label>
                      <p className="font-medium">
                        {profile.detected_caste}
                        {profile.caste_confidence && (
                          <Badge variant="outline" className="ml-2">
                            {(profile.caste_confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Economic Information */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Economic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      placeholder="Enter occupation"
                      value={(getValue("occupation") as string) || ""}
                      onChange={(e) =>
                        updateField("occupation", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="economic_status">Economic Status</Label>
                    <Select
                      value={(getValue("economic_status") as string) || ""}
                      onValueChange={(value) =>
                        updateField("economic_status", value)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="economic_status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bpl">BPL</SelectItem>
                        <SelectItem value="lower">Lower</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="upper">Upper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="land">Land Ownership</Label>
                    <Input
                      id="land"
                      placeholder="e.g., 1-5 acres"
                      value={(getValue("land_ownership") as string) || ""}
                      onChange={(e) =>
                        updateField("land_ownership", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="beneficiary"
                      checked={getValue("is_beneficiary") as boolean}
                      onCheckedChange={(checked) =>
                        updateField("is_beneficiary", checked)
                      }
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="beneficiary"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Beneficiary
                    </Label>
                  </div>
                  {getValue("is_beneficiary") && (
                    <div>
                      <Label htmlFor="schemes">Beneficiary Schemes</Label>
                      <Textarea
                        id="schemes"
                        placeholder="Enter schemes (comma-separated)"
                        value={
                          (getValue("beneficiary_schemes") as string[])?.join(
                            ", "
                          ) || ""
                        }
                        onChange={(e) =>
                          updateField(
                            "beneficiary_schemes",
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        disabled={!isEditing}
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Influencer & Political */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Influencer & Political
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="influencer"
                      checked={getValue("is_influencer") as boolean}
                      onCheckedChange={(checked) =>
                        updateField("is_influencer", checked)
                      }
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="influencer"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Influencer
                    </Label>
                  </div>
                  {getValue("is_influencer") && (
                    <>
                      <div>
                        <Label htmlFor="reach">Influencer Reach</Label>
                        <Input
                          id="reach"
                          type="number"
                          placeholder="Number of people"
                          value={(getValue("influencer_reach") as number) || 0}
                          onChange={(e) =>
                            updateField(
                              "influencer_reach",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="influencer_type">Influencer Type</Label>
                        <Select
                          value={(getValue("influencer_type") as string) || ""}
                          onValueChange={(value) =>
                            updateField("influencer_type", value)
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger id="influencer_type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="political">Political</SelectItem>
                            <SelectItem value="religious">Religious</SelectItem>
                            <SelectItem value="community_leader">
                              Community Leader
                            </SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="party">Party Affiliation</Label>
                    <Input
                      id="party"
                      placeholder="Enter party name"
                      value={(getValue("party_affiliation") as string) || ""}
                      onChange={(e) =>
                        updateField("party_affiliation", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="volunteer"
                      checked={getValue("is_volunteer") as boolean}
                      onCheckedChange={(checked) =>
                        updateField("is_volunteer", checked)
                      }
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="volunteer"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Volunteer
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Issues & Grievances */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Issues & Grievances
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="primary_issue">Primary Issue</Label>
                    <Input
                      id="primary_issue"
                      placeholder="Enter primary issue"
                      value={(getValue("primary_issue") as string) || ""}
                      onChange={(e) =>
                        updateField("primary_issue", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="grievance">Grievance</Label>
                    <Textarea
                      id="grievance"
                      placeholder="Describe the grievance"
                      value={(getValue("grievance") as string) || ""}
                      onChange={(e) => updateField("grievance", e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issues_tags">Issue Tags</Label>
                    <Textarea
                      id="issues_tags"
                      placeholder="Enter tags (comma-separated)"
                      value={
                        (getValue("issues_tags") as string[])?.join(", ") || ""
                      }
                      onChange={(e) =>
                        updateField(
                          "issues_tags",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      disabled={!isEditing}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {profile?.updated_at && (
                <div className="text-xs text-muted-foreground text-center pt-4">
                  Last updated:{" "}
                  {new Date(profile.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
