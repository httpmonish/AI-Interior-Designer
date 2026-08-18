// ============================================================
// RoomMind AI — Furniture Catalog
// ============================================================
import { FurnitureTemplate } from '../types';

export const FURNITURE_CATALOG: FurnitureTemplate[] = [
  // --- Seating ---
  { id: 'sofa-3seat', name: '3 Seat Sofa', category: 'seating', dimensions: { width: 220, depth: 90, height: 85 }, color: '#8B9DAF', icon: 'Sofa' },
  { id: 'sofa-2seat', name: '2 Seat Sofa', category: 'seating', dimensions: { width: 160, depth: 85, height: 82 }, color: '#8B9DAF', icon: 'Sofa' },
  { id: 'armchair', name: 'Armchair', category: 'seating', dimensions: { width: 85, depth: 80, height: 80 }, color: '#A0856E', icon: 'Armchair' },
  { id: 'dining-chair', name: 'Dining Chair', category: 'seating', dimensions: { width: 45, depth: 50, height: 90 }, color: '#C4A882', icon: 'Armchair' },
  { id: 'office-chair', name: 'Office Chair', category: 'seating', dimensions: { width: 60, depth: 60, height: 110 }, color: '#3A3A3A', icon: 'Armchair' },
  { id: 'bean-bag', name: 'Bean Bag', category: 'seating', dimensions: { width: 80, depth: 80, height: 70 }, color: '#6B8E8B', icon: 'Sofa' },

  // --- Beds ---
  { id: 'bed-queen', name: 'Queen Bed', category: 'beds', dimensions: { width: 160, depth: 200, height: 55 }, color: '#F5F0E8', icon: 'Bed' },
  { id: 'bed-king', name: 'King Bed', category: 'beds', dimensions: { width: 200, depth: 200, height: 55 }, color: '#F5F0E8', icon: 'Bed' },
  { id: 'bed-single', name: 'Single Bed', category: 'beds', dimensions: { width: 100, depth: 200, height: 50 }, color: '#F5F0E8', icon: 'Bed' },
  { id: 'nightstand', name: 'Nightstand', category: 'beds', dimensions: { width: 45, depth: 40, height: 55 }, color: '#8B7355', icon: 'Square' },

  // --- Tables ---
  { id: 'coffee-table', name: 'Coffee Table', category: 'tables', dimensions: { width: 120, depth: 60, height: 45 }, color: '#8B7355', icon: 'Table' },
  { id: 'dining-table', name: 'Dining Table', category: 'tables', dimensions: { width: 160, depth: 90, height: 76 }, color: '#A0856E', icon: 'Table' },
  { id: 'side-table', name: 'Side Table', category: 'tables', dimensions: { width: 50, depth: 50, height: 55 }, color: '#8B7355', icon: 'Table' },
  { id: 'console-table', name: 'Console Table', category: 'tables', dimensions: { width: 120, depth: 35, height: 80 }, color: '#C4A882', icon: 'Table' },

  // --- Desks ---
  { id: 'study-desk', name: 'Study Desk', category: 'desks', dimensions: { width: 140, depth: 65, height: 75 }, color: '#A0856E', icon: 'Monitor' },
  { id: 'computer-desk', name: 'Computer Desk', category: 'desks', dimensions: { width: 160, depth: 70, height: 75 }, color: '#8B7355', icon: 'Monitor' },
  { id: 'standing-desk', name: 'Standing Desk', category: 'desks', dimensions: { width: 150, depth: 70, height: 110 }, color: '#E5E5E5', icon: 'Monitor' },

  // --- Storage ---
  { id: 'wardrobe', name: 'Wardrobe', category: 'storage', dimensions: { width: 180, depth: 60, height: 210 }, color: '#F5F0E8', icon: 'DoorOpen' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'storage', dimensions: { width: 100, depth: 35, height: 180 }, color: '#8B7355', icon: 'BookOpen' },
  { id: 'dresser', name: 'Dresser', category: 'storage', dimensions: { width: 120, depth: 50, height: 90 }, color: '#C4A882', icon: 'LayoutGrid' },
  { id: 'shoe-rack', name: 'Shoe Rack', category: 'storage', dimensions: { width: 80, depth: 30, height: 100 }, color: '#8B7355', icon: 'Layers' },
  { id: 'storage-cabinet', name: 'Storage Cabinet', category: 'storage', dimensions: { width: 90, depth: 45, height: 120 }, color: '#E5E5E5', icon: 'Archive' },

  // --- TV & Media ---
  { id: 'tv-unit', name: 'TV Unit', category: 'tv-media', dimensions: { width: 180, depth: 45, height: 50 }, color: '#3A3A3A', icon: 'Tv' },
  { id: 'tv-55', name: '55" TV', category: 'tv-media', dimensions: { width: 125, depth: 8, height: 72 }, color: '#1A1A1A', icon: 'Tv' },
  { id: 'speaker', name: 'Speaker', category: 'tv-media', dimensions: { width: 20, depth: 20, height: 35 }, color: '#2A2A2A', icon: 'Speaker' },

  // --- Lighting ---
  { id: 'floor-lamp', name: 'Floor Lamp', category: 'lighting', dimensions: { width: 35, depth: 35, height: 160 }, color: '#F5E6C8', icon: 'Lamp' },
  { id: 'table-lamp', name: 'Table Lamp', category: 'lighting', dimensions: { width: 25, depth: 25, height: 50 }, color: '#F5E6C8', icon: 'LampDesk' },
  { id: 'pendant-light', name: 'Pendant Light', category: 'lighting', dimensions: { width: 40, depth: 40, height: 30 }, color: '#D4AF37', icon: 'Lightbulb' },

  // --- Plants ---
  { id: 'plant-large', name: 'Large Plant', category: 'plants', dimensions: { width: 45, depth: 45, height: 120 }, color: '#4A7C59', icon: 'TreePine' },
  { id: 'plant-medium', name: 'Medium Plant', category: 'plants', dimensions: { width: 30, depth: 30, height: 70 }, color: '#5A8C69', icon: 'Flower2' },
  { id: 'plant-small', name: 'Small Plant', category: 'plants', dimensions: { width: 20, depth: 20, height: 35 }, color: '#6A9C79', icon: 'Sprout' },
  { id: 'plant-hanging', name: 'Hanging Plant', category: 'plants', dimensions: { width: 30, depth: 30, height: 50 }, color: '#4A7C59', icon: 'Leaf' },

  // --- Decor ---
  { id: 'rug-rect', name: 'Area Rug', category: 'decor', dimensions: { width: 200, depth: 140, height: 2 }, color: '#C4A882', icon: 'Square' },
  { id: 'mirror', name: 'Wall Mirror', category: 'decor', dimensions: { width: 80, depth: 5, height: 120 }, color: '#D0D0D0', icon: 'Frame' },
  { id: 'cushion', name: 'Floor Cushion', category: 'decor', dimensions: { width: 60, depth: 60, height: 15 }, color: '#8B6E5B', icon: 'Circle' },

  // --- Kitchen ---
  { id: 'kitchen-counter', name: 'Kitchen Counter', category: 'kitchen', dimensions: { width: 240, depth: 60, height: 90 }, color: '#E5E5E5', icon: 'CookingPot' },
  { id: 'kitchen-island', name: 'Kitchen Island', category: 'kitchen', dimensions: { width: 150, depth: 80, height: 90 }, color: '#C4A882', icon: 'UtensilsCrossed' },
  { id: 'fridge', name: 'Refrigerator', category: 'kitchen', dimensions: { width: 70, depth: 70, height: 180 }, color: '#E0E0E0', icon: 'Snowflake' },
  { id: 'stove', name: 'Stove', category: 'kitchen', dimensions: { width: 60, depth: 60, height: 90 }, color: '#3A3A3A', icon: 'Flame' },
  { id: 'kitchen-sink', name: 'Kitchen Sink', category: 'kitchen', dimensions: { width: 80, depth: 55, height: 90 }, color: '#D0D0D0', icon: 'Droplets' },

  // --- Bathroom ---
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', dimensions: { width: 170, depth: 75, height: 60 }, color: '#F5F5F5', icon: 'Bath' },
  { id: 'toilet', name: 'Toilet', category: 'bathroom', dimensions: { width: 40, depth: 65, height: 75 }, color: '#F5F5F5', icon: 'Circle' },
  { id: 'vanity', name: 'Bathroom Vanity', category: 'bathroom', dimensions: { width: 90, depth: 50, height: 85 }, color: '#C4A882', icon: 'RectangleHorizontal' },

  // --- Outdoor ---
  { id: 'outdoor-chair', name: 'Outdoor Chair', category: 'outdoor', dimensions: { width: 60, depth: 65, height: 80 }, color: '#8B7355', icon: 'Armchair' },
  { id: 'outdoor-table', name: 'Outdoor Table', category: 'outdoor', dimensions: { width: 80, depth: 80, height: 72 }, color: '#8B7355', icon: 'Table' },
  { id: 'planter', name: 'Planter Box', category: 'outdoor', dimensions: { width: 60, depth: 25, height: 40 }, color: '#6B4226', icon: 'Flower2' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  'seating': 'Seating',
  'beds': 'Beds',
  'tables': 'Tables',
  'desks': 'Desks',
  'storage': 'Storage',
  'tv-media': 'TV & Media',
  'lighting': 'Lighting',
  'plants': 'Plants',
  'decor': 'Decor',
  'kitchen': 'Kitchen',
  'bathroom': 'Bathroom',
  'outdoor': 'Outdoor',
};
