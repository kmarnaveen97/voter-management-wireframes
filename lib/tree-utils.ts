import type {
  FamilyTreeData,
  FamilyMember,
} from "@/components/families/family-tree";
import type {
  FamilyTreeMember,
  FamilyTreeViewData,
} from "@/components/families/family-tree-view";
import type { Voter } from "@/lib/api";

// ============================================================================
// Shared Tree Member Type (used by family-mapping and war-room)
// ============================================================================

export interface TreeMember {
  id: number | string;
  serial_no?: string;
  name: string;
  relative_name?: string;
  gender: string;
  age: number;
  house_no: string;
  children: TreeMember[];
  spouse?: TreeMember | null;
  isRoot?: boolean;
  isVirtual?: boolean;
  relType?: string;
}

// Extended member type with related_to info from API
interface RelationshipMember extends FamilyMember {
  related_to?: {
    name: string;
    voter_id: number;
  } | null;
  relative_name?: string;
  serial_no?: string;
}

// ============================================================================
// Shared Utility Functions
// ============================================================================

/**
 * Normalize a name by removing common Hindi honorifics and whitespace
 * Used for matching family members by relative_name
 */
export function normalizeName(name: string | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/(श्री|श्रीमती|कुमारी|कुमार|सिंह|देवी|सिह|बाबू|लाल|प्रसाद)/g, "")
    .replace(/\s+/g, "");
}

/**
 * Check if a gender string represents female
 */
export function isFemaleGender(gender: string): boolean {
  return gender === "Female" || gender === "म" || gender === "F";
}

/**
 * Build a hierarchical house tree from flat voter members
 * Uses name matching and age heuristics to infer relationships
 */
export function buildHouseTree(members: Voter[]): TreeMember[] {
  const nodes: TreeMember[] = members.map((m) => ({
    id: m.voter_id || m.serial_no || Math.random().toString(),
    serial_no: m.serial_no,
    name: m.name,
    relative_name: m.relative_name,
    gender: m.gender,
    age: m.age,
    house_no: m.house_no,
    children: [],
    spouse: null,
    isRoot: true,
  }));

  const nodeMap: Record<string, TreeMember> = {};
  nodes.forEach((n) => (nodeMap[normalizeName(n.name)] = n));

  nodes.forEach((member) => {
    const relativeName = normalizeName(member.relative_name);
    const relative = nodeMap[relativeName];

    if (relative) {
      const isFemale = isFemaleGender(member.gender);
      const ageDiff = (relative.age || 0) - (member.age || 0);

      if (isFemale && Math.abs(ageDiff) < 20) {
        // Likely spouse
        relative.spouse = member;
        member.spouse = relative;
        member.isRoot = false;
        member.relType = "पत्नी";
      } else if (ageDiff > 15) {
        // Likely parent-child relationship
        if (!relative.children) relative.children = [];
        relative.children.push(member);
        member.isRoot = false;
        member.relType = isFemale ? "पुत्री" : "पुत्र";
      }
    }
  });

  // Virtual Root Creation for siblings who share the same parent name
  const roots = nodes.filter((n) => n.isRoot);
  const groups: Record<string, TreeMember[]> = {};

  roots.forEach((r) => {
    const parentKey = normalizeName(r.relative_name);
    if (!groups[parentKey]) groups[parentKey] = [];
    groups[parentKey].push(r);
  });

  const finalTree: TreeMember[] = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length > 1 && key) {
      // Multiple people with same parent - create virtual parent node
      finalTree.push({
        id: `v-${key}`,
        name: group[0].relative_name + " (पितृपुरुष)",
        age: (group[0].age || 50) + 25,
        gender: "Male",
        house_no: group[0].house_no,
        isVirtual: true,
        children: group,
        spouse: null,
      });
      group.forEach((g) => {
        g.isRoot = false;
        g.relType = "पुत्र";
      });
    } else {
      finalTree.push(...group);
    }
  });

  return finalTree;
}

/**
 * Transform flat API tree data into hierarchical structure for visual tree
 * Uses the `related_to` field to properly build parent-child relationships
 */
export function transformToHierarchicalTree(
  data: FamilyTreeData
): FamilyTreeViewData {
  const { head, relationships, ward_no, house_no, member_count } = data;

  // Cast relationships to include related_to
  const members = relationships as RelationshipMember[];

  // Create a map of voter_id to member for quick lookup
  const memberMap = new Map<number, RelationshipMember>();
  members.forEach((m) => memberMap.set(m.voter_id, m));

  // Find head member
  const headMember = members.find(
    (m) => m.relationship_type === "head" || m.relationship_to_head === "self"
  );

  // Find spouse of head
  const headSpouse = members.find(
    (m) =>
      m.relationship_type === "spouse" &&
      m.related_to?.voter_id === head.voter_id
  );

  // Find children of head (sons/daughters with related_to pointing to head)
  const headChildren = members.filter(
    (m) =>
      (m.relationship_type === "son" || m.relationship_type === "daughter") &&
      m.related_to?.voter_id === head.voter_id
  );

  // Find brothers/sisters of head
  const headSiblings = members.filter(
    (m) =>
      (m.relationship_type === "brother" || m.relationship_type === "sister") &&
      m.related_to?.voter_id === head.voter_id
  );

  // Find nieces/nephews (children of siblings)
  const niecesNephews = members.filter(
    (m) => m.relationship_type === "niece" || m.relationship_type === "nephew"
  );

  // Find all "other" relatives
  const otherRelatives = members.filter(
    (m) => m.relationship_type === "other" && m.relationship_to_head !== "self"
  );

  // Helper to find spouse for a person
  const findSpouse = (personId: number): RelationshipMember | undefined => {
    return members.find(
      (m) =>
        (m.relationship_type === "spouse" ||
          m.relationship_type === "sister-in-law" ||
          m.relationship_type === "brother-in-law" ||
          m.relationship_type === "daughter-in-law" ||
          m.relationship_type === "son-in-law") &&
        m.related_to?.voter_id === personId
    );
  };

  // Helper to find children for a person
  const findChildren = (personId: number): RelationshipMember[] => {
    // Check nieces/nephews related_to this person
    const directChildren = niecesNephews.filter(
      (m) => m.related_to?.voter_id === personId
    );
    return directChildren;
  };

  // Build sibling nodes with their families
  const buildSiblingNode = (sibling: RelationshipMember): FamilyTreeMember => {
    const spouse = findSpouse(sibling.voter_id);
    const children = findChildren(sibling.voter_id);

    const siblingNode: FamilyTreeMember = {
      id: sibling.voter_id,
      name: sibling.name,
      hindiName: sibling.name,
      age: sibling.age,
      gender: sibling.gender as "Male" | "Female",
      tag: sibling.gender === "Male" ? "भाई" : "बहन",
      serial_no: sibling.serial_no,
      children: children.map((child) => ({
        id: child.voter_id,
        name: child.name,
        hindiName: child.name,
        age: child.age,
        gender: child.gender as "Male" | "Female",
        tag: child.gender === "Male" ? "भतीजा" : "भतीजी",
        serial_no: child.serial_no,
      })),
    };

    if (spouse) {
      siblingNode.spouse = {
        id: spouse.voter_id,
        name: spouse.name,
        hindiName: spouse.name,
        age: spouse.age,
        gender: spouse.gender as "Male" | "Female",
        serial_no: spouse.serial_no,
      };
    }

    return siblingNode;
  };

  // Build child node
  const buildChildNode = (child: RelationshipMember): FamilyTreeMember => {
    // Find spouse for this child (daughter-in-law/son-in-law)
    const spouse = members.find(
      (m) =>
        (m.relationship_type === "daughter-in-law" ||
          m.relationship_type === "son-in-law") &&
        m.related_to?.voter_id === child.voter_id
    );

    const childNode: FamilyTreeMember = {
      id: child.voter_id,
      name: child.name,
      hindiName: child.name,
      age: child.age,
      gender: child.gender as "Male" | "Female",
      tag: child.gender === "Male" ? "पुत्र" : "पुत्री",
      serial_no: child.serial_no,
      children: [],
    };

    if (spouse) {
      childNode.spouse = {
        id: spouse.voter_id,
        name: spouse.name,
        hindiName: spouse.name,
        age: spouse.age,
        gender: spouse.gender as "Male" | "Female",
        serial_no: spouse.serial_no,
      };
    }

    return childNode;
  };

  // Build head node
  const headNode: FamilyTreeMember = {
    id: head.voter_id,
    name: head.name,
    hindiName: head.name,
    age: head.age,
    gender: head.gender as "Male" | "Female",
    role: "मुखिया",
    serial_no: headMember?.serial_no,
    children: [],
  };

  // Add spouse to head
  if (headSpouse) {
    headNode.spouse = {
      id: headSpouse.voter_id,
      name: headSpouse.name,
      hindiName: headSpouse.name,
      age: headSpouse.age,
      gender: headSpouse.gender as "Male" | "Female",
      serial_no: headSpouse.serial_no,
    };
  }

  // Add children of head
  const childNodes = headChildren.map(buildChildNode);

  // Add siblings with their families
  const siblingNodes = headSiblings.map(buildSiblingNode);

  // Add other relatives as a separate group if any
  const otherNodes: FamilyTreeMember[] = otherRelatives.map((other) => ({
    id: other.voter_id,
    name: other.name,
    hindiName: other.name,
    age: other.age,
    gender: other.gender as "Male" | "Female",
    tag: "रिश्तेदार",
    serial_no: other.serial_no,
    status: "Active" as const,
  }));

  // Combine all children: own children first, then siblings with families, then others
  headNode.children = [...childNodes, ...siblingNodes, ...otherNodes];

  return {
    head: headNode,
    ward_no,
    house_no,
    member_count,
  };
}

/**
 * Get relationship label in Hindi
 */
export function getRelationshipLabel(type: string, gender?: string): string {
  const labels: Record<string, string> = {
    head: "मुखिया",
    self: "मुखिया",
    wife: "पत्नी",
    husband: "पति",
    son: "पुत्र",
    daughter: "पुत्री",
    brother: "भाई",
    sister: "बहन",
    "daughter-in-law": "बहू",
    "son-in-law": "दामाद",
    "sister-in-law": "भाभी",
    "brother-in-law": "जीजा",
    niece: "भतीजी",
    nephew: "भतीजा",
    father: "पिता",
    mother: "माता",
    grandfather: "दादा",
    grandmother: "दादी",
    grandson: "पोता",
    granddaughter: "पोती",
    relative: "रिश्तेदार",
    other: "अन्य",
    spouse: gender === "Female" ? "पत्नी" : "पति",
  };
  return labels[type] || type;
}

/**
 * Create a simple tree from flat members list (fallback)
 */
export function createSimpleTreeFromMembers(
  members: Array<{
    voter_id?: number;
    serial_no?: string;
    name: string;
    age: number;
    gender: string;
    relative_name?: string;
  }>,
  mukhiya: { name: string; age: number; gender: string } | null,
  ward_no: string,
  house_no: string
): FamilyTreeViewData {
  // Find the mukhiya in members
  const mukhiyaMember = mukhiya
    ? members.find((m) => m.name === mukhiya.name)
    : members[0];

  const headNode: FamilyTreeMember = {
    id: mukhiyaMember?.voter_id || parseInt(mukhiyaMember?.serial_no || "0"),
    name: mukhiyaMember?.name || mukhiya?.name || "Unknown",
    hindiName: mukhiyaMember?.name || mukhiya?.name,
    age: mukhiyaMember?.age || mukhiya?.age || 0,
    gender: (mukhiyaMember?.gender || mukhiya?.gender || "Male") as
      | "Male"
      | "Female",
    role: "मुखिया",
    serial_no: mukhiyaMember?.serial_no,
    children: members
      .filter(
        (m) =>
          (m.voter_id || m.serial_no) !==
          (mukhiyaMember?.voter_id || mukhiyaMember?.serial_no)
      )
      .map((m) => ({
        id: m.voter_id || parseInt(m.serial_no || "0"),
        name: m.name,
        hindiName: m.name,
        age: m.age,
        gender: m.gender as "Male" | "Female",
        serial_no: m.serial_no,
      })),
  };

  return {
    head: headNode,
    ward_no,
    house_no,
    member_count: members.length,
  };
}
