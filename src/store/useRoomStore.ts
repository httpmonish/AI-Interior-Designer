import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoomState, FurnitureItem, ArchitecturalFeature, AuditReport } from '../types/room';
import { presets } from '../data/presets';

interface RoomStore extends RoomState {
  auditReport: AuditReport | null;
  isOptimizing: boolean;
  
  setRoomDimensions: (width: number, length: number) => void;
  addFeature: (feature: ArchitecturalFeature) => void;
  removeFeature: (id: string) => void;
  addFurniture: (item: FurnitureItem) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  loadPreset: (presetName: string) => void;
  triggerAIOptimize: () => Promise<void>;
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set, get) => ({
      roomType: presets.masterBedroom.roomType,
      width: presets.masterBedroom.width,
      length: presets.masterBedroom.length,
      features: presets.masterBedroom.features,
      furniture: presets.masterBedroom.furniture,
      selectedId: null,
      auditReport: null,
      isOptimizing: false,

      setRoomDimensions: (width, length) => set({ width, length }),
      addFeature: (feature) => set((state) => ({ features: [...state.features, feature] })),
      removeFeature: (id) => set((state) => ({ features: state.features.filter((f) => f.id !== id) })),
      addFurniture: (item) => set((state) => ({ furniture: [...state.furniture, item] })),
      updateFurniture: (id, updates) => set((state) => ({
        furniture: state.furniture.map((item) => (item.id === id ? { ...item, ...updates } : item))
      })),
      removeFurniture: (id) => set((state) => ({ furniture: state.furniture.filter((f) => f.id !== id) })),
      setSelectedId: (selectedId) => set({ selectedId }),
      loadPreset: (presetName) => {
        const preset = presets[presetName];
        if (preset) {
          set({
            roomType: preset.roomType,
            width: preset.width,
            length: preset.length,
            features: preset.features,
            furniture: preset.furniture,
            selectedId: null,
            auditReport: null
          });
        }
      },
      triggerAIOptimize: async () => {
        set({ isOptimizing: true });
        try {
          // In a real app, call geminiLayoutService here
          // For now, simulate delay and heuristic fallback if missing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Mock successful result
          set({
            auditReport: {
              overallScore: 95,
              trafficFlowScore: 100,
              doorClearanceScore: 100,
              windowAccessScore: 90,
              pros: ['Excellent traffic flow', 'Door swing is clear'],
              warnings: [],
              rationale: 'Layout optimized based on heuristics.'
            }
          });
        } catch (error) {
          console.error("Optimization failed", error);
        } finally {
          set({ isOptimizing: false });
        }
      }
    }),
    {
      name: 'roomcraft-storage',
    }
  )
);
