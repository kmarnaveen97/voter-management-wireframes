"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Crown,
  Heart,
  Users,
  User,
  Baby,
  UserCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FamilyMember {
  voter_id: number;
  name: string;
  age: number;
  gender: string;
  relationship_type: string;
  relationship_to_head: string;
  confidence: number;
}

export interface FamilyTreeData {
  head: {
    voter_id: number;
    name: string;
    age: number;
    gender: string;
  };
  relationships: FamilyMember[];
  ward_no: string;
  house_no: string;
  member_count: number;
  list_id: number;
  source: string;
}

interface FamilyTreeProps {
  data: FamilyTreeData;
  onMemberClick?: (member: FamilyMember) => void;
}

// Get icon based on relationship type
function getRelationshipIcon(type: string, gender: string) {
  switch (type) {
    case "head":
      return <Crown className="h-4 w-4" />;
    case "spouse":
      return <Heart className="h-4 w-4" />;
    case "son":
    case "daughter":
      return <Baby className="h-4 w-4" />;
    case "brother":
    case "sister":
      return <Users className="h-4 w-4" />;
    default:
      return <UserCircle className="h-4 w-4" />;
  }
}

// Get relationship label in Hindi
function getRelationshipLabel(relation: string): string {
  const labels: Record<string, string> = {
    self: "मुखिया (Head)",
    head: "मुखिया (Head)",
    wife: "पत्नी (Wife)",
    husband: "पति (Husband)",
    son: "पुत्र (Son)",
    daughter: "पुत्री (Daughter)",
    brother: "भाई (Brother)",
    sister: "बहन (Sister)",
    father: "पिता (Father)",
    mother: "माता (Mother)",
    "daughter-in-law": "बहू (Daughter-in-law)",
    "son-in-law": "दामाद (Son-in-law)",
    "sister-in-law": "भाभी (Sister-in-law)",
    "brother-in-law": "जीजा (Brother-in-law)",
    grandson: "पोता (Grandson)",
    granddaughter: "पोती (Granddaughter)",
    grandfather: "दादा (Grandfather)",
    grandmother: "दादी (Grandmother)",
    relative: "रिश्तेदार (Relative)",
    other: "अन्य (Other)",
    spouse: "जीवनसाथी (Spouse)",
  };
  return labels[relation] || relation;
}

// Get color scheme based on relationship
function getRelationshipColor(type: string, gender: string) {
  if (type === "head") {
    return "bg-amber-100 border-amber-400 text-amber-800";
  }
  if (type === "spouse") {
    return gender === "Female" || gender === "म"
      ? "bg-pink-100 border-pink-400 text-pink-800"
      : "bg-blue-100 border-blue-400 text-blue-800";
  }
  if (gender === "Female" || gender === "म") {
    return "bg-pink-50 border-pink-300 text-pink-700";
  }
  return "bg-blue-50 border-blue-300 text-blue-700";
}

// Member Card Component
function MemberNode({
  member,
  isHead = false,
  onClick,
}: {
  member: FamilyMember;
  isHead?: boolean;
  onClick?: () => void;
}) {
  const colorClass = getRelationshipColor(
    member.relationship_type,
    member.gender
  );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-3 rounded-lg border-2 min-w-[120px] max-w-[150px] transition-all cursor-pointer hover:shadow-md",
        colorClass,
        isHead && "ring-2 ring-amber-500 ring-offset-2"
      )}
      onClick={onClick}
    >
      {/* Confidence indicator */}
      {member.confidence < 1 && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{
            background: `conic-gradient(#22c55e ${
              member.confidence * 100
            }%, #e5e7eb ${member.confidence * 100}%)`,
          }}
          title={`${Math.round(member.confidence * 100)}% confidence`}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-2",
          isHead ? "bg-amber-200" : "bg-white/50"
        )}
      >
        {getRelationshipIcon(member.relationship_type, member.gender)}
      </div>

      {/* Name */}
      <p className="font-semibold text-sm text-center leading-tight truncate w-full">
        {member.name}
      </p>

      {/* Age */}
      <p className="text-xs opacity-75">{member.age} वर्ष</p>

      {/* Relationship Badge */}
      <Badge
        variant="outline"
        className={cn("mt-1 text-[10px] px-1.5", colorClass)}
      >
        {getRelationshipLabel(member.relationship_to_head)}
      </Badge>
    </div>
  );
}

// Connector Line Component
function Connector({
  type,
}: {
  type: "vertical" | "horizontal" | "branch-left" | "branch-right";
}) {
  if (type === "vertical") {
    return <div className="w-0.5 h-6 bg-gray-300 mx-auto" />;
  }
  if (type === "horizontal") {
    return <div className="h-0.5 w-8 bg-gray-300" />;
  }
  return null;
}

export function FamilyTree({ data, onMemberClick }: FamilyTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["spouse", "children", "siblings", "in-laws", "other"])
  );

  // Group members by relationship type
  const head = data.relationships.find(
    (m) => m.relationship_type === "head" || m.relationship_to_head === "self"
  );
  const spouses = data.relationships.filter(
    (m) => m.relationship_type === "spouse" && m.relationship_to_head !== "self"
  );
  const children = data.relationships.filter(
    (m) => m.relationship_type === "son" || m.relationship_type === "daughter"
  );
  const siblings = data.relationships.filter(
    (m) => m.relationship_type === "brother" || m.relationship_type === "sister"
  );
  const inLaws = data.relationships.filter(
    (m) =>
      m.relationship_type === "daughter-in-law" ||
      m.relationship_type === "son-in-law" ||
      m.relationship_to_head === "sister-in-law" ||
      m.relationship_to_head === "brother-in-law"
  );
  const others = data.relationships.filter(
    (m) =>
      m.relationship_type === "other" &&
      m.relationship_to_head !== "self" &&
      !["wife", "husband"].includes(m.relationship_to_head)
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const renderGroup = (
    title: string,
    groupKey: string,
    members: FamilyMember[],
    icon: React.ReactNode
  ) => {
    if (members.length === 0) return null;
    const isExpanded = expandedGroups.has(groupKey);

    return (
      <div className="mt-4">
        <button
          onClick={() => toggleGroup(groupKey)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {icon}
          {title} ({members.length})
        </button>
        {isExpanded && (
          <div className="flex flex-wrap gap-3 pl-6">
            {members.map((member) => (
              <MemberNode
                key={member.voter_id}
                member={member}
                onClick={() => onMemberClick?.(member)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-4">
      {/* Head of Family - Centered at top */}
      {head && (
        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Crown className="h-3 w-3" />
            परिवार के मुखिया (Head of Family)
          </div>
          <MemberNode
            member={head}
            isHead
            onClick={() => onMemberClick?.(head)}
          />

          {/* Spouse section - next to head */}
          {spouses.length > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <Connector type="horizontal" />
              <div className="flex gap-3">
                {spouses.map((spouse) => (
                  <MemberNode
                    key={spouse.voter_id}
                    member={spouse}
                    onClick={() => onMemberClick?.(spouse)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vertical connector to children */}
      {children.length > 0 && <Connector type="vertical" />}

      {/* Children */}
      {renderGroup(
        "संतान (Children)",
        "children",
        children,
        <Baby className="h-4 w-4" />
      )}

      {/* Siblings */}
      {renderGroup(
        "भाई-बहन (Siblings)",
        "siblings",
        siblings,
        <Users className="h-4 w-4" />
      )}

      {/* In-laws */}
      {renderGroup(
        "ससुराल (In-Laws)",
        "in-laws",
        inLaws,
        <Heart className="h-4 w-4" />
      )}

      {/* Other relatives */}
      {renderGroup(
        "अन्य रिश्तेदार (Others)",
        "other",
        others,
        <UserCircle className="h-4 w-4" />
      )}

      {/* Source indicator */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          {data.source === "computed" ? (
            <span className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              AI द्वारा संबंध का अनुमान लगाया गया
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              सत्यापित संबंध
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
