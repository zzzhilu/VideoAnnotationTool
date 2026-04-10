# 🎬 Video Annotation Tool

A local-first, privacy-focused video annotation tool that runs entirely in your browser. Draw frame-by-frame annotations on videos with zero uploads — everything stays on your machine.

🔗 **Live Demo:** [https://zzzhilu.github.io/VideoAnnotationTool/](https://zzzhilu.github.io/VideoAnnotationTool/)

---

## ✨ Features

### Core
- **Frame-by-frame drawing** — Pause at any frame and draw annotations directly on the video
- **Multi-color palette** — Yellow, Red, Green, Cyan, White with one-click switching
- **Undo & Clear** — Undo last stroke or clear all annotations on the current frame
- **Timeline markers** — Small visual ticks on the timeline show which frames have annotations
- **Keyboard shortcuts** — Space (play/pause), Arrow keys (frame step), Ctrl+Z (undo)

### Multi-Video Tab System
- **Tabbed interface** — Open multiple videos simultaneously, each in its own tab
- **Drag-and-drop** — Drop videos onto the landing page or workspace to open new tabs
- **State preservation** — Playback position and annotations are saved when switching tabs
- **Sliding-window memory** — Only the active tab ±1 neighbor keeps its video blob in memory; distant tabs are released and rebuilt on demand

### Export / Import
- **JSON export** — Save all annotations (single or multi-tab) as a portable JSON file
- **v1 compatibility** — Import legacy single-video annotation files
- **v2 multi-tab format** — Export/import annotations for all open tabs at once

### iPad / Apple Pencil Support
- **Pointer Events** — Full support for stylus input with palm rejection
- **High sample rate** — Uses `getCoalescedEvents()` for smooth Apple Pencil curves
- **Touch-safe** — Only the canvas intercepts touch; timeline and buttons remain fully interactive

---

## 🚀 Getting Started

### Online
Visit the [live demo](https://zzzhilu.github.io/VideoAnnotationTool/) — no installation needed.

### Local Development
```bash
# Clone the repository
git clone https://github.com/zzzhilu/VideoAnnotationTool.git
cd VideoAnnotationTool

# Serve with any static server
python -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Drawing Engine | [p5.js](https://p5js.org/) (Instance Mode) |
| Video Playback | HTML5 `<video>` with Pointer Events |
| Styling | Vanilla CSS (Spotify-inspired dark theme) |
| State Management | Vanilla JS with `Object.defineProperty` proxy |
| Deployment | GitHub Pages (static files) |

---

## 📁 Project Structure

```
├── index.html      # Main HTML — landing page + workspace layout
├── app.js          # Core logic — tab system, video controls, export/import
├── sketch.js       # p5.js drawing engine — strokes, rendering, input handling
├── style.css       # Spotify-inspired dark theme + responsive layout
└── DESIGN.md       # Design documentation
```

---

## 🎨 Design

- **Spotify-inspired dark UI** with `#121212` deep background and `#1ed760` accent
- **Typography:** Outfit (body) + JetBrains Mono (code/timecodes)
- **Responsive:** Works on desktop, tablet, and mobile

---

## 📄 License

MIT
