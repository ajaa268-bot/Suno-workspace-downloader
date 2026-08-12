# Standalone Suno Workspace Exporter (v7.0 Ultimate Edition)

**High-Capacity Continuous Offloader, Crash Auto-Healing & Portable Organizer Suite (Up to 60,000+ Songs)**

---

### ❤️ A Labour of Love & Gift to the Community
This software suite represents **8 months of hard work, research, and personal investment** to build the ultimate open-source music management tool for the Suno AI community.
It is **100% Free & Open Source** — all we ask is that you give credit where credit is due if you share or build upon it!

☕ **Support the Project on Ko-fi**:
If this tool saves you time or brings value to your music creation, buying a coffee is warmly welcomed and deeply appreciated!
👉 **[Buy Me a Coffee on Ko-fi](https://ko-fi.com/andrewstatic)** (`https://ko-fi.com/andrewstatic`)

🛡️ **Special Thanks to HeyMow for the Security Audit**:
Huge appreciation to **HeyMow** for conducting the thorough security audit and vulnerability hardening analysis for v7.0!
👉 **[Support HeyMow on Ko-fi](https://ko-fi.com/heymow)** (`https://ko-fi.com/heymow`)

---

## 🌟 Key Features

1. **Passive Network & DOM Capture Engine**:
   - Intercepts all Suno API calls (`window.fetch` & `XMLHttpRequest`) and DOM data structures automatically as you browse or scroll on Suno.com.
   - Eliminates direct API fetch loops that fail due to HTTP 401/403 or CORS restrictions.

2. **Multi-Container Scroll Assistant (Bypasses 240-Song Bottleneck)**:
   - Detects all nested scroll containers on Suno's SPA layout (`<div class="overflow-y-auto">`, `<main>`, etc.).
   - Dispatches synthetic scroll & wheel events to trigger Suno's React infinite scroll observer continuously past the 240-song rendering cap up to **60,000 tracks**.

3. **React Fiber State Tree Scanner**:
   - Scans internal React component state (`__reactFiber$`, `__reactProps$`) attached to DOM elements to capture unrendered tracks stored in memory.

4. **Persistent Buffer Storage (`chrome.storage.local`)**:
   - Accumulates captured tracks across page reloads and browsing sessions up to **60,000 tracks**.

5. **Customizable "What to Parse"**:
   - **Fields Presets**:
     - `Full Metadata`: All properties (ID, Title, Audio/Video URLs, Lyrics/Prompts, Style Tags, Cover Images, Workspace ID, Created At, Duration, Model, Plays, Likes).
     - `Standard`: Clean baseline (Title, Audio URL, Lyrics, Tags, Image, Video, Workspace).
     - `Minimal`: Lightweight export (ID, Title, Audio URL).
   - **Scope Filters**: Export all captured tracks, active workspace only, or tracks with lyrics only.

6. **Customizable "Where to Save"**:
   - **Downloads Subfolder**: Direct exports into subfolders inside your browser Downloads directory (e.g. `SunoExports/` or `Suno_Library/`).
   - **Filename Prefix**: Custom prefix for your files (e.g. `suno_workspace_export` or `My_Suno_Tracks`).
   - **Chunk Size Selector**: Choose chunk limits (`1,000`, `5,000`, `10,000`, `20,000`, or `60,000` tracks per JSON file).

---

## 🚀 Installation Instructions

1. Open Chrome, Edge, or Brave and navigate to `chrome://extensions`.
2. Turn ON **Developer mode** (toggle switch in top-right corner).
3. Click **Load unpacked**.
4. Select the directory:
   `/mnt/shares/OS/auxplaylist_insights/suno-token-extension`
5. Pin the **Standalone Suno Workspace Exporter** extension to your toolbar.

---

## 📖 How to Use

1. **Navigate to Suno**: Open `https://suno.com` and log in to your account.
2. **Start Auto-Scroll Capture**:
   - Click the extension icon to open the popup.
   - Click **📜 Toggle Auto-Scroll Capture** (or click the floating **📜 Auto-Scroll** button in the bottom-left of Suno).
   - Watch the counter increase past 240 up to thousands of songs (`📊 N / 60,000 Buffer`).
3. **Configure Options**:
   - Select **What to Parse** (Full Metadata, Standard, or Minimal).
   - Select **Where to Save** (Subfolder name and Filename Prefix).
   - Select **Chunk Size** (e.g. 10,000 songs per file).
4. **Download JSON Files**:
   - Click **🚀 Download JSON in Chunks**.
   - Your tracks will be downloaded into your specified folder in numbered JSON files!

---

## 📁 Extension File Overview

- [manifest.json](file:///mnt/shares/OS/auxplaylist_insights/suno-token-extension/manifest.json): Extension configuration & permissions (`storage`, `downloads`, `scripting`, `<all_urls>`).
- [content_suno.js](file:///mnt/shares/OS/auxplaylist_insights/suno-token-extension/content_suno.js): Content script containing network interceptor, multi-container scroll engine, React Fiber scanner, storage sync, and shadow overlay UI.
- [injected.js](file:///mnt/shares/OS/auxplaylist_insights/suno-token-extension/injected.js): Main world script for CSP bypass and main-world fetch interception.
- [popup.html](file:///mnt/shares/OS/auxplaylist_insights/suno-token-extension/popup.html): User options interface (Parsing presets, Save location, Chunk size, Auto-scroll button).
- [popup.js](file:///mnt/shares/OS/auxplaylist_insights/suno-token-extension/popup.js): Popup logic, storage preference binding, and chunk download orchestrator.
- [background.js](file:///mnt/shares/OS/auxplaylist_insights/suno-token-extension/background.js): Service worker for background messaging and session tokens.
