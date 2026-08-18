import { RoomState } from '../types/room';
import { v4 as uuidv4 } from 'uuid';

export const presets: Record<string, RoomState> = {
  masterBedroom: {
    roomType: 'Master Bedroom',
    width: 4.5,
    length: 4.0,
    selectedId: null,
    features: [
      { id: uuidv4(), type: 'door', wall: 'south', offset: 0.5, width: 0.9 },
      { id: uuidv4(), type: 'window', wall: 'north', offset: 1.5, width: 1.5 }
    ],
    furniture: [
      { id: uuidv4(), name: 'King Bed', type: 'bed', width: 2.0, depth: 2.0, x: 1.25, y: 0, rotation: 0 },
      { id: uuidv4(), name: 'Nightstand 1', type: 'coffee_table', width: 0.5, depth: 0.4, x: 0.5, y: 0, rotation: 0 },
      { id: uuidv4(), name: 'Nightstand 2', type: 'coffee_table', width: 0.5, depth: 0.4, x: 3.5, y: 0, rotation: 0 },
      { id: uuidv4(), name: 'Wardrobe', type: 'wardrobe', width: 1.5, depth: 0.6, x: 3.0, y: 3.4, rotation: 0 },
      { id: uuidv4(), name: 'Dresser', type: 'desk', width: 1.2, depth: 0.5, x: 0, y: 2.5, rotation: 90 }
    ]
  },
  modernLivingRoom: {
    roomType: 'Modern Living Room',
    width: 5.5,
    length: 4.2,
    selectedId: null,
    features: [
      { id: uuidv4(), type: 'door', wall: 'west', offset: 1.0, width: 0.9 },
      { id: uuidv4(), type: 'window', wall: 'east', offset: 1.0, width: 3.0 }
    ],
    furniture: [
      { id: uuidv4(), name: '3-Seater Sofa', type: 'sofa', width: 2.4, depth: 0.9, x: 1.5, y: 2.0, rotation: 0 },
      { id: uuidv4(), name: 'Coffee Table', type: 'coffee_table', width: 1.2, depth: 0.6, x: 2.1, y: 1.0, rotation: 0 },
      { id: uuidv4(), name: 'TV Unit', type: 'tv_stand', width: 2.0, depth: 0.4, x: 1.75, y: 0, rotation: 0 },
      { id: uuidv4(), name: 'Bookshelf', type: 'wardrobe', width: 1.0, depth: 0.3, x: 0, y: 0.5, rotation: 90 },
      { id: uuidv4(), name: 'Plant', type: 'plant', width: 0.5, depth: 0.5, x: 5.0, y: 3.7, rotation: 0 }
    ]
  },
  compactHomeOffice: {
    roomType: 'Compact Home Office',
    width: 3.2,
    length: 3.0,
    selectedId: null,
    features: [
      { id: uuidv4(), type: 'door', wall: 'south', offset: 2.0, width: 0.9 },
      { id: uuidv4(), type: 'window', wall: 'north', offset: 1.0, width: 1.2 }
    ],
    furniture: [
      { id: uuidv4(), name: 'Standing Desk', type: 'desk', width: 1.4, depth: 0.7, x: 0.9, y: 0, rotation: 0 },
      { id: uuidv4(), name: 'Ergonomic Chair', type: 'chair', width: 0.6, depth: 0.6, x: 1.3, y: 0.9, rotation: 0 },
      { id: uuidv4(), name: 'Bookshelf', type: 'wardrobe', width: 0.8, depth: 0.3, x: 0, y: 1.5, rotation: 90 },
      { id: uuidv4(), name: 'Lamp', type: 'plant', width: 0.3, depth: 0.3, x: 2.9, y: 0, rotation: 0 }
    ]
  },
  messyLayout: {
    roomType: 'Messy Layout (Fix Me)',
    width: 4.5,
    length: 4.0,
    selectedId: null,
    features: [
      { id: uuidv4(), type: 'door', wall: 'south', offset: 0.5, width: 0.9 },
      { id: uuidv4(), type: 'window', wall: 'north', offset: 1.5, width: 1.5 }
    ],
    furniture: [
      // Bed blocking the door
      { id: uuidv4(), name: 'King Bed', type: 'bed', width: 2.0, depth: 2.0, x: 0.0, y: 2.5, rotation: 0 },
      // Wardrobe blocking the window
      { id: uuidv4(), name: 'Wardrobe', type: 'wardrobe', width: 1.5, depth: 0.6, x: 1.5, y: 0, rotation: 0 },
      // Randomly rotated nightstand in the middle of the room
      { id: uuidv4(), name: 'Nightstand 1', type: 'coffee_table', width: 0.5, depth: 0.4, x: 2.5, y: 1.5, rotation: 90 },
      { id: uuidv4(), name: 'Nightstand 2', type: 'coffee_table', width: 0.5, depth: 0.4, x: 3.5, y: 3.0, rotation: 0 },
      { id: uuidv4(), name: 'Dresser', type: 'desk', width: 1.2, depth: 0.5, x: 3.0, y: 0.5, rotation: 270 }
    ]
  }
};
