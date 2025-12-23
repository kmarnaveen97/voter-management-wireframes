/**
 * War Room Geo-Simulation Utilities
 * Functions for generating ward and house positions on the map
 */

export interface Position {
  x: number;
  y: number;
  size: number;
}

/**
 * Generate ward positions using spiral trajectory (Fermat's spiral / Golden Spiral)
 */
export function generateWardPositions(
  wardCount: number,
  centerX: number,
  centerY: number,
  baseRadius: number
): Position[] {
  const positions: Position[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

  for (let i = 0; i < wardCount; i++) {
    const radius = baseRadius * Math.sqrt(i + 1);
    const angle = i * goldenAngle;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      size: 40 + Math.random() * 10,
    });
  }
  return positions;
}

/**
 * Generate house positions in spiral pattern within a ward
 */
export function generateHouseSpiral(
  houseCount: number,
  centerX: number,
  centerY: number,
  maxRadius: number
): Position[] {
  const positions: Position[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < houseCount; i++) {
    const radius = (maxRadius * Math.sqrt(i + 1)) / Math.sqrt(houseCount);
    const angle = i * goldenAngle;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      size: 8,
    });
  }
  return positions;
}

/**
 * Generate hexagon points for ward polygon
 */
export function generateHexagonPoints(
  cx: number,
  cy: number,
  size: number
): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

/**
 * Generate grid positions for houses within a container
 */
export function generateHouseGridPositions(
  houseCount: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 20
): Position[] {
  const positions: Position[] = [];
  const cols = Math.ceil(
    Math.sqrt(houseCount * (containerWidth / containerHeight))
  );
  const rows = Math.ceil(houseCount / cols);
  const cellWidth = (containerWidth - padding * 2) / cols;
  const cellHeight = (containerHeight - padding * 2) / rows;
  const houseSize = Math.min(cellWidth, cellHeight) * 0.6;

  for (let i = 0; i < houseCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      x: padding + col * cellWidth + cellWidth / 2,
      y: padding + row * cellHeight + cellHeight / 2,
      size: houseSize,
    });
  }
  return positions;
}
