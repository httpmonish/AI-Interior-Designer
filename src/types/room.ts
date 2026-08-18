export type WallType = 'north' | 'south' | 'east' | 'west';

export interface ArchitecturalFeature {
  id: string;
  type: 'door' | 'window';
  wall: WallType;
  offset: number; // meters from wall start
  width: number;  // meters
}

export interface FurnitureItem {
  id: string;
  name: string;
  type: 'bed' | 'sofa' | 'desk' | 'wardrobe' | 'tv_stand' | 'coffee_table' | 'chair' | 'plant' | 'dining_table';
  width: number;    // meters (X)
  depth: number;    // meters (Y)
  x: number;        // Canvas X position in meters
  y: number;        // Canvas Y position in meters
  rotation: number; // 0, 90, 180, 270 degrees
  color?: string;
}

export interface RoomState {
  roomType: string;
  width: number;   // meters (e.g. 4.5)
  length: number;  // meters (e.g. 3.8)
  features: ArchitecturalFeature[];
  furniture: FurnitureItem[];
  selectedId: string | null;
}

export interface AuditReport {
  overallScore: number; // 0 - 100
  trafficFlowScore: number;
  doorClearanceScore: number;
  windowAccessScore: number;
  pros: string[];
  warnings: string[];
  rationale: string;
}
