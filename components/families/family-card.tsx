"use client";

import { useState, useCallback } from "react";
import type { Family, Voter } from "@/lib/api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Home,
  Users,
  User,
  Crown,
  ChevronRight,
  Loader2,
  Phone,
  MapPin,
  GitBranch,
  List,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListContext } from "@/contexts/list-context";
import { FamilyTree, type FamilyTreeData } from "./family-tree";
import { FamilyTreeView } from "./family-tree-view";
import { transformToHierarchicalTree } from "@/lib/tree-utils";

interface FamilyCardProps {
  family: Family;
}

export function FamilyCard({ family }: FamilyCardProps) {
  const { selectedListId } = useListContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "tree">("members");
  const [members, setMembers] = useState<Voter[]>(family.members || []);
  const [treeData, setTreeData] = useState<FamilyTreeData | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [mukhiya, setMukhiya] = useState<{
    name: string;
    age: number;
    gender: string;
    relative_name?: string;
  } | null>(
    family.mukhiya_name
      ? {
          name: family.mukhiya_name,
          age: family.mukhiya_age || 0,
          gender: family.mukhiya_gender || "",
        }
      : null
  );
  const [loading, setLoading] = useState(false);

  const fetchFamilyMembers = useCallback(async () => {
    if (family.members && family.members.length > 0) {
      setMembers(family.members);
      return;
    }

    // Use the dedicated family members endpoint
    try {
      setLoading(true);
      const data = await api.getFamilyMembers(
        family.ward_no,
        family.house_no,
        selectedListId
      );
      setMembers(data.members || []);
      if (data.mukhiya) {
        setMukhiya(data.mukhiya);
      }
    } catch (err) {
      console.error("Failed to fetch family members:", err);
      // Fallback to filter API if the new endpoint isn't available
      try {
        const filterData = await api.filterVoters({
          ward_no: family.ward_no,
          house_no: family.house_no,
          list_id: selectedListId,
          per_page: 50,
        });
        setMembers(filterData.voters || []);
      } catch (filterErr) {
        console.error("Fallback filter also failed:", filterErr);
      }
    } finally {
      setLoading(false);
    }
  }, [family, selectedListId]);

  const fetchFamilyTree = useCallback(async () => {
    if (treeData) return; // Already fetched

    try {
      setTreeLoading(true);
      const result = await api.getFamilyTree(
        family.ward_no,
        family.house_no,
        selectedListId
      );
      if (result.success && result.data) {
        setTreeData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch family tree:", err);
    } finally {
      setTreeLoading(false);
    }
  }, [family, selectedListId, treeData]);

  const handleCardClick = () => {
    setIsOpen(true);
    if (members.length === 0) {
      fetchFamilyMembers();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "members" | "tree");
    if (value === "tree" && !treeData) {
      fetchFamilyTree();
    }
  };

  const memberCount = family.member_count || family.vote_count || 1;

  // Use mukhiya from state (which may be updated from API) or fall back to family prop
  const displayMukhiya =
    mukhiya ||
    (family.mukhiya_name
      ? {
          name: family.mukhiya_name,
          age: family.mukhiya_age || 0,
          gender: family.mukhiya_gender || "",
          relative_name: undefined,
        }
      : null);

  return (
    <>
      <Card
        className="transition-all hover:shadow-md cursor-pointer group"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4 text-primary" />
              <span className="font-mono">House {family.house_no}</span>
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {memberCount} {memberCount === 1 ? "Voter" : "Voters"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Ward {family.ward_no}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Mukhiya (Head of Household) Section */}
          {displayMukhiya && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {displayMukhiya.name}
                    </span>
                    {displayMukhiya.gender && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          displayMukhiya.gender === "Male" ||
                          displayMukhiya.gender === "पु"
                            ? "border-blue-500 text-blue-600"
                            : "border-pink-500 text-pink-600"
                        }`}
                      >
                        {displayMukhiya.gender === "पु"
                          ? "Male"
                          : displayMukhiya.gender === "म"
                          ? "Female"
                          : displayMukhiya.gender}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    मुखिया (Head of Household)
                  </p>
                </div>
                {displayMukhiya.age > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">
                      {displayMukhiya.age}
                    </p>
                    <p className="text-xs text-muted-foreground">years</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Family Summary */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Ward {family.ward_no}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 group-hover:bg-primary group-hover:text-primary-foreground"
            >
              View Details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Family Members Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            "max-h-[90vh] transition-all duration-300",
            activeTab === "tree" ? "max-w-5xl" : "max-w-2xl"
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              House {family.house_no}, Ward {family.ward_no}
            </DialogTitle>
            <DialogDescription>
              {memberCount} family member{memberCount !== 1 ? "s" : ""}{" "}
              registered at this address
            </DialogDescription>
          </DialogHeader>

          {/* Tabs for Members List and Family Tree */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members" className="gap-2">
                <List className="h-4 w-4" />
                सदस्य सूची (Members)
              </TabsTrigger>
              <TabsTrigger value="tree" className="gap-2">
                <GitBranch className="h-4 w-4" />
                वंशवृक्ष (Family Tree)
              </TabsTrigger>
            </TabsList>

            {/* Members List Tab */}
            <TabsContent value="members" className="mt-4">
              {/* Mukhiya Highlight */}
              {displayMukhiya && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                      <Crown className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-primary uppercase tracking-wide">
                        मुखिया • Head of Household
                      </p>
                      <p className="text-xl font-bold mt-0.5">
                        {displayMukhiya.name}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {displayMukhiya.gender && (
                            <span>
                              {displayMukhiya.gender === "पु" ||
                              displayMukhiya.gender === "Male"
                                ? "Male"
                                : "Female"}
                            </span>
                          )}
                          {displayMukhiya.age > 0 && (
                            <span>• {displayMukhiya.age} years old</span>
                          )}
                        </div>
                        {displayMukhiya.relative_name && (
                          <span className="text-xs">
                            पिता/पति: {displayMukhiya.relative_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  All Family Members
                </h4>
                <ScrollArea className="h-[300px] pr-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading family members...
                      </span>
                    </div>
                  ) : members.length > 0 ? (
                    <div className="space-y-2">
                      {members
                        .sort((a, b) => (b.age || 0) - (a.age || 0)) // Sort by age (eldest first)
                        .map((member, index) => {
                          const isMukhiya =
                            displayMukhiya &&
                            member.name === displayMukhiya.name;
                          return (
                            <div
                              key={member.voter_id || member.serial_no || index}
                              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent ${
                                isMukhiya
                                  ? "border-primary/30 bg-primary/5"
                                  : ""
                              }`}
                            >
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                  isMukhiya
                                    ? "bg-primary/20"
                                    : member.gender === "Male" ||
                                      member.gender === "पु"
                                    ? "bg-blue-100"
                                    : "bg-pink-100"
                                }`}
                              >
                                {isMukhiya ? (
                                  <Crown className="h-5 w-5 text-primary" />
                                ) : (
                                  <User
                                    className={`h-5 w-5 ${
                                      member.gender === "Male" ||
                                      member.gender === "पु"
                                        ? "text-blue-600"
                                        : "text-pink-600"
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {member.name}
                                  </span>
                                  {isMukhiya && (
                                    <Badge className="bg-primary/20 text-primary text-xs">
                                      मुखिया
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      member.gender === "Male" ||
                                      member.gender === "पु"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-pink-500 text-pink-600"
                                    }`}
                                  >
                                    {member.gender === "पु"
                                      ? "Male"
                                      : member.gender === "म"
                                      ? "Female"
                                      : member.gender}
                                  </Badge>
                                </div>
                                {member.name_hindi &&
                                  member.name_hindi !== member.name && (
                                    <p className="text-sm text-muted-foreground">
                                      {member.name_hindi}
                                    </p>
                                  )}
                                {member.relative_name && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {member.relative_name}
                                    {member.relative_name_hindi &&
                                      member.relative_name_hindi !==
                                        member.relative_name &&
                                      ` (${member.relative_name_hindi})`}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold">
                                  {member.age} yrs
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  #{member.serial_no}
                                </p>
                                {member.voter_id_number && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {member.voter_id_number}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-sm">
                        No detailed member data available
                      </p>
                      <p className="text-xs mt-1">
                        {memberCount} voter{memberCount !== 1 ? "s" : ""}{" "}
                        registered at this address
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Footer Stats */}
              {members.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span>
                      {
                        members.filter(
                          (m) => m.gender === "Male" || m.gender === "पु"
                        ).length
                      }{" "}
                      Male
                    </span>
                    <span>
                      {
                        members.filter(
                          (m) => m.gender === "Female" || m.gender === "म"
                        ).length
                      }{" "}
                      Female
                    </span>
                  </div>
                  <span>
                    Avg Age:{" "}
                    {Math.round(
                      members.reduce((sum, m) => sum + (m.age || 0), 0) /
                        members.length
                    )}{" "}
                    years
                  </span>
                </div>
              )}
            </TabsContent>

            {/* Family Tree Tab */}
            <TabsContent value="tree" className="mt-4">
              {treeLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    परिवार वंशवृक्ष लोड हो रहा है...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Loading family tree...
                  </p>
                </div>
              ) : treeData ? (
                <FamilyTreeView data={transformToHierarchicalTree(treeData)} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Family tree not available</p>
                  <p className="text-xs mt-1">परिवार वंशवृक्ष उपलब्ध नहीं है</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={fetchFamilyTree}
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
