# 🎬 Video Annotation Tool

> **Language:** [English](#-features) ｜ [繁體中文](#-功能特色)

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

### Expanded Format Support
- **Wide container support** — MP4, MOV, MKV, AVI, WebM, M4V, OGV, TS, FLV, and more
- **FPS auto-detection** — Automatically detects native video framerate (24/25/30/50/60fps) for accurate frame stepping
- **Codec error handling** — Clear error messages when an unsupported codec (e.g. H.265/HEVC) is detected, with re-encoding tips

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
└── style.css       # Spotify-inspired dark theme + responsive layout
```

---

## 🎨 Design

- **Spotify-inspired dark UI** with `#121212` deep background and `#1ed760` accent
- **Typography:** Outfit (body) + JetBrains Mono (code/timecodes)
- **Responsive:** Works on desktop, tablet, and mobile

---

## 📄 License

MIT

---

<br>

# 🎬 影片標註工具

本地優先、注重隱私的影片標註工具，完全在瀏覽器中運行。逐幀繪製標註，零上傳 — 所有資料都留在你的裝置上。

🔗 **線上體驗：** [https://zzzhilu.github.io/VideoAnnotationTool/](https://zzzhilu.github.io/VideoAnnotationTool/)

---

## ✨ 功能特色

### 核心功能
- **逐幀繪圖** — 暫停在任一影格上，直接在影片上繪製標註
- **多色調色盤** — 黃、紅、綠、青、白，一鍵切換
- **復原與清除** — 復原上一筆畫，或清除當前影格的所有標註
- **時間軸標記** — 時間軸上以小標記顯示哪些影格有標註
- **鍵盤快捷鍵** — Space（播放/暫停）、方向鍵（逐幀）、Ctrl+Z（復原）

### 多影片分頁系統
- **分頁介面** — 同時開啟多個影片，各自獨立為一個分頁
- **拖放操作** — 將影片拖入首頁或工作區即可開啟新分頁
- **狀態保存** — 切換分頁時自動保存播放位置與標註資料
- **滑動窗口記憶體管理** — 僅保留當前分頁前後各一個分頁的影片 blob；超出範圍的分頁自動釋放記憶體，切回時從 File 物件重建

### 匯出 / 匯入
- **JSON 匯出** — 將所有標註（單一或多分頁）儲存為可攜的 JSON 檔案
- **v1 相容** — 可匯入舊版單影片標註檔案
- **v2 多分頁格式** — 一次匯出/匯入所有開啟分頁的標註

### 擴充格式支援
- **廣泛的容器支援** — MP4、MOV、MKV、AVI、WebM、M4V、OGV、TS、FLV 等
- **FPS 自動偵測** — 自動偵測影片原生幀率（24/25/30/50/60fps），精確逐幀步進
- **編碼錯誤處理** — 當遇到不支援的編碼（如 H.265/HEVC）時，顯示清晰的錯誤訊息和轉檔建議

### iPad / Apple Pencil 支援
- **Pointer Events** — 完整支援觸控筆輸入與掌紋排斥
- **高取樣率** — 使用 `getCoalescedEvents()` 實現流暢的 Apple Pencil 曲線
- **觸控安全** — 僅畫布攔截觸控事件；時間軸與按鈕維持正常互動

---

## 🚀 快速開始

### 線上使用
直接訪問[線上版本](https://zzzhilu.github.io/VideoAnnotationTool/) — 無需安裝。

### 本地開發
```bash
# 複製儲存庫
git clone https://github.com/zzzhilu/VideoAnnotationTool.git
cd VideoAnnotationTool

# 使用任何靜態伺服器
python -m http.server 8080
# 或
npx serve .
```

在瀏覽器開啟 `http://localhost:8080`。

---

## 🛠 技術架構

| 層級 | 技術 |
|------|------|
| 繪圖引擎 | [p5.js](https://p5js.org/)（Instance Mode） |
| 影片播放 | HTML5 `<video>` + Pointer Events |
| 樣式 | 原生 CSS（Spotify 風格深色主題） |
| 狀態管理 | 原生 JS + `Object.defineProperty` 代理 |
| 部署 | GitHub Pages（純靜態檔案） |

---

## 📁 專案結構

```
├── index.html      # 主頁面 — 首頁 + 工作區佈局
├── app.js          # 核心邏輯 — 分頁系統、影片控制、匯出入
├── sketch.js       # p5.js 繪圖引擎 — 筆畫、渲染、輸入處理
└── style.css       # Spotify 風格深色主題 + 響應式佈局
```

---

## 🎨 設計

- **Spotify 風格深色 UI**：`#121212` 深色背景 + `#1ed760` 主題色
- **字體：** Outfit（內文）+ JetBrains Mono（時間碼/程式碼）
- **響應式設計：** 支援桌面、平板、手機

---

## 📄 授權

MIT
