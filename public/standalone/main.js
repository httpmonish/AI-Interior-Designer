/**
 * RoomAI — Main Integration Module
 * Wires together Canvas, Layout Engine, NLP Space Analyzer, and UI.
 */
(function () {
  'use strict';

  // ========================
  // Furniture Catalog
  // ========================
  const FURNITURE_CATALOG = {
    'king-bed':      { id: 'king-bed',      name: 'King Bed',      width: 6.5, height: 6.5, icon: '🛏️', isTall: false, category: 'bed' },
    'queen-bed':     { id: 'queen-bed',     name: 'Queen Bed',     width: 5,   height: 6.5, icon: '🛏️', isTall: false, category: 'bed' },
    'single-bed':    { id: 'single-bed',    name: 'Single Bed',    width: 3.5, height: 6.5, icon: '🛏️', isTall: false, category: 'bed' },
    'desk':          { id: 'desk',          name: 'Desk',          width: 4,   height: 2,   icon: '🪑', isTall: false, category: 'table' },
    'office-chair':  { id: 'office-chair',  name: 'Office Chair',  width: 2,   height: 2,   icon: '🪑', isTall: false, category: 'seating' },
    'sofa':          { id: 'sofa',          name: 'Sofa',          width: 7,   height: 3,   icon: '🛋️', isTall: false, category: 'seating' },
    'loveseat':      { id: 'loveseat',      name: 'Loveseat',      width: 5,   height: 3,   icon: '🛋️', isTall: false, category: 'seating' },
    'armchair':      { id: 'armchair',      name: 'Armchair',      width: 3,   height: 3,   icon: '🛋️', isTall: false, category: 'seating' },
    'tv-stand':      { id: 'tv-stand',      name: 'TV Stand',      width: 4,   height: 1.5, icon: '📺', isTall: false, category: 'table' },
    'bookshelf':     { id: 'bookshelf',     name: 'Bookshelf',     width: 4,   height: 1,   icon: '🗄️', isTall: true,  category: 'storage' },
    'wardrobe':      { id: 'wardrobe',      name: 'Wardrobe',      width: 5,   height: 2,   icon: '🗄️', isTall: true,  category: 'storage' },
    'dresser':       { id: 'dresser',       name: 'Dresser',       width: 4,   height: 1.5, icon: '🗄️', isTall: false, category: 'storage' },
    'dining-table':  { id: 'dining-table',  name: 'Dining Table',  width: 5,   height: 3.5, icon: '🍽️', isTall: false, category: 'table' },
    'dining-chair':  { id: 'dining-chair',  name: 'Dining Chair',  width: 1.5, height: 1.5, icon: '🪑', isTall: false, category: 'seating' },
    'plant':         { id: 'plant',         name: 'Plant',         width: 1.5, height: 1.5, icon: '🌱', isTall: true,  category: 'decor' },
    'floor-lamp':    { id: 'floor-lamp',    name: 'Floor Lamp',    width: 1,   height: 1,   icon: '💡', isTall: true,  category: 'decor' },
    'nightstand':    { id: 'nightstand',    name: 'Nightstand',    width: 1.5, height: 1.5, icon: '🛏️', isTall: false, category: 'table' },
    'coffee-table':  { id: 'coffee-table',  name: 'Coffee Table',  width: 4,   height: 2,   icon: '🧺', isTall: false, category: 'table' }
  };

  const HTML_TO_CATALOG = {
    'furn-bed-king': 'king-bed',
    'furn-bed-queen': 'queen-bed',
    'furn-bed-single': 'single-bed',
    'furn-desk': 'desk',
    'furn-office-chair': 'office-chair',
    'furn-sofa': 'sofa',
    'furn-loveseat': 'loveseat',
    'furn-armchair': 'armchair',
    'furn-tv-stand': 'tv-stand',
    'furn-bookshelf': 'bookshelf',
    'furn-wardrobe': 'wardrobe',
    'furn-dresser': 'dresser',
    'furn-dining-table': 'dining-table',
    'furn-dining-chair': 'dining-chair',
    'furn-plant': 'plant',
    'furn-floor-lamp': 'floor-lamp',
    'furn-nightstand': 'nightstand',
    'furn-coffee-table': 'coffee-table'
  };

  // ========================
  // Global State
  // ========================
  let canvas = null;
  let engine = null;

  const state = {
    room: { width: 16, height: 12, type: 'bedroom', doors: [], windows: [] },
    selectedFurniture: new Set(),
    userPreferences: {}, // catalogId -> { preferredWall: 'north' }
    currentLayout: null,
    naiveLayout: null,
    showingOptimized: true,
    isGenerating: false
  };

  // ========================
  // Application Bootstrap
  // ========================
  document.addEventListener('DOMContentLoaded', () => {
    try { initApp(); } catch (e) { console.warn('Init error:', e); }
  });

  function initApp() {
    try {
      if (window.RoomCanvas) canvas = new window.RoomCanvas('room-canvas');
      if (window.LayoutEngine) engine = new window.LayoutEngine();

      setupThemeToggle();
      setupRoomDimensions();
      setupDoorButtons();
      setupWindowButtons();
      setupFurnitureSelection();
      setupGenerateButton();
      setupBeforeAfterToggle();
      setupCanvasToolbar();
      setupNLP();

      // Live placement callback when user drags furniture inside canvas
      if (canvas) {
        canvas.onPlacementMoved((id, newX, newY) => {
          try {
            if (!state.currentLayout || !engine) return;
            state.currentLayout.placements = state.currentLayout.placements.map(p =>
              p.id === id ? { ...p, x: newX, y: newY } : p
            );
            const newScore = engine.calculateScore(state.room, state.currentLayout.placements);
            state.currentLayout.score = newScore;
            updateScoreDisplay(newScore.total, newScore.breakdown);
          } catch (e) { console.warn(e); }
        });
      }

      // Initial state sync from DOM inputs
      updateRoomFromInputs();
    } catch (e) {
      console.warn('initApp error:', e);
    }
  }

  // ========================
  // Room Configuration
  // ========================
  function setupRoomDimensions() {
    try {
      const els = {
        length: document.getElementById('room-length'),
        width: document.getElementById('room-width'),
        type: document.getElementById('room-type')
      };

      const update = () => {
        try {
          if (els.length) {
            let v = parseFloat(els.length.value) || 12;
            state.room.height = Math.max(6, Math.min(30, v));
          }
          if (els.width) {
            let v = parseFloat(els.width.value) || 16;
            state.room.width = Math.max(6, Math.min(30, v));
          }
          if (els.type) state.room.type = els.type.value;
          updateCanvasRoom();
        } catch (e) { console.warn(e); }
      };

      ['change', 'input'].forEach(evt => {
        if (els.length) els.length.addEventListener(evt, update);
        if (els.width) els.width.addEventListener(evt, update);
      });
      if (els.type) els.type.addEventListener('change', update);
    } catch (e) { console.warn(e); }
  }

  function updateCanvasRoom() {
    try {
      if (canvas) canvas.setRoom(state.room);
      const label = document.getElementById('canvas-dims-label');
      if (label) label.textContent = `${state.room.width}' × ${state.room.height}'`;
    } catch (e) { console.warn(e); }
  }

  // ========================
  // Doors & Windows
  // ========================
  function setupDoorButtons() {
    try {
      const btn = document.getElementById('add-door-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          try {
            const container = document.getElementById('doors-container');
            if (container && container.querySelectorAll('.entry-row, .door-entry').length >= 4) {
              showToast('Maximum 4 doors allowed', 'info');
              return;
            }
            addDoorEntry('north', 5, 3);
            updateRoomFromInputs();
          } catch (e) { console.warn(e); }
        });
      }
      wireExistingDoorEntries();
    } catch (e) { console.warn(e); }
  }

  function wireExistingDoorEntries() {
    try {
      const container = document.getElementById('doors-container');
      if (!container) return;
      container.querySelectorAll('.door-entry').forEach(entry => {
        entry.querySelectorAll('input, select').forEach(inp => {
          inp.addEventListener('change', updateRoomFromInputs);
        });
      });
    } catch (e) { console.warn(e); }
  }

  function addDoorEntry(wall, pos, width) {
    try {
      const container = document.getElementById('doors-container');
      if (!container) return;

      const div = document.createElement('div');
      div.className = 'entry-row';
      div.innerHTML = `
        <div class="form-group"><select class="door-wall">
          <option value="north" ${wall==='north'?'selected':''}>north</option>
          <option value="south" ${wall==='south'?'selected':''}>south</option>
          <option value="east" ${wall==='east'?'selected':''}>east</option>
          <option value="west" ${wall==='west'?'selected':''}>west</option>
        </select></div>
        <div class="form-group"><input type="number" class="door-position" value="${pos}" min="0" step="0.5" placeholder="Pos"></div>
        <div class="form-group"><input type="number" class="door-width" value="${width}" min="2" max="5" step="0.5" placeholder="Width"></div>
        <button type="button" class="btn-remove" title="Remove">×</button>
      `;

      div.querySelector('.btn-remove').addEventListener('click', () => {
        try { div.remove(); updateRoomFromInputs(); } catch (e) {}
      });
      div.querySelectorAll('input, select').forEach(inp =>
        inp.addEventListener('change', updateRoomFromInputs)
      );
      container.appendChild(div);
    } catch (e) { console.warn(e); }
  }

  function setupWindowButtons() {
    try {
      const btn = document.getElementById('add-window-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          try {
            const container = document.getElementById('windows-container');
            if (container && container.querySelectorAll('.entry-row, .window-entry').length >= 4) {
              showToast('Maximum 4 windows allowed', 'info');
              return;
            }
            addWindowEntry('north', 5, 4);
            updateRoomFromInputs();
          } catch (e) { console.warn(e); }
        });
      }
      wireExistingWindowEntries();
    } catch (e) { console.warn(e); }
  }

  function wireExistingWindowEntries() {
    try {
      const container = document.getElementById('windows-container');
      if (!container) return;
      container.querySelectorAll('.window-entry').forEach(entry => {
        entry.querySelectorAll('input, select').forEach(inp => {
          inp.addEventListener('change', updateRoomFromInputs);
        });
      });
    } catch (e) { console.warn(e); }
  }

  function addWindowEntry(wall, pos, width) {
    try {
      const container = document.getElementById('windows-container');
      if (!container) return;

      const div = document.createElement('div');
      div.className = 'entry-row';
      div.innerHTML = `
        <div class="form-group"><select class="window-wall">
          <option value="north" ${wall==='north'?'selected':''}>north</option>
          <option value="south" ${wall==='south'?'selected':''}>south</option>
          <option value="east" ${wall==='east'?'selected':''}>east</option>
          <option value="west" ${wall==='west'?'selected':''}>west</option>
        </select></div>
        <div class="form-group"><input type="number" class="window-position" value="${pos}" min="0" step="0.5" placeholder="Pos"></div>
        <div class="form-group"><input type="number" class="window-width" value="${width}" min="1" max="8" step="0.5" placeholder="Width"></div>
        <button type="button" class="btn-remove" title="Remove">×</button>
      `;

      div.querySelector('.btn-remove').addEventListener('click', () => {
        try { div.remove(); updateRoomFromInputs(); } catch (e) {}
      });
      div.querySelectorAll('input, select').forEach(inp =>
        inp.addEventListener('change', updateRoomFromInputs)
      );
      container.appendChild(div);
    } catch (e) { console.warn(e); }
  }

  function collectDoorsFromDOM() {
    try {
      const container = document.getElementById('doors-container');
      if (!container) return [];
      const doors = [];
      container.querySelectorAll('.entry-row, .door-entry').forEach(row => {
        const wallEl = row.querySelector('.door-wall, .wall-select');
        const posEl = row.querySelector('.door-position, .pos-input');
        const wEl = row.querySelector('.door-width, .width-input');
        doors.push({
          wall: wallEl ? wallEl.value : 'south',
          position: posEl ? (parseFloat(posEl.value) || 5) : 5,
          width: wEl ? (parseFloat(wEl.value) || 3) : 3
        });
      });
      return doors;
    } catch (e) { return []; }
  }

  function collectWindowsFromDOM() {
    try {
      const container = document.getElementById('windows-container');
      if (!container) return [];
      const windows = [];
      container.querySelectorAll('.entry-row, .window-entry').forEach(row => {
        const wallEl = row.querySelector('.window-wall, .wall-select');
        const posEl = row.querySelector('.window-position, .pos-input');
        const wEl = row.querySelector('.window-width, .width-input');
        windows.push({
          wall: wallEl ? wallEl.value : 'east',
          position: posEl ? (parseFloat(posEl.value) || 5) : 5,
          width: wEl ? (parseFloat(wEl.value) || 4) : 4
        });
      });
      return windows;
    } catch (e) { return []; }
  }

  function updateRoomFromInputs() {
    try {
      const lengthEl = document.getElementById('room-length');
      const widthEl = document.getElementById('room-width');
      const typeEl = document.getElementById('room-type');

      if (lengthEl) state.room.height = Math.max(6, Math.min(30, parseFloat(lengthEl.value) || 12));
      if (widthEl) state.room.width = Math.max(6, Math.min(30, parseFloat(widthEl.value) || 16));
      if (typeEl) state.room.type = typeEl.value;

      state.room.doors = collectDoorsFromDOM();
      state.room.windows = collectWindowsFromDOM();
      updateCanvasRoom();
    } catch (e) { console.warn(e); }
  }

  // ========================
  // Furniture Selection & Drag-and-Drop
  // ========================

  function placeFurnitureInRoom(catalogId, roomX, roomY) {
    try {
      const item = FURNITURE_CATALOG[catalogId];
      if (!item || !canvas || !state.room) return;

      const x = Math.max(0, Math.min(roomX, state.room.width - item.width));
      const y = Math.max(0, Math.min(roomY, state.room.height - item.height));

      const placement = {
        ...item,
        x: Math.round(x * 2) / 2,
        y: Math.round(y * 2) / 2,
        reasoning: 'Placed manually'
      };

      canvas.addPlacement(placement);
      state.selectedFurniture.add(catalogId);
      syncCardSelectionUI(catalogId, true);

      // Recalculate score live
      if (engine) {
        const placements = canvas.getAllPlacements();
        const score = engine.calculateScore(state.room, placements);
        updateScoreDisplay(score.total, score.breakdown);
        showSection('score-section');
      }
    } catch(e) { console.warn('placeFurnitureInRoom error:', e); }
  }

  function removeFurnitureFromRoom(catalogId) {
    try {
      state.selectedFurniture.delete(catalogId);
      if (canvas) canvas.removePlacement(catalogId);
      syncCardSelectionUI(catalogId, false);

      if (engine && canvas) {
        const placements = canvas.getAllPlacements();
        const score = engine.calculateScore(state.room, placements);
        updateScoreDisplay(score.total, score.breakdown);
      }
    } catch(e) { console.warn(e); }
  }

  function syncCardSelectionUI(catalogId, isSelected) {
    try {
      const htmlId = Object.keys(HTML_TO_CATALOG).find(k => HTML_TO_CATALOG[k] === catalogId);
      if (htmlId) {
        const card = document.querySelector(`.furniture-card[data-id="${htmlId}"]`);
        if (card) {
          card.classList.toggle('selected', isSelected);
          const cb = card.querySelector('.furniture-checkbox');
          if (cb) cb.checked = isSelected;
        }
      }
    } catch (e) {}
  }

  function setupFurnitureSelection() {
    try {
      const cards = document.querySelectorAll('.furniture-card');
      let dragActive = false;

      cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        card.style.cursor = 'grab';

        // Drag start from sidebar
        card.addEventListener('dragstart', (e) => {
          try {
            dragActive = true;
            const htmlId = card.dataset.id;
            const catalogId = HTML_TO_CATALOG[htmlId];
            if (!catalogId) return;

            e.dataTransfer.setData('text/plain', catalogId);
            e.dataTransfer.effectAllowed = 'copy';
            card.classList.add('dragging');
          } catch(err) { console.warn(err); }
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          setTimeout(() => { dragActive = false; }, 80);
        });

        // Click to toggle
        card.addEventListener('click', (e) => {
          try {
            if (dragActive) return;
            e.preventDefault();
            e.stopPropagation();

            const htmlId = card.dataset.id;
            const catalogId = HTML_TO_CATALOG[htmlId];
            if (!catalogId) return;

            if (state.selectedFurniture.has(catalogId)) {
              removeFurnitureFromRoom(catalogId);
            } else {
              if (state.selectedFurniture.size >= 12) {
                showToast('Maximum 12 furniture items', 'info');
                return;
              }
              const item = FURNITURE_CATALOG[catalogId];
              const cx = (state.room.width - item.width) / 2;
              const cy = (state.room.height - item.height) / 2;
              placeFurnitureInRoom(catalogId, cx, cy);
              showToast(`${item.name} added — drag on canvas to position`, 'success');
            }
          } catch (err) { console.warn(err); }
        });
      });

      // Canvas drop handling
      const canvasContainer = document.querySelector('.canvas-container');
      const canvasEl = document.getElementById('room-canvas');

      function setupDropTarget(el) {
        if (!el) return;

        el.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          if (canvasContainer) canvasContainer.classList.add('drag-over');
        });

        el.addEventListener('dragenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (canvasContainer) canvasContainer.classList.add('drag-over');
        });

        el.addEventListener('dragleave', (e) => {
          e.stopPropagation();
          if (canvasContainer && !canvasContainer.contains(e.relatedTarget)) {
            canvasContainer.classList.remove('drag-over');
          }
        });

        el.addEventListener('drop', (e) => {
          try {
            e.preventDefault();
            e.stopPropagation();
            if (canvasContainer) canvasContainer.classList.remove('drag-over');

            const catalogId = e.dataTransfer.getData('text/plain');
            if (!catalogId || !FURNITURE_CATALOG[catalogId]) return;

            const rect = (canvasEl || canvasContainer).getBoundingClientRect();
            const cssX = e.clientX - rect.left;
            const cssY = e.clientY - rect.top;

            if (canvas) {
              const roomPt = canvas.screenToRoom(cssX, cssY);
              const item = FURNITURE_CATALOG[catalogId];
              const rx = roomPt.x - item.width / 2;
              const ry = roomPt.y - item.height / 2;
              placeFurnitureInRoom(catalogId, rx, ry);
              showToast(`🎯 ${item.name} placed in room`, 'success');
            }
          } catch(err) { console.warn('Drop error:', err); }
        });
      }

      setupDropTarget(canvasContainer);
      setupDropTarget(canvasEl);

    } catch (e) { console.warn(e); }
  }

  // ========================
  // Layout Optimization Engine Trigger
  // ========================
  function executeLayoutOptimization() {
    try {
      const validation = validateInputs();
      if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
      }

      showLoading();

      setTimeout(() => {
        try {
          const furnitureList = Array.from(state.selectedFurniture)
            .map(id => {
              const base = FURNITURE_CATALOG[id];
              if (!base) return null;
              const pref = state.userPreferences[id] || {};
              return { ...base, ...pref };
            })
            .filter(Boolean);

          const room = { ...state.room };

          // Run AI Spatial Optimizer
          const result = engine ? engine.generateLayout(room, furnitureList) : null;
          const naiveResult = engine ? engine.generateNaiveLayout(room, furnitureList) : null;

          state.currentLayout = result || { placements: [], score: { total: 0, breakdown: {} }, traces: [], naiveScore: 0 };
          state.naiveLayout = naiveResult || { placements: [], score: { total: 0, breakdown: {} }, traces: [], naiveScore: 0 };
          state.showingOptimized = true;

          // Render optimized placements onto canvas
          if (canvas && result && result.placements) {
            canvas.setPlacementsAnimated(result.placements);
          }

          // Display score breakdown & AI reasoning
          const scoreObj = (result && result.score) ? result.score : { total: 0, breakdown: {} };
          updateScoreDisplay(scoreObj.total, scoreObj.breakdown);

          if (result && result.traces && result.traces.length > 0) {
            updateReasoningTraces(result.traces);
          }

          const naiveScoreObj = (naiveResult && naiveResult.score) ? naiveResult.score : { total: 0, breakdown: {} };
          updateComparisonStats(naiveScoreObj.total, scoreObj.total, naiveScoreObj.breakdown, scoreObj.breakdown);

          showSection('score-section');
          showSection('reasoning-section');
          showSection('toggle-section');

          const toggle = document.getElementById('layout-toggle');
          if (toggle) toggle.checked = true;

          hideLoading();
          showToast(`✨ Layout generated successfully! Score: ${scoreObj.total}/100`, 'success');
        } catch (innerE) {
          console.warn('Optimization error:', innerE);
          hideLoading();
          showToast('Layout generation encountered an issue', 'error');
        }
      }, 50);
    } catch (e) {
      console.warn(e);
      hideLoading();
    }
  }

  function setupGenerateButton() {
    try {
      const btn = document.getElementById('generate-btn');
      if (btn) {
        btn.addEventListener('click', executeLayoutOptimization);
      }
    } catch (e) { console.warn(e); }
  }

  function validateInputs() {
    try {
      const errors = [];
      if (state.room.width <= 0 || state.room.height <= 0) errors.push('Room dimensions must be positive');
      if (state.selectedFurniture.size === 0) errors.push('Please select or describe at least one furniture item');
      return { valid: errors.length === 0, errors };
    } catch (e) {
      return { valid: false, errors: ['Validation error'] };
    }
  }

  // ========================
  // Before / After Toggle
  // ========================
  function setupBeforeAfterToggle() {
    try {
      const toggle = document.getElementById('layout-toggle');
      if (!toggle) return;

      toggle.addEventListener('change', (e) => {
        try {
          const isOpt = e.target.checked;
          state.showingOptimized = isOpt;
          const layout = isOpt ? state.currentLayout : state.naiveLayout;

          if (canvas && layout && layout.placements) {
            canvas.setPlacementsAnimated(layout.placements);
          }
          if (layout && layout.score) {
            updateScoreDisplay(layout.score.total, layout.score.breakdown);
          }
        } catch (e) { console.warn(e); }
      });
    } catch (e) { console.warn(e); }
  }

  // ========================
  // Canvas Toolbar Controls
  // ========================
  function setupCanvasToolbar() {
    try {
      const zoomIn = document.getElementById('zoom-in-btn');
      const zoomOut = document.getElementById('zoom-out-btn');
      const reset = document.getElementById('reset-view-btn');
      const grid = document.getElementById('grid-toggle-btn');

      let gridShowing = true;

      if (zoomIn) zoomIn.addEventListener('click', () => { if (canvas) canvas.zoomIn(); });
      if (zoomOut) zoomOut.addEventListener('click', () => { if (canvas) canvas.zoomOut(); });
      if (reset) reset.addEventListener('click', () => { if (canvas) canvas.resetView(); });
      if (grid) grid.addEventListener('click', () => {
        gridShowing = !gridShowing;
        if (canvas) canvas.setShowGrid(gridShowing);
        grid.classList.toggle('active', gridShowing);
      });
    } catch (e) { console.warn(e); }
  }

  // ========================
  // Theme Toggle
  // ========================
  function setupThemeToggle() {
    try {
      const btn = document.getElementById('theme-toggle');
      const saved = localStorage.getItem('roomai-theme') || 'dark';

      const applyTheme = (t) => {
        try {
          document.documentElement.setAttribute('data-theme', t);
          document.body.className = t === 'dark' ? 'theme-dark' : 'theme-light';
          if (canvas) canvas.setTheme(t);
          if (btn) btn.innerHTML = t === 'dark' ? '☀️' : '🌙';
        } catch(e){}
      };

      applyTheme(saved);

      if (btn) {
        btn.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme') || 'dark';
          const next = current === 'dark' ? 'light' : 'dark';
          localStorage.setItem('roomai-theme', next);
          applyTheme(next);
        });
      }
    } catch (e) { console.warn(e); }
  }

  // ========================
  // Natural Language Space Analyzer & Optimizer
  // ========================

  const NLP_FURNITURE_PATTERNS = [
    { patterns: [/king\s*(?:size[d]?)?\s*bed/i, /\bking\s*bed\b/i, /\bking\b(?!.*chair)/i], id: 'king-bed' },
    { patterns: [/queen\s*(?:size[d]?)?\s*bed/i, /\bqueen\s*bed\b/i, /\bqueen\b(?!.*chair)/i], id: 'queen-bed' },
    { patterns: [/single\s*(?:size[d]?)?\s*bed/i, /\bsingle\s*bed\b/i, /\btwin\s*bed\b/i], id: 'single-bed' },
    { patterns: [/\boffice\s*chair\b/i, /\bdesk\s*chair\b/i, /\bswivel\s*chair\b/i, /\btask\s*chair\b/i], id: 'office-chair' },
    { patterns: [/\bdining\s*table\b/i], id: 'dining-table' },
    { patterns: [/\bdining\s*chair\b/i], id: 'dining-chair' },
    { patterns: [/\bcoffee\s*table\b/i, /\bcenter\s*table\b/i], id: 'coffee-table' },
    { patterns: [/\btv\s*stand\b/i, /\btv\s*unit\b/i, /\btelevision\s*stand\b/i, /\bmedia\s*console\b/i, /\bentertainment\s*unit\b/i], id: 'tv-stand' },
    { patterns: [/\bbook\s*shelf\b/i, /\bbookcase\b/i, /\bbookshelves\b/i, /\bshelves\b/i, /\bbook\s*rack\b/i], id: 'bookshelf' },
    { patterns: [/\bwardrobe\b/i, /\bcloset\b/i, /\balmirah\b/i, /\bcupboard\b/i], id: 'wardrobe' },
    { patterns: [/\bdresser\b/i, /\bdrawer[s]?\b/i, /\bchest\s*of\s*drawers\b/i], id: 'dresser' },
    { patterns: [/\bnight\s*stand[s]?\b/i, /\bbed\s*side\s*table[s]?\b/i, /\bside\s*table[s]?\b/i, /\bnightstand[s]?\b/i], id: 'nightstand' },
    { patterns: [/\bfloor\s*lamp\b/i, /\bstanding\s*lamp\b/i, /\breading\s*lamp\b/i, /\blamp\b/i], id: 'floor-lamp' },
    { patterns: [/\bpotted\s*plant\b/i, /\bindoor\s*plant\b/i, /\bplant\b/i], id: 'plant' },
    { patterns: [/\bsofa\b/i, /\bcouch\b/i, /\b3\s*seater\b/i, /\bsectional\b/i], id: 'sofa' },
    { patterns: [/\bloveseat\b/i, /\blove\s*seat\b/i, /\b2\s*seater\b/i, /\btwo\s*seater\b/i], id: 'loveseat' },
    { patterns: [/\barmchair\b/i, /\barm\s*chair\b/i, /\baccent\s*chair\b/i, /\blounge\s*chair\b/i], id: 'armchair' },
    { patterns: [/\bworkstation\b/i, /\bstudy\s*table\b/i, /\bwriting\s*desk\b/i, /\bdesk\b/i], id: 'desk' },
  ];

  function setupNLP() {
    try {
      const btn = document.getElementById('parse-btn');
      const input = document.getElementById('nl-input');
      if (!btn || !input) return;

      const parseAndOptimize = () => {
        try {
          const text = input.value.trim();
          if (!text) {
            showToast('Please type a room description (e.g. 14x12 bedroom with queen bed and desk)', 'info');
            return;
          }

          const textLC = text.toLowerCase();
          const parsedLog = [];
          state.userPreferences = {};

          // 1. Reset dynamic entries cleanly
          const doorsContainer = document.getElementById('doors-container');
          if (doorsContainer) doorsContainer.innerHTML = '';
          const windowsContainer = document.getElementById('windows-container');
          if (windowsContainer) windowsContainer.innerHTML = '';

          // Uncheck all furniture
          state.selectedFurniture.clear();
          document.querySelectorAll('.furniture-card').forEach(card => {
            card.classList.remove('selected');
            const cb = card.querySelector('.furniture-checkbox');
            if (cb) cb.checked = false;
          });

          // 2. Parse Dimensions
          // Matches 14x12, 14 x 12, 14 by 12, 14ft x 12ft, 14 feet by 12 feet, etc.
          const dimRegex = /(\d+\.?\d*)\s*(?:feet|ft|foot|'|’)?\s*(?:x|by|×|\*)\s*(\d+\.?\d*)\s*(?:feet|ft|foot|'|’)?/i;
          const dimMatch = textLC.match(dimRegex);

          let parsedWidth = 16;
          let parsedLength = 12;

          if (dimMatch) {
            const raw1 = parseFloat(dimMatch[1]);
            const raw2 = parseFloat(dimMatch[2]);
            parsedWidth = Math.max(6, Math.min(30, Math.max(raw1, raw2))); // longer dimension as width
            parsedLength = Math.max(6, Math.min(30, Math.min(raw1, raw2))); // shorter dimension as length
          }

          const lengthEl = document.getElementById('room-length');
          const widthEl = document.getElementById('room-width');
          if (lengthEl) lengthEl.value = parsedLength;
          if (widthEl) widthEl.value = parsedWidth;
          state.room.width = parsedWidth;
          state.room.height = parsedLength;
          parsedLog.push(`${parsedWidth}' × ${parsedLength}'`);

          // 3. Parse Room Type
          const typeMap = [
            { regex: /bed\s*room/i, value: 'bedroom', label: 'Bedroom' },
            { regex: /living\s*room|lounge/i, value: 'living-room', label: 'Living Room' },
            { regex: /office|study|workplace/i, value: 'office', label: 'Office' },
            { regex: /studio|apartment/i, value: 'studio', label: 'Studio' },
            { regex: /dining/i, value: 'dining-room', label: 'Dining Room' }
          ];

          let detectedType = 'bedroom';
          for (const item of typeMap) {
            if (item.regex.test(textLC)) {
              detectedType = item.value;
              const typeEl = document.getElementById('room-type');
              if (typeEl) typeEl.value = item.value;
              parsedLog.push(item.label);
              break;
            }
          }
          state.room.type = detectedType;

          // 4. Parse Doors
          const doorPatterns = [
            /door\s*(?:on|at|in)\s*(?:the\s*)?(north|south|east|west)/gi,
            /(north|south|east|west)\s*(?:wall\s*)?door/gi
          ];
          const foundDoorWalls = new Set();

          for (const dp of doorPatterns) {
            let m;
            while ((m = dp.exec(textLC)) !== null) {
              const wall = m[1].toLowerCase();
              if (!foundDoorWalls.has(wall)) {
                foundDoorWalls.add(wall);
                const pos = wall === 'north' || wall === 'south' ? Math.round(parsedWidth * 0.3) : Math.round(parsedLength * 0.3);
                addDoorEntry(wall, pos, 3);
                parsedLog.push(`Door on ${wall.toUpperCase()}`);
              }
            }
          }

          // Default door if none specified
          if (foundDoorWalls.size === 0) {
            const defaultDoorPos = Math.round(parsedWidth * 0.3);
            addDoorEntry('south', defaultDoorPos, 3);
            parsedLog.push('Door on SOUTH');
          }

          // 5. Parse Windows
          const winPatterns = [
            /window\s*(?:on|at|in)\s*(?:the\s*)?(north|south|east|west)/gi,
            /(north|south|east|west)\s*(?:wall\s*)?window/gi
          ];
          const foundWinWalls = new Set();

          for (const wp of winPatterns) {
            let m;
            while ((m = wp.exec(textLC)) !== null) {
              const wall = m[1].toLowerCase();
              if (!foundWinWalls.has(wall)) {
                foundWinWalls.add(wall);
                const pos = wall === 'north' || wall === 'south' ? Math.round(parsedWidth * 0.4) : Math.round(parsedLength * 0.4);
                addWindowEntry(wall, pos, 4);
                parsedLog.push(`Window on ${wall.toUpperCase()}`);
              }
            }
          }

          // Default window if none specified
          if (foundWinWalls.size === 0) {
            addWindowEntry('east', Math.round(parsedLength * 0.35), 4);
            parsedLog.push('Window on EAST');
          }

          // Update doors and windows in state
          state.room.doors = collectDoorsFromDOM();
          state.room.windows = collectWindowsFromDOM();
          updateCanvasRoom();

          // 6. Parse Furniture & Quantities
          const matchedCatalogIds = new Set();
          const quantityWords = { 'two': 2, 'three': 3, 'four': 4, 'pair': 2, 'couple': 2, '2': 2, '3': 3, '4': 4 };

          for (const entry of NLP_FURNITURE_PATTERNS) {
            for (const pattern of entry.patterns) {
              if (pattern.test(textLC) && !matchedCatalogIds.has(entry.id)) {
                let qty = 1;
                for (const [w, n] of Object.entries(quantityWords)) {
                  const qReg = new RegExp(`\\b${w}\\b[^.]*?${pattern.source.replace(/\\b/g, '')}`, 'i');
                  if (qReg.test(textLC)) {
                    qty = n;
                    break;
                  }
                }

                // Check wall placement preferences in text, e.g. "bed on north wall"
                const wallPrefMatch = textLC.match(new RegExp(`${pattern.source.replace(/\\b/g, '')}[^.]*?(?:on|against|near)\\s*(?:the)?\\s*(north|south|east|west)`, 'i'));
                if (wallPrefMatch) {
                  state.userPreferences[entry.id] = { preferredWall: wallPrefMatch[1].toLowerCase() };
                }

                matchedCatalogIds.add(entry.id);
                state.selectedFurniture.add(entry.id);
                syncCardSelectionUI(entry.id, true);

                const item = FURNITURE_CATALOG[entry.id];
                parsedLog.push(qty > 1 ? `${qty}× ${item.name}` : item.name);
                break;
              }
            }
          }

          // Fallback if no furniture was mentioned in text: select appropriate defaults based on room type
          if (state.selectedFurniture.size === 0) {
            if (detectedType === 'bedroom') {
              ['queen-bed', 'desk', 'bookshelf', 'nightstand'].forEach(id => {
                state.selectedFurniture.add(id);
                syncCardSelectionUI(id, true);
              });
              parsedLog.push('Default Bedroom Suite (Queen Bed, Desk, Bookshelf, Nightstand)');
            } else if (detectedType === 'living-room') {
              ['sofa', 'coffee-table', 'tv-stand', 'plant'].forEach(id => {
                state.selectedFurniture.add(id);
                syncCardSelectionUI(id, true);
              });
              parsedLog.push('Default Living Suite (Sofa, Coffee Table, TV Stand, Plant)');
            } else if (detectedType === 'office') {
              ['desk', 'office-chair', 'bookshelf', 'armchair'].forEach(id => {
                state.selectedFurniture.add(id);
                syncCardSelectionUI(id, true);
              });
              parsedLog.push('Default Office Suite (Desk, Chair, Bookshelf, Armchair)');
            } else {
              ['queen-bed', 'sofa', 'desk'].forEach(id => {
                state.selectedFurniture.add(id);
                syncCardSelectionUI(id, true);
              });
              parsedLog.push('Default Studio Suite (Bed, Sofa, Desk)');
            }
          }

          // 7. Directly execute spatial layout optimization in one seamless step!
          showToast(`🧠 Analyzed: ${parsedLog.join(' • ')}`, 'info');
          executeLayoutOptimization();

        } catch (err) {
          console.warn('NLP error:', err);
          showToast('Failed to analyze prompt. Please try a simpler description.', 'error');
        }
      };

      btn.addEventListener('click', parseAndOptimize);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          parseAndOptimize();
        }
      });

    } catch (e) { console.warn(e); }
  }

  // ========================
  // UI Display & Animations
  // ========================
  function showToast(message, type = 'info') {
    try {
      const container = document.getElementById('toast-container');
      const target = container || document.body;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      target.appendChild(toast);

      setTimeout(() => { try { toast.remove(); } catch(e){} }, 4000);
    } catch (e) { console.warn(e); }
  }

  function showLoading() {
    try {
      const el = document.getElementById('loading-overlay');
      if (el) { el.classList.remove('hidden'); el.setAttribute('aria-hidden', 'false'); }
      state.isGenerating = true;
    } catch (e) {}
  }

  function hideLoading() {
    try {
      const el = document.getElementById('loading-overlay');
      if (el) { el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }
      state.isGenerating = false;
    } catch (e) {}
  }

  function showSection(id) {
    try {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    } catch (e) {}
  }

  function animateValue(element, start, end, duration) {
    try {
      if (!element) return;
      let startTs = null;
      const step = (ts) => {
        if (!startTs) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        element.textContent = Math.round(eased * (end - start) + start);
        if (progress < 1) requestAnimationFrame(step);
        else element.textContent = end;
      };
      requestAnimationFrame(step);
    } catch (e) {
      if (element) element.textContent = end;
    }
  }

  function updateScoreDisplay(total, breakdown) {
    try {
      const scoreEl = document.getElementById('score-value');
      if (scoreEl) {
        const current = parseInt(scoreEl.textContent) || 0;
        animateValue(scoreEl, current, Math.round(total || 0), 600);
      }

      const circle = document.querySelector('.score-circle');
      if (circle) {
        circle.style.setProperty('--score-percent', total || 0);
      }

      const bd = breakdown || {};
      const mapping = {
        'floor': { prog: 'score-prog-floor', val: 'score-val-floor', max: 20 },
        'door':  { prog: 'score-prog-door',  val: 'score-val-door',  max: 25 },
        'window':{ prog: 'score-prog-window', val: 'score-val-window', max: 15 },
        'walk':  { prog: 'score-prog-walk',  val: 'score-val-walk',  max: 25 },
        'wall':  { prog: 'score-prog-wall',  val: 'score-val-wall',  max: 15 }
      };

      const bdKeys = {
        'floor': bd.floorUtilization,
        'door': bd.doorClearance,
        'window': bd.windowAccess,
        'walk': bd.walkability,
        'wall': bd.wallAlignment
      };

      for (const [key, ids] of Object.entries(mapping)) {
        const rawVal = bdKeys[key] || 0;
        const pct = Math.round((rawVal / ids.max) * 100);

        const prog = document.getElementById(ids.prog);
        if (prog) prog.value = pct;

        const val = document.getElementById(ids.val);
        if (val) val.textContent = `${pct}%`;
      }
    } catch (e) { console.warn('Score display error:', e); }
  }

  function updateReasoningTraces(traces) {
    try {
      const container = document.getElementById('reasoning-traces');
      if (!container) return;
      container.innerHTML = '';

      (traces || []).forEach((text, i) => {
        const div = document.createElement('div');
        div.className = 'trace-item';
        div.innerHTML = `<span class="trace-icon">💡</span> ${text}`;
        div.style.animationDelay = `${i * 100}ms`;
        container.appendChild(div);
      });
    } catch (e) { console.warn(e); }
  }

  function updateComparisonStats(naiveTotal, optTotal, naiveBd = {}, optBd = {}) {
    try {
      const container = document.getElementById('comparison-stats');
      if (!container) return;

      const diff = Math.round((optTotal || 0) - (naiveTotal || 0));
      const sign = diff > 0 ? '+' : '';

      container.innerHTML = `
        <div class="stat-row">
          <span class="stat-label">Overall Layout Score</span>
          <span class="stat-before">${Math.round(naiveTotal || 0)}</span>
          <span class="stat-arrow">→</span>
          <span class="stat-after">${Math.round(optTotal || 0)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Optimization Gain</span>
          <span class="stat-after" style="color: var(--accent-success); font-weight: 700;">${sign}${diff} points</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Floor Utilization</span>
          <span class="stat-before">${Math.round(naiveBd.floorUtilization || 0)}/20</span>
          <span class="stat-arrow">→</span>
          <span class="stat-after">${Math.round(optBd.floorUtilization || 0)}/20</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Door Clearance</span>
          <span class="stat-before">${Math.round(naiveBd.doorClearance || 0)}/25</span>
          <span class="stat-arrow">→</span>
          <span class="stat-after">${Math.round(optBd.doorClearance || 0)}/25</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Walkway Flow</span>
          <span class="stat-before">${Math.round(naiveBd.walkability || 0)}/25</span>
          <span class="stat-arrow">→</span>
          <span class="stat-after">${Math.round(optBd.walkability || 0)}/25</span>
        </div>
      `;
    } catch (e) { console.warn(e); }
  }

})();
