/* ═══════════════════════════════════════════
   sketch.js — p5.js Overlay & Drawing Engine
   Uses Instance Mode to avoid global pollution

   iPad / Apple Pencil Compatibility:
   ─ CSS touch-action:none prevents scroll hijack
   ─ document-level touchstart listener for iOS Safari (p5.js#5358)
   ─ Pointer Events API with getCoalescedEvents for smooth pen input
   ─ getBoundingClientRect for scroll-safe coordinate calculation
   ─ Scribble interference mitigation via preventDefault
   ═══════════════════════════════════════════ */

// ─── iOS SAFARI ACTIVATION FIX ───
// Without this, touch/pointer events silently fail in fullscreen/iframe on iOS Safari.
// Ref: https://github.com/processing/p5.js/issues/5358
document.addEventListener('touchstart', {}, { passive: true });

const annotationSketch = (p) => {
  const STROKE_WEIGHT = 3;
  let canvasEl = null; // reference to the raw DOM <canvas>

  // ─── SETUP ───
  p.setup = function () {
    const container = document.getElementById('canvasContainer');
    const cnv = p.createCanvas(container.offsetWidth, container.offsetHeight);
    cnv.parent(container);
    p.pixelDensity(1);
    p.frameRate(30);

    canvasEl = cnv.elt; // grab the raw DOM element

    // ── Enforce touch-action via JS (belt-and-suspenders with CSS) ──
    canvasEl.style.touchAction = 'none';
    canvasEl.style.webkitUserSelect = 'none';
    canvasEl.style.userSelect = 'none';

    // ── Pointer Events API for Apple Pencil / stylus ──
    // These fire for mouse, touch AND pen, with richer data than touch events.
    canvasEl.addEventListener('pointerdown',  onPointerDown,  { passive: false });
    canvasEl.addEventListener('pointermove',  onPointerMove,  { passive: false });
    canvasEl.addEventListener('pointerup',    onPointerUp,    { passive: false });
    canvasEl.addEventListener('pointercancel', onPointerUp,   { passive: false }); // Scribble can cancel
    canvasEl.addEventListener('pointerleave', onPointerUp,    { passive: false });

    // Prevent iOS context menu / magnifier on long-press
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  // ─── DRAW LOOP ───
  // Overridden below in enhancedSketch for per-stroke color support
  p.draw = function () {
    p.clear(); // transparent background

    const video = APP.video;
    if (!video || !video.videoWidth) return;

    const cw = p.width;
    const ch = p.height;

    // ── Render existing annotations for current time ──
    const t = video.currentTime;
    for (const ann of APP.annotations) {
      if (Math.abs(ann.timestamp - t) <= APP.TIME_TOLERANCE) {
        p.stroke(ann.color);
        p.strokeWeight(STROKE_WEIGHT);
        p.noFill();
        for (const stroke of ann.strokes) {
          if (stroke.length < 2) continue;
          p.beginShape();
          for (const pt of stroke) {
            p.vertex(pt.x * cw, pt.y * ch);
          }
          p.endShape();
        }
      }
    }

    // ── Render stroke currently being drawn ──
    if (APP.isDrawing && APP.currentStroke.length >= 2) {
      p.stroke(APP.currentColor);
      p.strokeWeight(STROKE_WEIGHT);
      p.noFill();
      p.beginShape();
      for (const pt of APP.currentStroke) {
        p.vertex(pt.x * cw, pt.y * ch);
      }
      p.endShape();
    }
  };

  // ═══════════════════════════════════════
  //  POINTER EVENTS (replaces p5 mouse/touch for precision)
  // ═══════════════════════════════════════

  /** Convert page coordinates to relative 0..1 using getBoundingClientRect.
   *  This is scroll-safe — works even if the page has been scrolled on iPad. */
  function pageToRelative(pageX, pageY) {
    if (!canvasEl) return { x: 0, y: 0 };
    const rect = canvasEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (pageX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (pageY - rect.top)  / rect.height));
    return { x, y };
  }

  function onPointerDown(e) {
    // ── Guard: only draw when paused & pointer-events are enabled ──
    if (APP.isPlaying) return;
    if (canvasEl.parentElement.style.pointerEvents === 'none') return;

    // ── Palm rejection: ignore touch when a pen is active ──
    if (APP.isDrawing && e.pointerType === 'touch') return;

    e.preventDefault();  // prevent Scribble / scroll

    APP.isDrawing = true;
    APP._activePointerType = e.pointerType;
    APP.currentStroke = [];

    const pt = pageToRelative(e.clientX, e.clientY);
    APP.currentStroke.push(pt);
  }

  function onPointerMove(e) {
    if (!APP.isDrawing) return;

    // ── Palm rejection: ignore finger while pen is drawing ──
    if (APP._activePointerType === 'pen' && e.pointerType === 'touch') return;

    e.preventDefault();

    // ── Coalesced events for smooth Apple Pencil curves ──
    if (e.getCoalescedEvents) {
      const coalesced = e.getCoalescedEvents();
      if (coalesced.length > 0) {
        for (const ce of coalesced) {
          const pt = pageToRelative(ce.clientX, ce.clientY);
          APP.currentStroke.push(pt);
        }
        return;
      }
    }

    const pt = pageToRelative(e.clientX, e.clientY);
    APP.currentStroke.push(pt);
  }

  function onPointerUp(e) {
    if (!APP.isDrawing) return;

    // ── Palm rejection: ignore finger up while pen is drawing ──
    if (APP._activePointerType === 'pen' && e.pointerType === 'touch') return;

    APP.isDrawing = false;
    APP._activePointerType = null;

    if (APP.currentStroke.length < 2) {
      APP.currentStroke = [];
      return;
    }

    const t = roundTime(APP.video.currentTime);

    let ann = APP.annotations.find(a =>
      Math.abs(a.timestamp - t) <= APP.TIME_TOLERANCE
    );

    if (!ann) {
      ann = { timestamp: t, color: APP.currentColor, strokes: [] };
      APP.annotations.push(ann);
    }

    ann.strokes.push(
      APP.currentStroke.map(pt => ({ ...pt, color: APP.currentColor }))
    );

    APP.currentStroke = [];

    const annotCount = document.getElementById('annotationCount');
    const frameHint  = document.getElementById('frameAnnotationHint');
    if (annotCount) annotCount.textContent = `${APP.annotations.length} annotation${APP.annotations.length !== 1 ? 's' : ''}`;
    if (frameHint)  frameHint.classList.remove('hidden');

    if (typeof renderTimelineMarkers === 'function') renderTimelineMarkers();
  }

  // ─── p5 touch handlers — only block default on canvas, NOT on timeline ───
  p.touchStarted = function (e) {
    if (e.target && e.target.closest('#canvasContainer')) {
      e.preventDefault();
      return false;
    }
  };

  p.touchMoved = function (e) {
    if (e.target && e.target.closest('#canvasContainer')) {
      e.preventDefault();
      return false;
    }
  };

  p.touchEnded = function (e) {
    if (e.target && e.target.closest('#canvasContainer')) {
      return false;
    }
  };

  // ─── WINDOW RESIZE ───
  p.windowResized = function () {
    resizeToVideo();
  };

  // ─── UTILITIES ───
  function roundTime(t) {
    return Math.round(t * 100) / 100;
  }

  function resizeToVideo() {
    const container = document.getElementById('canvasContainer');
    if (!container) return;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    if (w > 0 && h > 0) {
      p.resizeCanvas(w, h);
    }
  }

  // Expose resize function globally
  window.resizeP5Canvas = resizeToVideo;
};

// ─── RENDER PER-STROKE COLORS ───
// Override the draw loop to support per-stroke colors inside an annotation
const originalSketch = annotationSketch;

const enhancedSketch = (p) => {
  originalSketch(p);

  const baseDraw = p.draw;
  p.draw = function () {
    p.clear();

    const video = APP.video;
    if (!video || !video.videoWidth) return;

    const cw = p.width;
    const ch = p.height;
    const t = video.currentTime;
    const STROKE_WEIGHT = 3;

    // Render existing annotations
    for (const ann of APP.annotations) {
      if (Math.abs(ann.timestamp - t) <= APP.TIME_TOLERANCE) {
        p.noFill();
        p.strokeWeight(STROKE_WEIGHT);
        for (const stroke of ann.strokes) {
          if (stroke.length < 2) continue;
          // Use per-point color if available, otherwise annotation color
          const strokeColor = stroke[0]?.color || ann.color;
          p.stroke(strokeColor);
          p.beginShape();
          for (const pt of stroke) {
            p.vertex(pt.x * cw, pt.y * ch);
          }
          p.endShape();
        }
      }
    }

    // Render current stroke
    if (APP.isDrawing && APP.currentStroke.length >= 2) {
      p.stroke(APP.currentColor);
      p.strokeWeight(STROKE_WEIGHT);
      p.noFill();
      p.beginShape();
      for (const pt of APP.currentStroke) {
        p.vertex(pt.x * cw, pt.y * ch);
      }
      p.endShape();
    }
  };
};

// ─── INSTANTIATE ───
new p5(enhancedSketch, document.getElementById('canvasContainer'));

// ─── ResizeObserver for video element changes ───
const stageObserver = new ResizeObserver(() => {
  if (window.resizeP5Canvas) window.resizeP5Canvas();
});
stageObserver.observe(document.getElementById('stage'));

