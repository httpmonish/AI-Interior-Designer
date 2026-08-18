// ============================================================
// RoomMind AI — Central Zustand Store
// ============================================================
import { create } from 'zustand';
import {
  Room, FurnitureItem, LifestyleProfile, AILayout, DesignMetrics,
  RoomHealthCheck, ClearanceWarning, WalkingPath, ChatMessage,
  WhatIfResult, WhatIfScenario,
  ActiveTool, ViewMode, CameraView, DesignerMode,
  RightPanelView, LeftPanelView, AppPage, SetupStep,
  StylePreset, FurnitureTemplate, Project, Vec3
} from '../types';
import { DEMO_ROOMS, DEMO_FURNITURE, DEMO_LIFESTYLE, DEFAULT_ROOM } from '../data/demoRoom';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';
import { calculateDesignScore } from '../engine/ScoreEngine';
import { checkRoomHealth, getClearanceWarnings, generateWalkingPaths } from '../engine/CollisionEngine';
import { generateLayouts, fixHealthIssue, whatIfAddFurniture } from '../engine/LayoutEngine';

interface RoomMindState {
  // --- App ---
  currentPage: AppPage;
  setPage: (page: AppPage) => void;

  // --- Project ---
  projectName: string;
  setProjectName: (name: string) => void;
  isDemo: boolean;

  // --- Rooms ---
  rooms: Room[];
  activeRoomId: string;
  setActiveRoom: (id: string) => void;
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  removeRoom: (id: string) => void;

  // --- Furniture ---
  furniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  selectFurniture: (id: string | null) => void;
  addFurniture: (template: FurnitureTemplate) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  duplicateFurniture: (id: string) => void;
  rotateFurniture90: (id: string) => void;
  setFurniturePositions: (positions: FurnitureItem[]) => void;

  // --- UI ---
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  cameraView: CameraView;
  setCameraView: (view: CameraView) => void;
  designerMode: DesignerMode;
  setDesignerMode: (mode: DesignerMode) => void;
  rightPanel: RightPanelView;
  setRightPanel: (panel: RightPanelView) => void;
  leftPanel: LeftPanelView;
  setLeftPanel: (panel: LeftPanelView) => void;
  setupStep: SetupStep;
  setSetupStep: (step: SetupStep) => void;
  showWalkingPaths: boolean;
  toggleWalkingPaths: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // --- Lifestyle ---
  lifestyle: LifestyleProfile;
  updateLifestyle: (updates: Partial<LifestyleProfile>) => void;
  selectedStyle: StylePreset;
  setSelectedStyle: (style: StylePreset) => void;

  // --- AI ---
  aiLayouts: AILayout[];
  appliedLayoutId: string | null;
  isOptimizing: boolean;
  optimizationStep: number;
  beforeScore: DesignMetrics | null;
  afterScore: DesignMetrics | null;
  runOptimization: () => void;
  applyLayout: (layoutId: string) => void;

  // --- AI Chat ---
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  processChatCommand: (text: string) => void;

  // --- What-If ---
  whatIfResult: WhatIfResult | null;
  runWhatIf: (scenario: WhatIfScenario) => void;
  applyWhatIf: () => void;
  clearWhatIf: () => void;

  // --- Scores & Health ---
  designScore: DesignMetrics;
  roomHealth: RoomHealthCheck[];
  clearanceWarnings: ClearanceWarning[];
  walkingPaths: WalkingPath[];
  recalculateAll: () => void;
  fixHealthIssue: (furnitureId: string) => void;

  // --- Undo/Redo ---
  undoStack: FurnitureItem[][];
  redoStack: FurnitureItem[][];
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  // --- Projects ---
  savedProjects: Project[];
  loadSavedProjects: () => void;
  saveProject: () => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;

  // --- Init ---
  loadDemoRoom: () => void;
  createNewProject: () => void;
}

const initialScore: DesignMetrics = {
  spaceEfficiency: 0, walkability: 0, functionality: 0,
  naturalLight: 0, balance: 0, overall: 0,
};

const initialLifestyle: LifestyleProfile = {
  activities: [], priorities: [], style: 'modern', additionalNotes: '',
};

export const useRoomStore = create<RoomMindState>((set, get) => ({
  // --- App ---
  currentPage: 'landing',
  setPage: (page) => set({ currentPage: page }),

  // --- Project ---
  projectName: 'Untitled Project',
  setProjectName: (name) => set({ projectName: name }),
  isDemo: false,

  // --- Rooms ---
  rooms: [],
  activeRoomId: '',
  setActiveRoom: (id) => set({ activeRoomId: id }),
  addRoom: (room) => set(s => ({ rooms: [...s.rooms, room] })),
  updateRoom: (id, updates) => set(s => ({
    rooms: s.rooms.map(r => r.id === id ? { ...r, ...updates } : r),
  })),
  removeRoom: (id) => set(s => ({
    rooms: s.rooms.filter(r => r.id !== id),
    furniture: s.furniture.filter(f => f.roomId !== id),
  })),

  // --- Furniture ---
  furniture: [],
  selectedFurnitureId: null,
  selectFurniture: (id) => set({
    selectedFurnitureId: id,
    rightPanel: id ? 'furniture-inspector' : 'ai-assistant',
  }),
  addFurniture: (template) => {
    const state = get();
    const room = state.rooms.find(r => r.id === state.activeRoomId) || state.rooms[0];
    if (!room) return;

    state.pushUndo();
    const newItem: FurnitureItem = {
      id: `furn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      templateId: template.id,
      name: template.name,
      category: template.category,
      dimensions: { ...template.dimensions },
      position: {
        x: room.position.x + room.dimensions.width / 2 - template.dimensions.width / 2,
        y: 0,
        z: room.position.z + room.dimensions.length / 2 - template.dimensions.depth / 2,
      },
      rotation: { x: 0, y: 0, z: 0 },
      color: template.color,
      material: {
        id: `mat-${Date.now()}`,
        name: 'Default',
        category: 'furniture',
        color: template.color,
        roughness: 0.7,
        metalness: 0,
      },
      roomId: room.id,
      locked: false,
    };

    set(s => ({ furniture: [...s.furniture, newItem], selectedFurnitureId: newItem.id }));
    get().recalculateAll();
  },
  updateFurniture: (id, updates) => {
    set(s => ({
      furniture: s.furniture.map(f => f.id === id ? { ...f, ...updates } : f),
    }));
    get().recalculateAll();
  },
  removeFurniture: (id) => {
    const state = get();
    state.pushUndo();
    set(s => ({
      furniture: s.furniture.filter(f => f.id !== id),
      selectedFurnitureId: s.selectedFurnitureId === id ? null : s.selectedFurnitureId,
    }));
    get().recalculateAll();
  },
  duplicateFurniture: (id) => {
    const state = get();
    const source = state.furniture.find(f => f.id === id);
    if (!source) return;

    state.pushUndo();
    const dup: FurnitureItem = {
      ...JSON.parse(JSON.stringify(source)),
      id: `furn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      position: { x: source.position.x + 30, y: source.position.y, z: source.position.z + 30 },
    };

    set(s => ({ furniture: [...s.furniture, dup], selectedFurnitureId: dup.id }));
    get().recalculateAll();
  },
  rotateFurniture90: (id) => {
    set(s => ({
      furniture: s.furniture.map(f => f.id === id
        ? { ...f, rotation: { ...f.rotation, y: (f.rotation.y + 90) % 360 } }
        : f),
    }));
    get().recalculateAll();
  },
  setFurniturePositions: (positions) => {
    set({ furniture: positions });
    get().recalculateAll();
  },

  // --- UI ---
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  viewMode: '3d',
  setViewMode: (mode) => set({ viewMode: mode }),
  cameraView: 'isometric',
  setCameraView: (view) => set({ cameraView: view }),
  designerMode: 'manual',
  setDesignerMode: (mode) => set({
    designerMode: mode,
    rightPanel: mode === 'ai' ? 'ai-assistant' : 'furniture-inspector',
  }),
  rightPanel: 'ai-assistant',
  setRightPanel: (panel) => set({ rightPanel: panel }),
  leftPanel: 'furniture',
  setLeftPanel: (panel) => set({ leftPanel: panel }),
  setupStep: 'space',
  setSetupStep: (step) => set({ setupStep: step }),
  showWalkingPaths: false,
  toggleWalkingPaths: () => set(s => ({ showWalkingPaths: !s.showWalkingPaths })),
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  toggleLeftSidebar: () => set(s => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set(s => ({ rightSidebarOpen: !s.rightSidebarOpen })),

  // --- Lifestyle ---
  lifestyle: { ...initialLifestyle },
  updateLifestyle: (updates) => set(s => ({
    lifestyle: { ...s.lifestyle, ...updates },
  })),
  selectedStyle: 'modern',
  setSelectedStyle: (style) => set({ selectedStyle: style }),

  // --- AI ---
  aiLayouts: [],
  appliedLayoutId: null,
  isOptimizing: false,
  optimizationStep: 0,
  beforeScore: null,
  afterScore: null,

  runOptimization: () => {
    const state = get();
    state.pushUndo();

    const beforeScore = calculateDesignScore(state.rooms, state.furniture, state.lifestyle);
    set({ isOptimizing: true, optimizationStep: 0, beforeScore });

    // Simulate stepped analysis
    const steps = 8;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      set({ optimizationStep: step });

      if (step >= steps) {
        clearInterval(interval);

        // Generate layouts
        const layouts = generateLayouts(state.rooms, state.furniture, state.lifestyle);
        const bestLayout = layouts[0]; // Smart Balance

        set({
          aiLayouts: layouts,
          isOptimizing: false,
          afterScore: bestLayout.metrics,
          appliedLayoutId: bestLayout.id,
          furniture: bestLayout.furniture,
        });

        get().recalculateAll();
      }
    }, 400);
  },

  applyLayout: (layoutId) => {
    const state = get();
    const layout = state.aiLayouts.find(l => l.id === layoutId);
    if (!layout) return;

    state.pushUndo();
    set({
      furniture: layout.furniture,
      appliedLayoutId: layoutId,
      afterScore: layout.metrics,
    });
    get().recalculateAll();
  },

  // --- AI Chat ---
  chatMessages: [],
  addChatMessage: (msg) => set(s => ({
    chatMessages: [...s.chatMessages, msg],
  })),

  processChatCommand: (text) => {
    const state = get();
    const lower = text.toLowerCase();

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    set(s => ({ chatMessages: [...s.chatMessages, userMsg] }));

    // Process command
    let response = '';
    let shouldOptimize = false;

    if (lower.includes('more space') || lower.includes('spacious') || lower.includes('open')) {
      response = 'I can create more open space by moving furniture against the walls and optimizing clearance paths. Would you like me to apply the Open Space layout?';
    } else if (lower.includes('desk') && (lower.includes('window') || lower.includes('light'))) {
      response = 'I\'ll move your desk closer to the nearest window for better natural light. This aligns with your preference for natural light.';
      shouldOptimize = true;
    } else if (lower.includes('gaming')) {
      response = 'I can optimize your room for gaming by positioning the TV and seating for an ideal viewing distance, and ensuring your desk has proper clearance for a gaming setup.';
      shouldOptimize = true;
    } else if (lower.includes('storage')) {
      response = 'I recommend adding storage along the longest available wall. This preserves floor space while maximizing storage capacity.';
    } else if (lower.includes('sofa') && (lower.includes('move') || lower.includes('away'))) {
      response = 'I\'ll reposition the sofa to improve circulation near the entrance. The recommended clearance from doorways is at least 90 cm.';
      shouldOptimize = true;
    } else if (lower.includes('optimize') || lower.includes('improve') || lower.includes('better')) {
      response = 'Running a full optimization of your room layout. I\'ll consider your lifestyle preferences and prioritize walkability and functionality.';
      shouldOptimize = true;
    } else {
      response = `I understand you want to "${text}". Let me analyze your current layout and suggest the best changes. Would you like me to run a full optimization?`;
    }

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        actions: shouldOptimize ? [{
          label: 'Apply Changes',
          type: 'apply-changes',
        }] : undefined,
      };

      set(s => ({ chatMessages: [...s.chatMessages, aiMsg] }));

      if (shouldOptimize) {
        setTimeout(() => get().runOptimization(), 500);
      }
    }, 1000);
  },

  // --- What-If ---
  whatIfResult: null,
  runWhatIf: (scenario) => {
    const state = get();
    const currentMetrics = calculateDesignScore(state.rooms, state.furniture, state.lifestyle);

    let predictedFurniture = [...state.furniture];
    let recommendation = '';

    if (scenario.id === 'add-desk') {
      const template = FURNITURE_CATALOG.find(t => t.id === 'study-desk')!;
      const result = whatIfAddFurniture(
        template.id, template.name, template.dimensions,
        state.activeRoomId || state.rooms[0]?.id || '',
        state.rooms, state.furniture, state.lifestyle
      );
      predictedFurniture = result.newFurniture;
      recommendation = 'I recommend placing the desk near the window for natural light. The armchair may need to shift to maintain walkability.';
    } else if (scenario.id === 'add-wardrobe') {
      const template = FURNITURE_CATALOG.find(t => t.id === 'wardrobe')!;
      const result = whatIfAddFurniture(
        template.id, template.name, template.dimensions,
        state.activeRoomId || state.rooms[0]?.id || '',
        state.rooms, state.furniture, state.lifestyle
      );
      predictedFurniture = result.newFurniture;
      recommendation = 'A wardrobe works best against the longest wall. I suggest moving adjacent furniture to maintain clearance.';
    } else if (scenario.id === 'more-space') {
      const layouts = generateLayouts(state.rooms, state.furniture, state.lifestyle);
      const openLayout = layouts.find(l => l.variant === 'open-space');
      if (openLayout) predictedFurniture = openLayout.furniture;
      recommendation = 'Moving furniture to walls and eliminating center-of-room pieces will maximize open space.';
    } else if (scenario.id === 'gaming' || scenario.id === 'studying') {
      const layouts = generateLayouts(state.rooms, state.furniture, {
        ...state.lifestyle,
        activities: [scenario.id === 'gaming' ? 'gaming' : 'studying'],
      });
      if (layouts[2]) predictedFurniture = layouts[2].furniture;
      recommendation = `Optimizing for ${scenario.id} by adjusting furniture relationships and positioning.`;
    } else if (scenario.id === 'natural-light') {
      const layouts = generateLayouts(state.rooms, state.furniture, {
        ...state.lifestyle,
        priorities: ['natural-light'],
      });
      if (layouts[0]) predictedFurniture = layouts[0].furniture;
      recommendation = 'Moving tall furniture away from windows and positioning your workspace near natural light sources.';
    }

    const predictedMetrics = calculateDesignScore(state.rooms, predictedFurniture, state.lifestyle);

    set({
      whatIfResult: {
        scenario,
        currentMetrics,
        predictedMetrics,
        recommendation,
        changes: [],
      },
    });

    // Store the predicted furniture for potential application
    (window as any).__whatIfFurniture = predictedFurniture;
  },

  applyWhatIf: () => {
    const state = get();
    state.pushUndo();
    const predictedFurniture = (window as any).__whatIfFurniture;
    if (predictedFurniture) {
      set({ furniture: predictedFurniture, whatIfResult: null });
      get().recalculateAll();
    }
  },

  clearWhatIf: () => set({ whatIfResult: null }),

  // --- Scores & Health ---
  designScore: { ...initialScore },
  roomHealth: [],
  clearanceWarnings: [],
  walkingPaths: [],

  recalculateAll: () => {
    const state = get();
    const score = calculateDesignScore(state.rooms, state.furniture, state.lifestyle);
    const health = checkRoomHealth(state.rooms, state.furniture);
    const warnings = getClearanceWarnings(state.furniture);

    let paths: WalkingPath[] = [];
    if (state.showWalkingPaths) {
      for (const room of state.rooms) {
        const roomFurniture = state.furniture.filter(f => f.roomId === room.id);
        paths = [...paths, ...generateWalkingPaths(room, roomFurniture)];
      }
    }

    set({ designScore: score, roomHealth: health, clearanceWarnings: warnings, walkingPaths: paths });
  },

  fixHealthIssue: (furnitureId) => {
    const state = get();
    state.pushUndo();
    const fixed = fixHealthIssue(furnitureId, state.rooms, state.furniture);
    set({ furniture: fixed });
    get().recalculateAll();
  },

  // --- Undo/Redo ---
  undoStack: [],
  redoStack: [],
  pushUndo: () => set(s => ({
    undoStack: [...s.undoStack.slice(-20), JSON.parse(JSON.stringify(s.furniture))],
    redoStack: [],
  })),
  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const prev = state.undoStack[state.undoStack.length - 1];
    set(s => ({
      redoStack: [...s.redoStack, JSON.parse(JSON.stringify(s.furniture))],
      undoStack: s.undoStack.slice(0, -1),
      furniture: prev,
    }));
    get().recalculateAll();
  },
  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[state.redoStack.length - 1];
    set(s => ({
      undoStack: [...s.undoStack, JSON.parse(JSON.stringify(s.furniture))],
      redoStack: s.redoStack.slice(0, -1),
      furniture: next,
    }));
    get().recalculateAll();
  },

  // --- Projects ---
  savedProjects: [],
  loadSavedProjects: () => {
    try {
      const raw = localStorage.getItem('roommind-projects');
      if (raw) set({ savedProjects: JSON.parse(raw) });
    } catch { /* ignore */ }
  },
  saveProject: () => {
    const state = get();
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: state.projectName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rooms: state.rooms,
      furniture: state.furniture,
      lifestyle: state.lifestyle,
      style: state.selectedStyle,
      isDemo: state.isDemo,
    };

    const existing = state.savedProjects.filter(p => p.name !== project.name);
    const updated = [...existing, project];
    set({ savedProjects: updated });
    try {
      localStorage.setItem('roommind-projects', JSON.stringify(updated));
    } catch { /* ignore */ }
  },
  loadProject: (id) => {
    const state = get();
    const project = state.savedProjects.find(p => p.id === id);
    if (!project) return;

    set({
      projectName: project.name,
      rooms: project.rooms,
      furniture: project.furniture,
      lifestyle: project.lifestyle,
      selectedStyle: project.style,
      isDemo: project.isDemo,
      activeRoomId: project.rooms[0]?.id || '',
      currentPage: 'designer',
    });
    get().recalculateAll();
  },
  deleteProject: (id) => {
    set(s => {
      const updated = s.savedProjects.filter(p => p.id !== id);
      try { localStorage.setItem('roommind-projects', JSON.stringify(updated)); } catch { /* ignore */ }
      return { savedProjects: updated };
    });
  },
  duplicateProject: (id) => {
    const state = get();
    const project = state.savedProjects.find(p => p.id === id);
    if (!project) return;

    const dup: Project = {
      ...JSON.parse(JSON.stringify(project)),
      id: `proj-${Date.now()}`,
      name: `${project.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...state.savedProjects, dup];
    set({ savedProjects: updated });
    try { localStorage.setItem('roommind-projects', JSON.stringify(updated)); } catch { /* ignore */ }
  },

  // --- Init ---
  loadDemoRoom: () => {
    set({
      projectName: 'Modern Apartment Demo',
      rooms: JSON.parse(JSON.stringify(DEMO_ROOMS)),
      furniture: JSON.parse(JSON.stringify(DEMO_FURNITURE)),
      lifestyle: { ...DEMO_LIFESTYLE },
      selectedStyle: 'modern',
      activeRoomId: 'room-living',
      isDemo: true,
      currentPage: 'designer',
      selectedFurnitureId: null,
      aiLayouts: [],
      appliedLayoutId: null,
      chatMessages: [],
      whatIfResult: null,
      undoStack: [],
      redoStack: [],
    });
    setTimeout(() => get().recalculateAll(), 100);
  },

  createNewProject: () => {
    const room = JSON.parse(JSON.stringify(DEFAULT_ROOM));
    set({
      projectName: 'Untitled Project',
      rooms: [room],
      furniture: [],
      lifestyle: { ...initialLifestyle },
      selectedStyle: 'modern',
      activeRoomId: room.id,
      isDemo: false,
      currentPage: 'setup',
      leftPanel: 'room-setup',
      setupStep: 'space',
      selectedFurnitureId: null,
      aiLayouts: [],
      appliedLayoutId: null,
      chatMessages: [],
      whatIfResult: null,
      undoStack: [],
      redoStack: [],
    });
    setTimeout(() => get().recalculateAll(), 100);
  },
}));
