// ============================================================
// RoomMind AI — Demo Apartment Data
// ============================================================
import { Room, FurnitureItem, LifestyleProfile } from '../types';

// Helper to generate IDs
let _demoId = 0;
const dId = (prefix: string) => `demo-${prefix}-${++_demoId}`;

// ============================================================
// ROOMS
// ============================================================
export const DEMO_ROOMS: Room[] = [
  // Living Room
  {
    id: 'room-living',
    name: 'Living Room',
    type: 'living-room',
    dimensions: { width: 500, length: 400, height: 280 },
    position: { x: 0, y: 0, z: 0 },
    doors: [
      { id: 'd-living-1', wall: 'south', position: 200, width: 100, height: 210, type: 'hinged', swingDirection: 'inward' },
      { id: 'd-living-2', wall: 'east', position: 180, width: 90, height: 210, type: 'sliding', swingDirection: 'inward' },
    ],
    windows: [
      { id: 'w-living-1', wall: 'north', position: 100, width: 180, height: 150, sillHeight: 80 },
      { id: 'w-living-2', wall: 'west', position: 100, width: 150, height: 150, sillHeight: 80 },
    ],
    floorMaterial: { id: 'fm-wood', name: 'Oak Wood', category: 'flooring', color: '#C4A882', roughness: 0.7, metalness: 0 },
    wallMaterial: { id: 'wm-white', name: 'Warm White', category: 'walls', color: '#FAF8F5', roughness: 0.9, metalness: 0 },
  },

  // Bedroom
  {
    id: 'room-bedroom',
    name: 'Bedroom',
    type: 'bedroom',
    dimensions: { width: 400, length: 350, height: 280 },
    position: { x: 500, y: 0, z: 0 },
    doors: [
      { id: 'd-bed-1', wall: 'west', position: 150, width: 90, height: 210, type: 'hinged', swingDirection: 'inward' },
    ],
    windows: [
      { id: 'w-bed-1', wall: 'north', position: 120, width: 160, height: 140, sillHeight: 85 },
      { id: 'w-bed-2', wall: 'east', position: 100, width: 120, height: 140, sillHeight: 85 },
    ],
    floorMaterial: { id: 'fm-wood2', name: 'Oak Wood', category: 'flooring', color: '#C4A882', roughness: 0.7, metalness: 0 },
    wallMaterial: { id: 'wm-cream', name: 'Soft Cream', category: 'walls', color: '#FDF5E6', roughness: 0.9, metalness: 0 },
  },

  // Study Area
  {
    id: 'room-study',
    name: 'Study',
    type: 'study',
    dimensions: { width: 300, length: 280, height: 280 },
    position: { x: 500, y: 0, z: 350 },
    doors: [
      { id: 'd-study-1', wall: 'west', position: 100, width: 80, height: 210, type: 'hinged', swingDirection: 'inward' },
    ],
    windows: [
      { id: 'w-study-1', wall: 'east', position: 80, width: 120, height: 130, sillHeight: 90 },
    ],
    floorMaterial: { id: 'fm-wood3', name: 'Oak Wood', category: 'flooring', color: '#C4A882', roughness: 0.7, metalness: 0 },
    wallMaterial: { id: 'wm-light', name: 'Light Grey', category: 'walls', color: '#F0EDE8', roughness: 0.9, metalness: 0 },
  },

  // Kitchen
  {
    id: 'room-kitchen',
    name: 'Kitchen',
    type: 'kitchen',
    dimensions: { width: 350, length: 300, height: 280 },
    position: { x: 0, y: 0, z: 400 },
    doors: [
      { id: 'd-kitchen-1', wall: 'south', position: 130, width: 90, height: 210, type: 'hinged', swingDirection: 'inward' },
    ],
    windows: [
      { id: 'w-kitchen-1', wall: 'west', position: 80, width: 120, height: 120, sillHeight: 100 },
    ],
    floorMaterial: { id: 'fm-tile', name: 'White Tile', category: 'flooring', color: '#EDEDED', roughness: 0.4, metalness: 0 },
    wallMaterial: { id: 'wm-kitchen', name: 'Kitchen White', category: 'walls', color: '#FFFFFF', roughness: 0.8, metalness: 0 },
  },

  // Bathroom
  {
    id: 'room-bathroom',
    name: 'Bathroom',
    type: 'bathroom',
    dimensions: { width: 250, length: 200, height: 280 },
    position: { x: 350, y: 0, z: 400 },
    doors: [
      { id: 'd-bath-1', wall: 'south', position: 80, width: 75, height: 210, type: 'hinged', swingDirection: 'inward' },
    ],
    windows: [
      { id: 'w-bath-1', wall: 'north', position: 80, width: 80, height: 80, sillHeight: 140 },
    ],
    floorMaterial: { id: 'fm-tile2', name: 'Grey Tile', category: 'flooring', color: '#D0D0D0', roughness: 0.3, metalness: 0 },
    wallMaterial: { id: 'wm-bath', name: 'Bathroom White', category: 'walls', color: '#F5F5F5', roughness: 0.4, metalness: 0 },
  },

  // Balcony
  {
    id: 'room-balcony',
    name: 'Balcony',
    type: 'custom',
    dimensions: { width: 500, length: 150, height: 120 },
    position: { x: 0, y: 0, z: -150 },
    doors: [],
    windows: [],
    floorMaterial: { id: 'fm-stone', name: 'Stone', category: 'flooring', color: '#B8A99A', roughness: 0.8, metalness: 0 },
    wallMaterial: { id: 'wm-balcony', name: 'Concrete', category: 'walls', color: '#D0CFC8', roughness: 0.9, metalness: 0 },
  },
];

// ============================================================
// FURNITURE
// ============================================================
export const DEMO_FURNITURE: FurnitureItem[] = [
  // --- Living Room ---
  {
    id: dId('f'), templateId: 'sofa-3seat', name: '3 Seat Sofa', category: 'seating',
    dimensions: { width: 220, depth: 90, height: 85 },
    position: { x: 140, y: 0, z: 250 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B9DAF', material: { id: 'mf1', name: 'Fabric', category: 'furniture', color: '#8B9DAF', roughness: 0.8, metalness: 0 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'armchair', name: 'Armchair', category: 'seating',
    dimensions: { width: 85, depth: 80, height: 80 },
    position: { x: 380, y: 0, z: 180 }, rotation: { x: 0, y: -90, z: 0 },
    color: '#A0856E', material: { id: 'mf2', name: 'Leather', category: 'furniture', color: '#A0856E', roughness: 0.6, metalness: 0.05 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'coffee-table', name: 'Coffee Table', category: 'tables',
    dimensions: { width: 120, depth: 60, height: 45 },
    position: { x: 200, y: 0, z: 170 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B7355', material: { id: 'mf3', name: 'Wood', category: 'furniture', color: '#8B7355', roughness: 0.7, metalness: 0 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'tv-unit', name: 'TV Unit', category: 'tv-media',
    dimensions: { width: 180, depth: 45, height: 50 },
    position: { x: 160, y: 0, z: 25 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#3A3A3A', material: { id: 'mf4', name: 'Matte', category: 'furniture', color: '#3A3A3A', roughness: 0.5, metalness: 0.1 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'tv-55', name: '55" TV', category: 'tv-media',
    dimensions: { width: 125, depth: 8, height: 72 },
    position: { x: 188, y: 50, z: 25 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#1A1A1A', material: { id: 'mf5', name: 'Screen', category: 'glass', color: '#1A1A1A', roughness: 0.1, metalness: 0.3 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'plant-large', name: 'Large Plant', category: 'plants',
    dimensions: { width: 45, depth: 45, height: 120 },
    position: { x: 460, y: 0, z: 30 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#4A7C59', material: { id: 'mf6', name: 'Natural', category: 'furniture', color: '#4A7C59', roughness: 0.9, metalness: 0 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'floor-lamp', name: 'Floor Lamp', category: 'lighting',
    dimensions: { width: 35, depth: 35, height: 160 },
    position: { x: 30, y: 0, z: 280 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#F5E6C8', material: { id: 'mf7', name: 'Metal', category: 'metal', color: '#C0C0C0', roughness: 0.3, metalness: 0.8 },
    roomId: 'room-living', locked: false,
  },
  {
    id: dId('f'), templateId: 'rug-rect', name: 'Area Rug', category: 'decor',
    dimensions: { width: 200, depth: 140, height: 2 },
    position: { x: 150, y: 0, z: 180 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#C4A882', material: { id: 'mf8', name: 'Fabric', category: 'furniture', color: '#C4A882', roughness: 0.95, metalness: 0 },
    roomId: 'room-living', locked: false,
  },

  // --- Bedroom ---
  {
    id: dId('f'), templateId: 'bed-queen', name: 'Queen Bed', category: 'beds',
    dimensions: { width: 160, depth: 200, height: 55 },
    position: { x: 620, y: 0, z: 150 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#F5F0E8', material: { id: 'mf9', name: 'Linen', category: 'furniture', color: '#F5F0E8', roughness: 0.85, metalness: 0 },
    roomId: 'room-bedroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'nightstand', name: 'Nightstand L', category: 'beds',
    dimensions: { width: 45, depth: 40, height: 55 },
    position: { x: 540, y: 0, z: 120 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B7355', material: { id: 'mf10', name: 'Wood', category: 'furniture', color: '#8B7355', roughness: 0.7, metalness: 0 },
    roomId: 'room-bedroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'nightstand', name: 'Nightstand R', category: 'beds',
    dimensions: { width: 45, depth: 40, height: 55 },
    position: { x: 810, y: 0, z: 120 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B7355', material: { id: 'mf11', name: 'Wood', category: 'furniture', color: '#8B7355', roughness: 0.7, metalness: 0 },
    roomId: 'room-bedroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'wardrobe', name: 'Wardrobe', category: 'storage',
    dimensions: { width: 180, depth: 60, height: 210 },
    position: { x: 710, y: 0, z: 310 }, rotation: { x: 0, y: 180, z: 0 },
    color: '#F5F0E8', material: { id: 'mf12', name: 'Laminate', category: 'furniture', color: '#F5F0E8', roughness: 0.5, metalness: 0.05 },
    roomId: 'room-bedroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'table-lamp', name: 'Bedside Lamp', category: 'lighting',
    dimensions: { width: 25, depth: 25, height: 50 },
    position: { x: 553, y: 55, z: 130 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#F5E6C8', material: { id: 'mf13', name: 'Ceramic', category: 'furniture', color: '#F5E6C8', roughness: 0.6, metalness: 0 },
    roomId: 'room-bedroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'plant-medium', name: 'Bedroom Plant', category: 'plants',
    dimensions: { width: 30, depth: 30, height: 70 },
    position: { x: 870, y: 0, z: 30 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#5A8C69', material: { id: 'mf14', name: 'Natural', category: 'furniture', color: '#5A8C69', roughness: 0.9, metalness: 0 },
    roomId: 'room-bedroom', locked: false,
  },

  // --- Study ---
  {
    id: dId('f'), templateId: 'study-desk', name: 'Study Desk', category: 'desks',
    dimensions: { width: 140, depth: 65, height: 75 },
    position: { x: 580, y: 0, z: 500 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#A0856E', material: { id: 'mf15', name: 'Wood', category: 'furniture', color: '#A0856E', roughness: 0.7, metalness: 0 },
    roomId: 'room-study', locked: false,
  },
  {
    id: dId('f'), templateId: 'office-chair', name: 'Office Chair', category: 'seating',
    dimensions: { width: 60, depth: 60, height: 110 },
    position: { x: 620, y: 0, z: 560 }, rotation: { x: 0, y: 180, z: 0 },
    color: '#3A3A3A', material: { id: 'mf16', name: 'Mesh', category: 'furniture', color: '#3A3A3A', roughness: 0.7, metalness: 0.1 },
    roomId: 'room-study', locked: false,
  },
  {
    id: dId('f'), templateId: 'bookshelf', name: 'Bookshelf', category: 'storage',
    dimensions: { width: 100, depth: 35, height: 180 },
    position: { x: 750, y: 0, z: 380 }, rotation: { x: 0, y: -90, z: 0 },
    color: '#8B7355', material: { id: 'mf17', name: 'Wood', category: 'furniture', color: '#8B7355', roughness: 0.7, metalness: 0 },
    roomId: 'room-study', locked: false,
  },
  {
    id: dId('f'), templateId: 'table-lamp', name: 'Desk Lamp', category: 'lighting',
    dimensions: { width: 25, depth: 25, height: 50 },
    position: { x: 690, y: 75, z: 510 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#F5E6C8', material: { id: 'mf18', name: 'Metal', category: 'metal', color: '#2A2A2A', roughness: 0.3, metalness: 0.8 },
    roomId: 'room-study', locked: false,
  },

  // --- Kitchen ---
  {
    id: dId('f'), templateId: 'kitchen-counter', name: 'Kitchen Counter', category: 'kitchen',
    dimensions: { width: 240, depth: 60, height: 90 },
    position: { x: 55, y: 0, z: 440 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#E5E5E5', material: { id: 'mf19', name: 'Stone', category: 'countertops', color: '#E5E5E5', roughness: 0.3, metalness: 0.05 },
    roomId: 'room-kitchen', locked: false,
  },
  {
    id: dId('f'), templateId: 'fridge', name: 'Refrigerator', category: 'kitchen',
    dimensions: { width: 70, depth: 70, height: 180 },
    position: { x: 300, y: 0, z: 440 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#E0E0E0', material: { id: 'mf20', name: 'Steel', category: 'metal', color: '#E0E0E0', roughness: 0.2, metalness: 0.9 },
    roomId: 'room-kitchen', locked: false,
  },
  {
    id: dId('f'), templateId: 'dining-table', name: 'Dining Table', category: 'tables',
    dimensions: { width: 160, depth: 90, height: 76 },
    position: { x: 100, y: 0, z: 600 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#A0856E', material: { id: 'mf21', name: 'Wood', category: 'furniture', color: '#A0856E', roughness: 0.7, metalness: 0 },
    roomId: 'room-kitchen', locked: false,
  },
  {
    id: dId('f'), templateId: 'dining-chair', name: 'Dining Chair 1', category: 'seating',
    dimensions: { width: 45, depth: 50, height: 90 },
    position: { x: 100, y: 0, z: 560 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#C4A882', material: { id: 'mf22', name: 'Wood', category: 'furniture', color: '#C4A882', roughness: 0.7, metalness: 0 },
    roomId: 'room-kitchen', locked: false,
  },
  {
    id: dId('f'), templateId: 'dining-chair', name: 'Dining Chair 2', category: 'seating',
    dimensions: { width: 45, depth: 50, height: 90 },
    position: { x: 180, y: 0, z: 560 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#C4A882', material: { id: 'mf23', name: 'Wood', category: 'furniture', color: '#C4A882', roughness: 0.7, metalness: 0 },
    roomId: 'room-kitchen', locked: false,
  },
  {
    id: dId('f'), templateId: 'dining-chair', name: 'Dining Chair 3', category: 'seating',
    dimensions: { width: 45, depth: 50, height: 90 },
    position: { x: 100, y: 0, z: 655 }, rotation: { x: 0, y: 180, z: 0 },
    color: '#C4A882', material: { id: 'mf24', name: 'Wood', category: 'furniture', color: '#C4A882', roughness: 0.7, metalness: 0 },
    roomId: 'room-kitchen', locked: false,
  },
  {
    id: dId('f'), templateId: 'dining-chair', name: 'Dining Chair 4', category: 'seating',
    dimensions: { width: 45, depth: 50, height: 90 },
    position: { x: 180, y: 0, z: 655 }, rotation: { x: 0, y: 180, z: 0 },
    color: '#C4A882', material: { id: 'mf25', name: 'Wood', category: 'furniture', color: '#C4A882', roughness: 0.7, metalness: 0 },
    roomId: 'room-kitchen', locked: false,
  },

  // --- Bathroom ---
  {
    id: dId('f'), templateId: 'bathtub', name: 'Bathtub', category: 'bathroom',
    dimensions: { width: 170, depth: 75, height: 60 },
    position: { x: 400, y: 0, z: 440 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#F5F5F5', material: { id: 'mf26', name: 'Ceramic', category: 'furniture', color: '#F5F5F5', roughness: 0.2, metalness: 0.1 },
    roomId: 'room-bathroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'vanity', name: 'Bathroom Vanity', category: 'bathroom',
    dimensions: { width: 90, depth: 50, height: 85 },
    position: { x: 400, y: 0, z: 545 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#C4A882', material: { id: 'mf27', name: 'Wood', category: 'furniture', color: '#C4A882', roughness: 0.6, metalness: 0 },
    roomId: 'room-bathroom', locked: false,
  },
  {
    id: dId('f'), templateId: 'toilet', name: 'Toilet', category: 'bathroom',
    dimensions: { width: 40, depth: 65, height: 75 },
    position: { x: 540, y: 0, z: 540 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#F5F5F5', material: { id: 'mf28', name: 'Ceramic', category: 'furniture', color: '#F5F5F5', roughness: 0.2, metalness: 0.1 },
    roomId: 'room-bathroom', locked: false,
  },

  // --- Balcony ---
  {
    id: dId('f'), templateId: 'outdoor-chair', name: 'Balcony Chair 1', category: 'outdoor',
    dimensions: { width: 60, depth: 65, height: 80 },
    position: { x: 100, y: 0, z: -80 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B7355', material: { id: 'mf29', name: 'Teak', category: 'furniture', color: '#8B7355', roughness: 0.8, metalness: 0 },
    roomId: 'room-balcony', locked: false,
  },
  {
    id: dId('f'), templateId: 'outdoor-chair', name: 'Balcony Chair 2', category: 'outdoor',
    dimensions: { width: 60, depth: 65, height: 80 },
    position: { x: 230, y: 0, z: -80 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B7355', material: { id: 'mf30', name: 'Teak', category: 'furniture', color: '#8B7355', roughness: 0.8, metalness: 0 },
    roomId: 'room-balcony', locked: false,
  },
  {
    id: dId('f'), templateId: 'outdoor-table', name: 'Balcony Table', category: 'outdoor',
    dimensions: { width: 80, depth: 80, height: 72 },
    position: { x: 150, y: 0, z: -80 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#8B7355', material: { id: 'mf31', name: 'Teak', category: 'furniture', color: '#8B7355', roughness: 0.8, metalness: 0 },
    roomId: 'room-balcony', locked: false,
  },
  {
    id: dId('f'), templateId: 'planter', name: 'Planter 1', category: 'outdoor',
    dimensions: { width: 60, depth: 25, height: 40 },
    position: { x: 370, y: 0, z: -120 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#6B4226', material: { id: 'mf32', name: 'Clay', category: 'furniture', color: '#6B4226', roughness: 0.9, metalness: 0 },
    roomId: 'room-balcony', locked: false,
  },
  {
    id: dId('f'), templateId: 'plant-large', name: 'Balcony Plant', category: 'plants',
    dimensions: { width: 45, depth: 45, height: 120 },
    position: { x: 440, y: 0, z: -90 }, rotation: { x: 0, y: 0, z: 0 },
    color: '#4A7C59', material: { id: 'mf33', name: 'Natural', category: 'furniture', color: '#4A7C59', roughness: 0.9, metalness: 0 },
    roomId: 'room-balcony', locked: false,
  },
];

// ============================================================
// LIFESTYLE
// ============================================================
export const DEMO_LIFESTYLE: LifestyleProfile = {
  activities: ['relaxing', 'watching-tv', 'studying', 'working'],
  priorities: ['open-space', 'natural-light', 'comfortable-seating'],
  style: 'modern',
  additionalNotes: 'I study every evening and want my desk close to natural light. The living room should feel open and inviting.',
};

// ============================================================
// DEFAULT SINGLE ROOM (for new projects)
// ============================================================
export const DEFAULT_ROOM: Room = {
  id: 'room-default',
  name: 'New Room',
  type: 'living-room',
  dimensions: { width: 400, length: 350, height: 280 },
  position: { x: 0, y: 0, z: 0 },
  doors: [
    { id: 'door-default-1', wall: 'south', position: 150, width: 90, height: 210, type: 'hinged', swingDirection: 'inward' },
  ],
  windows: [
    { id: 'win-default-1', wall: 'north', position: 120, width: 150, height: 140, sillHeight: 85 },
  ],
  floorMaterial: { id: 'fm-default', name: 'Oak Wood', category: 'flooring', color: '#C4A882', roughness: 0.7, metalness: 0 },
  wallMaterial: { id: 'wm-default', name: 'Warm White', category: 'walls', color: '#FAF8F5', roughness: 0.9, metalness: 0 },
};
