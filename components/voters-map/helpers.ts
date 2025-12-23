// Helper functions for Voters Map visualization
import { WARD_STATUS_COLORS } from "./constants";

// Seeded random for deterministic results
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Get dot size based on family size
export const getDotSize = (familySize: number) =>
  Math.min(8 + familySize * 1.5, 24);

// Get opacity based on confidence
export const getOpacity = (confidence: number) => 0.5 + confidence * 0.5;

// Generate hexagonal polygon points for ward shapes (deterministic)
export const generateHexagonPath = (
  cx: number,
  cy: number,
  size: number,
  irregularity: number = 0.15,
  seed: number = 0
): string => {
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    // Use seeded random based on position + vertex index for consistency
    const r =
      size *
      (1 + (seededRandom(seed + i * 100 + cx + cy) - 0.5) * irregularity);
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return (
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") +
    " Z"
  );
};

// Generate Phyllotaxis spiral positions for house dots (sunflower pattern)
export const generatePhyllotaxisPositions = (
  count: number,
  cx: number,
  cy: number,
  maxRadius: number
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

  for (let i = 0; i < count; i++) {
    const theta = i * goldenAngle;
    const r = maxRadius * Math.sqrt(i / count) * 0.9; // Scale to fit within polygon
    positions.push({
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    });
  }
  return positions;
};

// Get ward color based on win margin percentage
export const getWardHeatColor = (margin: number): string => {
  if (margin > 15) return WARD_STATUS_COLORS.safe; // Deep green - dominating
  if (margin > 5) return WARD_STATUS_COLORS.leaning; // Light green - leading
  if (margin >= -5) return WARD_STATUS_COLORS.battleground; // Yellow - battleground
  if (margin >= -15) return WARD_STATUS_COLORS.contested; // Light red - contested
  return WARD_STATUS_COLORS.lost; // Red - losing
};

// Get strategic verdict for hover card
export const getStrategicVerdict = (
  margin: number
): { label: string; emoji: string; color: string } => {
  if (margin > 15)
    return { label: "Safe Zone", emoji: "🛡️", color: "text-green-600" };
  if (margin > 5)
    return { label: "Comfortable Lead", emoji: "✅", color: "text-green-500" };
  if (margin >= -5)
    return {
      label: "High Competition Zone",
      emoji: "⚔️",
      color: "text-yellow-600",
    };
  if (margin >= -15)
    return { label: "Under Threat", emoji: "⚠️", color: "text-orange-500" };
  return {
    label: "Critical - Needs Attention",
    emoji: "🚨",
    color: "text-red-600",
  };
};

// Generate ward positions in a ring/circular arrangement
export const generateWardRingLayout = (
  wardCount: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];

  // Place center ward if exists
  if (wardCount >= 1) {
    positions.push({ x: centerX, y: centerY });
  }

  // Place remaining wards in concentric rings
  let remaining = wardCount - 1;
  let ring = 1;

  while (remaining > 0) {
    const ringWards = Math.min(remaining, ring * 6); // 6, 12, 18... wards per ring
    const ringRadius = radius * ring * 0.4;

    for (let i = 0; i < ringWards; i++) {
      const angle = (2 * Math.PI * i) / ringWards - Math.PI / 2;
      positions.push({
        x: centerX + ringRadius * Math.cos(angle),
        y: centerY + ringRadius * Math.sin(angle),
      });
    }

    remaining -= ringWards;
    ring++;
  }

  return positions;
};
