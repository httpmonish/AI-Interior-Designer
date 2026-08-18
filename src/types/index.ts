// ============================================================
// RoomMind AI — Type Definitions
// ============================================================

// --- Geometry & Position ---
export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// --- Room ---
export type RoomType =
  | 'living-room'
  | 'bedroom'
  | 'study'
  | 'home-office'
  | 'dining-room'
  | 'gaming-room'
  | 'studio'
  | 'kitchen'
  | 'bathroom'
  | 'custom';

export type WallSide = 'north' | 'south' | 'east' | 'west';

export interface RoomDimensions {
  width: number;   // cm
  length: number;  // cm
  height: number;  // cm
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  dimensions: RoomDimensions;
  position: Vec3;        // offset for multi-room
  doors: Door[];
  windows: RoomWindow[];
  floorMaterial: MaterialPreset;
  wallMaterial: MaterialPreset;
}

// --- Door ---
export type DoorType = 'hinged' | 'sliding';
export type SwingDirection = 'inward' | 'outward';

export interface Door {
  id: string;
  wall: WallSide;
  position: number;     // cm from wall start
  width: number;        // cm
  height: number;       // cm
  type: DoorType;
  swingDirection: SwingDirection;
}

// --- Window ---
export interface RoomWindow {
  id: string;
  wall: WallSide;
  position: number;     // cm from wall start
  width: number;        // cm
  height: number;       // cm
  sillHeight: number;   // cm from floor
}

// --- Furniture ---
export type FurnitureCategory =
  | 'seating'
  | 'beds'
  | 'tables'
  | 'desks'
  | 'storage'
  | 'tv-media'
  | 'lighting'
  | 'plants'
  | 'decor'
  | 'kitchen'
  | 'bathroom'
  | 'outdoor';

export interface FurnitureDimensions {
  width: number;   // cm
  depth: number;   // cm
  height: number;  // cm
}

export interface FurnitureTemplate {
  id: string;
  name: string;
  category: FurnitureCategory;
  dimensions: FurnitureDimensions;
  color: string;
  icon: string;
}

export interface FurnitureItem {
  id: string;
  templateId: string;
  name: string;
  category: FurnitureCategory;
  dimensions: FurnitureDimensions;
  position: Vec3;
  rotation: Vec3;       // degrees
  color: string;
  material: MaterialPreset;
  roomId: string;
  locked: boolean;
}

// --- Materials ---
export type MaterialCategory =
  | 'flooring'
  | 'walls'
  | 'furniture'
  | 'countertops'
  | 'metal'
  | 'glass';

export type StylePreset =
  | 'modern'
  | 'minimal'
  | 'scandinavian'
  | 'contemporary'
  | 'warm-cozy';

export interface MaterialPreset {
  id: string;
  name: string;
  category: MaterialCategory;
  color: string;
  roughness: number;
  metalness: number;
}

// --- Lifestyle ---
export type Activity =
  | 'relaxing'
  | 'sleeping'
  | 'studying'
  | 'working'
  | 'gaming'
  | 'watching-tv'
  | 'entertaining'
  | 'dining';

export type Priority =
  | 'open-space'
  | 'storage'
  | 'natural-light'
  | 'comfortable-seating'
  | 'productivity'
  | 'entertainment'
  | 'minimal-clutter';

export interface LifestyleProfile {
  activities: Activity[];
  priorities: Priority[];
  style: StylePreset;
  additionalNotes: string;
}

// --- AI ---
export type LayoutVariant = 'smart-balance' | 'open-space' | 'lifestyle-focus';

export interface DesignMetrics {
  spaceEfficiency: number;   // 0-100
  walkability: number;
  functionality: number;
  naturalLight: number;
  balance: number;
  overall: number;
}

export interface FurnitureMove {
  furnitureId: string;
  furnitureName: string;
  fromPosition: Vec3;
  toPosition: Vec3;
  fromRotation: Vec3;
  toRotation: Vec3;
  reason: string;
}

export interface AILayout {
  id: string;
  variant: LayoutVariant;
  name: string;
  description: string;
  furniture: FurnitureItem[];
  metrics: DesignMetrics;
  moves: FurnitureMove[];
}

export interface RoomHealthCheck {
  id: string;
  label: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  furnitureId?: string;
}

export interface WalkingPath {
  points: Vec2[];
  width: number;         // cm
  isNarrow: boolean;
  label: string;
}

export interface ClearanceWarning {
  furnitureId: string;
  furnitureName: string;
  nearObjectId: string;
  nearObjectName: string;
  distance: number;      // cm
  recommended: number;   // cm
}

// --- Chat ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  type: 'apply-changes' | 'cancel' | 'more-info';
  changes?: Partial<FurnitureItem>[];
}

// --- What-If ---
export interface WhatIfScenario {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface WhatIfResult {
  scenario: WhatIfScenario;
  currentMetrics: DesignMetrics;
  predictedMetrics: DesignMetrics;
  recommendation: string;
  changes: FurnitureMove[];
}

// --- UI State ---
export type ActiveTool =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'orbit'
  | 'measure'
  | 'pan';

export type ViewMode = '2d' | '3d';

export type CameraView =
  | 'isometric'
  | 'top'
  | 'front'
  | 'right'
  | 'free';

export type DesignerMode = 'manual' | 'ai';

export type RightPanelView =
  | 'ai-assistant'
  | 'furniture-inspector'
  | 'room-health'
  | 'design-score'
  | 'room-info'
  | 'materials';

export type LeftPanelView =
  | 'navigation'
  | 'furniture'
  | 'materials'
  | 'room-setup';

export type AppPage =
  | 'landing'
  | 'dashboard'
  | 'designer'
  | 'setup';

export type SetupStep =
  | 'space'
  | 'openings'
  | 'lifestyle'
  | 'furniture';

// --- Projects ---
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  rooms: Room[];
  furniture: FurnitureItem[];
  lifestyle: LifestyleProfile;
  style: StylePreset;
  isDemo: boolean;
}
