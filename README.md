# 🎵 Suno Workspace Exporter & Portable Organizer Suite (v7.0 Ultimate Edition)

> **All-in-One Universal Offline Suno Workspace Exporter, Live API Scraper, Custom Workspace Organizer, and Command-Injection-Proof Batch Downloader.**

[![Version](https://img.shields.io/badge/Version-v7.0--ULTIMATE-purple.svg)](https://github.com/ajaa268-bot/Suno-workspace-downloader)
[![Manifest](https://img.shields.io/badge/Manifest-MV3%20Compliant-blue.svg)](https://github.com/ajaa268-bot/Suno-workspace-downloader)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/ajaa268-bot/Suno-workspace-downloader)
[![Security](https://img.shields.io/badge/Security-Hardened%20%26%20Audited-emerald.svg)](https://github.com/ajaa268-bot/Suno-workspace-downloader)
[![Buy Andrew a Coffee on Ko-fi](https://img.shields.io/badge/☕%20Buy%20Andrew%20a%20Coffee-Ko--fi-ff5e5b.svg)](https://ko-fi.com/andrewstatic)
[![Support HeyMow on Ko-fi](https://img.shields.io/badge/🛡️%20Support%20HeyMow-Ko--fi-10b981.svg)](https://ko-fi.com/heymow)

---

## 🌟 Overview & Features

The **Suno Workspace Exporter & Portable Organizer Suite** is a high-performance, crash-proof, 100% private open-source toolset built to capture, organize, play, and batch-download your entire Suno AI music collection across all your workspaces.

### ✨ Key Features

- **🏷️ Custom Workspace Naming & Filtering**:
  - Name, rename, and tag all your Suno workspaces (e.g. *"🔥 Cyberpunk Album"*, *"🎸 Heavy Metal Riffs"*, *"☕ LoFi Lounge"*).
  - Horizontal scrolling Quick-Select Pill Bar lets you filter grid cards, table rows, and audio player queues to single workspaces in 1 click.
  - Every exported JSON/CSV file dynamically includes the workspace name and song count (`suno_workspace_LoFi_Lounge_85_songs.json`).

- **⚡ Continuous Infinite Bounce Scroller (Past Page 350+ Limit)**:
  - Resolves progress-tracking bugs where RAM purging caused scrollers to halt prematurely around page 350 (~3,500 songs).
  - Monotonic progress tracking (`grandTotalCount = totalOffloadedCount + activeRAM`) ensures continuous scrolling up to 60,000+ tracks.
  - React Bounce Scroller performs subtle scroll-up/scroll-down actions to continuously trigger Suno's React `IntersectionObserver` pagination.

- **💾 Base64 Data URL Continuous Disk Offloader**:
  - Automatically offloads JSON parts to disk and purges captured tracks from browser RAM, keeping RAM bloat at **0MB** no matter how large your library is.

- **🛡️ Hardened Security & XSS Protection**:
  - `sanitizeTrackId()`: Validates UUID structures on all imported tracks.
  - `safeMediaUrl()`: Restricts media URLs strictly to `http:` and `https:`, blocking `javascript:` XSS vectors.
  - `escapeHtml()`: Enforces strict HTML escaping on all rendered track fields.
  - `window.location.origin`: Replaced wildcard `'*'` postMessage origins with strict origin verification.

- **🐚 Command-Injection-Proof Asset Downloaders**:
  - Generated Bash (`.sh`) and PowerShell (`.ps1`) scripts single-quote all track titles, artists, lyrics, and filenames with `shQuote()` and `psQuote()` to eliminate shell command injection risks.

- **🌉 Read-Only Extension Bridge**:
  - Includes `bridge_organizer.js` to enable seamless, read-only `chrome.storage.local` communication for local `file://` organizer pages.

---

## 🛠️ Installation & Setup Guide

### 🧩 1. Chrome Extension Installation (One-Time Setup)

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `suno-token-extension` folder inside this repository.
5. Pin the extension to your Chrome toolbar by clicking the puzzle icon 🧩 and selecting the pin 📌 next to **Standalone Suno Workspace Exporter v7.0 Ultimate Edition**.

### 💻 2. Portable Web Organizer App

- Double-click `workspace-organizer-portable.html` in your browser.
- Works 100% offline without needing any server installation!
- Automatically syncs with the Chrome extension or allows drag-and-drop importing of JSON/CSV manifests.

---

## 📂 Repository File Structure

```text
Suno-workspace-downloader/
├── workspace-organizer-portable.html   # Standalone Universal Web Organizer & Downloader
├── USER_GUIDE_HOW_TO_USE.md            # Plain-English Step-by-Step User Manual
├── RELEASE_NOTES_V7_ULTIMATE.md        # Release Notes & Collaboration Summary
├── CHANGELOG.md                        # Complete Engineering Version Log
└── suno-token-extension/               # Chrome Extension v7.0 Pro (Load Unpacked)
    ├── manifest.json                   # Manifest V3 configuration
    ├── background.js                   # Base64 Data URL Disk Downloader
    ├── content_suno.js                 # 4-Layer Network & DOM Scraper + Bounce Scroller
    ├── injected.js                     # Main World passive fetch/XHR interceptor
    ├── bridge_organizer.js             # Read-only postMessage bridge for local organizer
    ├── popup.html                      # Extension popup interface
    ├── popup.js                        # Popup script with 3-tier tab resolver
    ├── README.md                       # Extension-specific documentation
    └── icons/                          # Official Extension Icon Set
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

---

## ❤️ Credits & Support

- ☕ **Support Project Development on Ko-fi**:  
  👉 **[Buy Me a Coffee on Ko-fi](https://ko-fi.com/andrewstatic)** (`https://ko-fi.com/andrewstatic`)

- 🛡️ **Special Thanks to HeyMow for the Security Audit**:  
  Huge appreciation to **HeyMow** for conducting the security audit, path sanitization analysis, and vulnerability hardening work!  
  👉 **[Support HeyMow on Ko-fi](https://ko-fi.com/heymow)** (`https://ko-fi.com/heymow`)

---

## 📜 License

This project is licensed under the **MIT License** — 100% Free & Open Source. All we ask is that you keep attribution intact!
