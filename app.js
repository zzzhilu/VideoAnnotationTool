/* ═══════════════════════════════════════════
   app.js — DOM & Video Control Logic
   Multi-Video Tab System
   ═══════════════════════════════════════════ */

// ─── GLOBAL STATE ───
window.APP = {
  /** @type {HTMLVideoElement} */
  video: null,
  isPlaying: false,
  currentColor: '#FF3B3B',
  /** Stroke being drawn right now (array of {x,y} in 0..1) */
  currentStroke: [],
  /** Is the user currently dragging? */
  isDrawing: false,
  /** Tolerance for matching annotation timestamps (seconds) */
  TIME_TOLERANCE: 0.1,
  /** Frame step size in seconds */
  FRAME_STEP: 1 / 30,

  // ─── TAB SYSTEM ───
  tabs: [],
  activeTabId: null,
  _tabIdCounter: 0,
  MAX_TABS: 8,
};

// ─── Proxy APP.annotations to active tab ───
// This keeps sketch.js completely unchanged — it reads/writes APP.annotations
// which transparently maps to the active tab's annotation array.
Object.defineProperty(APP, 'annotations', {
  get() {
    const tab = APP.tabs.find(t => t.id === APP.activeTabId);
    return tab ? tab.annotations : [];
  },
  set(val) {
    const tab = APP.tabs.find(t => t.id === APP.activeTabId);
    if (tab) tab.annotations = val;
  },
  configurable: true,
});

// ─── DOM REFS ───
const $ = (sel) => document.querySelector(sel);
const landing        = $('#landing');
const workspace      = $('#workspace');
const videoInput     = $('#videoInput');
const video          = $('#video');
const tabBar         = $('#tabBar');
const btnAddVideo    = $('#btnAddVideo');
const addVideoInput  = $('#addVideoInput');
const btnPlay        = $('#btnPlay');
const iconPlay       = $('#iconPlay');
const iconPause      = $('#iconPause');
const btnPrev        = $('#btnPrevFrame');
const btnNext        = $('#btnNextFrame');
const timeline       = $('#timeline');
const timeCurrent    = $('#timeCurrent');
const timeDuration   = $('#timeDuration');
const colorPalette   = $('#colorPalette');
const btnUndo        = $('#btnUndo');
const btnClearFrame  = $('#btnClearFrame');
const btnExport      = $('#btnExport');
const btnImport      = $('#btnImport');
const importInput    = $('#importInput');
const annotCount     = $('#annotationCount');
const frameHint      = $('#frameAnnotationHint');
const drawIndicator  = $('#drawIndicator');
const canvasContainer= $('#canvasContainer');
const timelineMarkers= $('#timelineMarkers');
const stageWrapper   = $('#stageWrapper');
const dropOverlay    = $('#dropOverlay');

APP.video = video;

// ─── HELPERS ───
function formatTime(sec) {
  if (!isFinite(sec)) return '00:00.0';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`;
}

function updateTimeDisplay() {
  timeCurrent.textContent = formatTime(video.currentTime);
}

function updateTimeline() {
  if (video.duration) {
    timeline.value = (video.currentTime / video.duration) * 100;
  }
  updateTimeDisplay();
  updateFrameHint();
}

function updateFrameHint() {
  const t = video.currentTime;
  const anns = APP.annotations;
  const has = anns.some(a =>
    Math.abs(a.timestamp - t) <= APP.TIME_TOLERANCE
  );
  frameHint.classList.toggle('hidden', !has);
  annotCount.textContent = `${anns.length} annotation${anns.length !== 1 ? 's' : ''}`;
}

/** Render small tick marks on the timeline for every annotation timestamp */
function renderTimelineMarkers() {
  timelineMarkers.innerHTML = '';
  const dur = video.duration;
  if (!dur || !isFinite(dur)) return;

  const seen = new Set();
  for (const ann of APP.annotations) {
    const pct = (ann.timestamp / dur) * 100;
    const key = pct.toFixed(2);
    if (seen.has(key)) continue;
    seen.add(key);

    const tick = document.createElement('div');
    tick.className = 'tm';
    tick.style.left = `${pct}%`;
    tick.title = formatTime(ann.timestamp);
    timelineMarkers.appendChild(tick);
  }
}

function setPlayState(playing) {
  APP.isPlaying = playing;
  iconPlay.classList.toggle('hidden', playing);
  iconPause.classList.toggle('hidden', !playing);
  canvasContainer.style.pointerEvents = playing ? 'none' : 'auto';
  drawIndicator.classList.toggle('hidden', playing);
}

// ═══════════════════════════════════════════
//  TAB MANAGEMENT
// ═══════════════════════════════════════════

function getActiveTab() {
  return APP.tabs.find(t => t.id === APP.activeTabId) || null;
}

/** Save current video time to the active tab */
function saveActiveTabState() {
  const tab = getActiveTab();
  if (tab && video.currentTime) {
    tab.currentTime = video.currentTime;
  }
}

/** Revoke objectURL for a single tab to free memory */
function releaseTabMemory(tabId) {
  const tab = APP.tabs.find(t => t.id === tabId);
  if (tab && tab.objectURL) {
    URL.revokeObjectURL(tab.objectURL);
    tab.objectURL = null;
  }
}

/**
 * Sliding-window memory management.
 * Keeps objectURLs alive for the active tab and its immediate neighbors
 * (prev + next in tabs[]). All other tabs get their objectURLs revoked.
 * This balances memory usage with fast toggling between adjacent tabs.
 */
function enforceMemoryWindow() {
  const activeIdx = APP.tabs.findIndex(t => t.id === APP.activeTabId);
  if (activeIdx === -1) return;

  for (let i = 0; i < APP.tabs.length; i++) {
    const tab = APP.tabs[i];
    const distance = Math.abs(i - activeIdx);

    if (distance <= 1) {
      // Within window — ensure objectURL exists
      if (!tab.objectURL && tab.file) {
        tab.objectURL = URL.createObjectURL(tab.file);
      }
    } else {
      // Outside window — release
      if (tab.objectURL) {
        URL.revokeObjectURL(tab.objectURL);
        tab.objectURL = null;
      }
    }
  }
}

/** Render tab bar UI */
function renderTabs() {
  tabBar.innerHTML = '';
  for (const tab of APP.tabs) {
    const el = document.createElement('div');
    el.className = `tab-item${tab.id === APP.activeTabId ? ' active' : ''}`;
    el.innerHTML = `
      <span class="tab-name" title="${tab.fileName}">${tab.fileName}</span>
      <button class="tab-close" data-id="${tab.id}" title="Close tab">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    // Click tab to switch
    el.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-close')) switchTab(tab.id);
    });
    // Click × to close
    el.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabBar.appendChild(el);
  }
}

/** Load a video file into a new tab */
function loadVideoFile(file) {
  // Check tab limit
  if (APP.tabs.length >= APP.MAX_TABS) {
    alert(`Maximum ${APP.MAX_TABS} tabs allowed. Close a tab first.`);
    return;
  }

  // Save current tab state
  saveActiveTabState();

  // Create new tab
  const id = ++APP._tabIdCounter;
  const url = URL.createObjectURL(file);
  const tab = {
    id,
    fileName: file.name,
    file,               // keep File reference for re-creating objectURL
    objectURL: url,
    currentTime: 0,
    duration: 0,
    annotations: [],
  };
  APP.tabs.push(tab);
  APP.activeTabId = id;

  // Enforce sliding-window memory (releases distant tabs)
  enforceMemoryWindow();

  // Load video
  video.src = url;
  video.addEventListener('loadedmetadata', () => {
    tab.duration = video.duration;
    timeDuration.textContent = formatTime(video.duration);
    timeline.max = 100;
    updateTimeDisplay();

    // Switch to workspace
    landing.classList.add('hidden');
    workspace.classList.remove('hidden');
    video.pause();
    setPlayState(false);

    renderTimelineMarkers();
    if (window.resizeP5Canvas) window.resizeP5Canvas();
  }, { once: true });

  renderTabs();
  // Reset file inputs so same file can be re-selected
  videoInput.value = '';
  addVideoInput.value = '';
}

/** Switch to a different tab */
function switchTab(toId) {
  if (toId === APP.activeTabId) return;
  video.pause();

  // 1. Save current tab state
  saveActiveTabState();

  // 2. Activate target tab
  const tab = APP.tabs.find(t => t.id === toId);
  if (!tab) return;
  APP.activeTabId = toId;

  // 3. Enforce sliding-window memory (may release distant tabs, ensure neighbors have URLs)
  enforceMemoryWindow();

  // 4. Load video — objectURL is guaranteed to exist after enforceMemoryWindow
  video.src = tab.objectURL;

  video.addEventListener('loadedmetadata', () => {
    video.currentTime = tab.currentTime;
    timeDuration.textContent = formatTime(tab.duration);
    setPlayState(false);
    updateTimeline();
    renderTimelineMarkers();
    if (window.resizeP5Canvas) window.resizeP5Canvas();
  }, { once: true });

  renderTabs();
}

/** Close a tab */
function closeTab(id) {
  const tab = APP.tabs.find(t => t.id === id);
  if (!tab) return;

  // Confirm if tab has annotations
  if (tab.annotations.length > 0) {
    if (!confirm(`"${tab.fileName}" has ${tab.annotations.length} annotation(s). Close without exporting?`)) {
      return;
    }
  }

  // Release memory
  releaseTabMemory(id);
  APP.tabs = APP.tabs.filter(t => t.id !== id);

  if (APP.tabs.length === 0) {
    // No tabs left → back to Landing
    APP.activeTabId = null;
    video.removeAttribute('src');
    video.load();
    setPlayState(false);
    workspace.classList.add('hidden');
    landing.classList.remove('hidden');
    timelineMarkers.innerHTML = '';
    annotCount.textContent = '0 annotations';
    frameHint.classList.add('hidden');
  } else if (id === APP.activeTabId) {
    // Closed the active tab → switch to last tab
    switchTab(APP.tabs[APP.tabs.length - 1].id);
  }

  renderTabs();
}

// ═══════════════════════════════════════════
//  FILE LOADING — Landing
// ═══════════════════════════════════════════

videoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  loadVideoFile(file);
});

// Drag-and-drop on Landing
landing.addEventListener('dragover', (e) => { e.preventDefault(); landing.classList.add('dragover'); });
landing.addEventListener('dragleave', () => landing.classList.remove('dragover'));
landing.addEventListener('drop', (e) => {
  e.preventDefault();
  landing.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) loadVideoFile(file);
});

// ═══════════════════════════════════════════
//  FILE LOADING — Workspace (add new tab)
// ═══════════════════════════════════════════

btnAddVideo.addEventListener('click', () => addVideoInput.click());
addVideoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  loadVideoFile(file);
});

// Drag-and-drop on Workspace → add new tab
stageWrapper.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropOverlay.classList.remove('hidden');
});
stageWrapper.addEventListener('dragleave', (e) => {
  // Only hide if leaving the wrapper entirely
  if (!stageWrapper.contains(e.relatedTarget)) {
    dropOverlay.classList.add('hidden');
  }
});
stageWrapper.addEventListener('drop', (e) => {
  e.preventDefault();
  dropOverlay.classList.add('hidden');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) loadVideoFile(file);
});

// ─── PLAY / PAUSE ───
btnPlay.addEventListener('click', togglePlay);

function togglePlay() {
  if (video.paused) {
    video.play();
    setPlayState(true);
  } else {
    video.pause();
    setPlayState(false);
  }
}

video.addEventListener('play',  () => setPlayState(true));
video.addEventListener('pause', () => setPlayState(false));
video.addEventListener('ended', () => { setPlayState(false); video.currentTime = 0; });

// ─── VIDEO TIME UPDATES ───
video.addEventListener('timeupdate', updateTimeline);

// ─── TIMELINE SCRUBBING ───
let isScrubbing = false;
timeline.addEventListener('pointerdown', () => { isScrubbing = true; });
timeline.addEventListener('input', () => {
  video.currentTime = (timeline.value / 100) * video.duration;
  updateTimeDisplay();
});
timeline.addEventListener('pointerup', () => { isScrubbing = false; });
timeline.addEventListener('change', () => { isScrubbing = false; });

// ─── FRAME STEPPING ───
btnPrev.addEventListener('click', () => {
  video.pause();
  video.currentTime = Math.max(0, video.currentTime - APP.FRAME_STEP);
  updateTimeline();
});
btnNext.addEventListener('click', () => {
  video.pause();
  video.currentTime = Math.min(video.duration, video.currentTime + APP.FRAME_STEP);
  updateTimeline();
});

// ─── COLOR PALETTE ───
colorPalette.addEventListener('click', (e) => {
  const swatch = e.target.closest('.color-swatch');
  if (!swatch) return;
  colorPalette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  APP.currentColor = swatch.dataset.color;
});

// ─── UNDO ───
btnUndo.addEventListener('click', () => {
  const t = video.currentTime;
  const anns = APP.annotations;
  const idx = anns.findIndex(a =>
    Math.abs(a.timestamp - t) <= APP.TIME_TOLERANCE
  );
  if (idx !== -1 && anns[idx].strokes.length > 0) {
    anns[idx].strokes.pop();
    if (anns[idx].strokes.length === 0) {
      anns.splice(idx, 1);
    }
  }
  updateFrameHint();
  renderTimelineMarkers();
});

// ─── CLEAR FRAME ───
btnClearFrame.addEventListener('click', () => {
  const t = video.currentTime;
  const tab = getActiveTab();
  if (tab) {
    tab.annotations = tab.annotations.filter(a =>
      Math.abs(a.timestamp - t) > APP.TIME_TOLERANCE
    );
  }
  updateFrameHint();
  renderTimelineMarkers();
});

// ═══════════════════════════════════════════
//  EXPORT / IMPORT  (v2 multi-tab format)
// ═══════════════════════════════════════════

btnExport.addEventListener('click', () => {
  // Save current state first
  saveActiveTabState();

  let exportData, downloadName;

  if (APP.tabs.length === 1) {
    // Single tab → export as v1 flat array for simplicity
    const tab = APP.tabs[0];
    exportData = tab.annotations;
    const base = tab.fileName.replace(/\.[^.]+$/, '');
    downloadName = `${base}_annotations.json`;
  } else {
    // Multiple tabs → v2 format
    exportData = {
      version: 2,
      tabs: APP.tabs.map(t => ({
        fileName: t.fileName,
        currentTime: t.id === APP.activeTabId ? video.currentTime : t.currentTime,
        annotations: t.annotations,
      })),
    };
    downloadName = `multi_annotations.json`;
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = downloadName;
  a.click();
  URL.revokeObjectURL(a.href);
});

btnImport.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      if (Array.isArray(data)) {
        // v1 format — flat annotation array → load into active tab
        const tab = getActiveTab();
        if (tab) {
          tab.annotations = data;
          updateFrameHint();
          renderTimelineMarkers();
        } else {
          alert('Open a video first, then import annotations.');
        }
      } else if (data.version === 2 && Array.isArray(data.tabs)) {
        // v2 format — multi-tab
        // Match by fileName to existing tabs, or inject into active
        for (const importedTab of data.tabs) {
          const match = APP.tabs.find(t => t.fileName === importedTab.fileName);
          if (match) {
            match.annotations = importedTab.annotations;
            match.currentTime = importedTab.currentTime || 0;
          }
        }
        updateFrameHint();
        renderTimelineMarkers();
        // Notify about unmatched
        const unmatched = data.tabs.filter(
          it => !APP.tabs.some(t => t.fileName === it.fileName)
        );
        if (unmatched.length > 0) {
          alert(`Note: ${unmatched.length} tab(s) in the import file didn't match any open video:\n${unmatched.map(u => '  • ' + u.fileName).join('\n')}\nOpen those videos first to import their annotations.`);
        }
      } else {
        alert('Invalid annotation JSON format.');
      }
    } catch (err) {
      alert('Failed to parse JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  importInput.value = '';
});

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (workspace.classList.contains('hidden')) return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      video.pause();
      video.currentTime = Math.max(0, video.currentTime - APP.FRAME_STEP);
      updateTimeline();
      break;
    case 'ArrowRight':
      e.preventDefault();
      video.pause();
      video.currentTime = Math.min(video.duration, video.currentTime + APP.FRAME_STEP);
      updateTimeline();
      break;
    case 'KeyZ':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        btnUndo.click();
      }
      break;
  }
});
