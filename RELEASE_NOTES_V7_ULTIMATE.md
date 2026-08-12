# 🎉 Suno Workspace Exporter & Organizer Suite — v7.1 Ultimate Edition Release Notes

**Release Date**: August 11, 2026  
**Version**: `v7.1.0-ULTIMATE`  
**Package**: `Suno_Workspace_Exporter_Portable.zip`

---

## 🌟 Overview & Special Thanks

A huge thank you for your collaboration, testing, and security work! This **v7.0 Ultimate Edition** release combines 8+ months of engineering, research, security auditing, and performance optimization into one clean, crash-proof, 100% private open-source music management suite.

---

## 🛡️ Special Thanks to HeyMow for the Security Audit!

Huge appreciation and credit to **HeyMow** for conducting the comprehensive security audit, path sanitization analysis, and vulnerability hardening work for this v7.0 release!

☕ **Support HeyMow on Ko-fi**:  
👉 **[https://ko-fi.com/heymow](https://ko-fi.com/heymow)**

---

## 🧪 Special Thanks to psychotic_d3v1l for Beta Testing!

Huge appreciation and credit to **psychotic_d3v1l** for rigorous beta testing and feedback!

☕ **Support psychotic_d3v1l on Ko-fi**:  
👉 **[https://ko-fi.com/psychotic_d3v1l](https://ko-fi.com/psychotic_d3v1l)**

---

## 🚀 Key Features & Upgrades Implemented

### 1. 🏷️ Custom Workspace Naming & Individual Filtering
- **Workspace Manager Modal**: Users can type custom descriptive names for all Suno workspaces (e.g. *"🔥 Cyberpunk Album"*, *"🎸 Heavy Metal Riffs"*, *"☕ LoFi Lounge"*). Names persist across sessions in `localStorage`.
- **Quick-Select Workspace Pill Bar**: Horizontal scrolling workspace selector bar. Clicking any workspace instantly filters track cards, table rows, and audio player queues to **only show tracks from that workspace**.
- **Dynamic File Naming**: Every export file (JSON & CSV) dynamically includes the workspace name and track count (e.g. `suno_workspace_LoFi_Lounge_85_songs.json`).

### 2. ⚡ Full-Workspace Continuous Infinite Bounce Scroller
- **Fixed Page 350+ Stalling**: Resolved progress tracking bug where RAM purging caused scrollers to halt prematurely around page 350 (~3,500 songs).
- **Monotonic Progress Tracking**: Progress tracks `grandTotalCount = totalOffloadedCount + activeRAM`, ensuring monotonic progression.
- **React Bounce Scroller**: Performs active bounce scrolling (up 400px, down 800px) when at page bottom to trigger Suno React `IntersectionObserver` network pagination.
- **Extended Idle Threshold**: Extended idle timeout to 120 scroll attempts (~100 seconds) before declaring workspace end.

### 3. 💾 Base64 Data URL Disk Offloading
- **Fixed Download Failures**: Replaced percent-encoded data URLs with **Base64 Data URLs** (`data:application/json;base64,...`) in `background.js`, preventing Chrome download engine timeouts on large payloads.
- **Automatic RAM Purging**: Automatically purges offloaded tracks from browser memory once saved to disk, keeping RAM bloat at **0MB**.

### 4. 🛡️ Comprehensive Security Hardening & Store Compliance
- **Stored XSS Prevention**: `sanitizeTrackId()` validates UUID structures; `safeMediaUrl()` restricts media URLs strictly to `http:` and `https:`, blocking `javascript:` XSS payloads.
- **Command Injection Defense**: `shQuote()` and `psQuote()` single-quote all metadata in generated Bash (`.sh`) and PowerShell (`.ps1`) asset downloaders.
- **CSV Parser Resilience**: Quote-recovering parser loop in `parseCSV()` recovers from unclosed quotes in user uploaded CSV files without dropping data.
- **Origin Verification**: Replaced wildcard `'*'` postMessage targets in `content_suno.js` and `injected.js` with `window.location.origin`.
- **Manifest V3 CSP & Scoping**: Host permissions strictly scoped to `suno.com` and `suno.ai`. Enforced strict `extension_pages` Content Security Policy.

### 6. 🛠️ Batch Downloader Hardening (TypeError & InvalidStateError Fixes)
- **Trailing Dot Sanitization**: `sanitize()` and `sanitizeFilename()` strip trailing dots (`.`) and spaces from file/folder names, preventing Windows FileSystem Access API `InvalidStateError`.
- **Network & File Stream Retries**: Added 3-attempt retry loop with exponential backoff for CDN fetch requests (`TypeError` handling) and stream abort cleanup for file writing locks.

### 7. ✨ Created Date Sorting & Rich Master Organizer Toolbar
- **Created Date Sort**: Added `✨ Created Date (Newest/Oldest)` sorting modes to `#select-sort` in `workspace-organizer-portable.html`.
- **Advanced Sorting Options**: Added Title (Z-A), Artist (A-Z), and Duration (Longest First) sorting modes.

### 8. ⚡ 95% RAM Reduction & Live Counter Synchronization
- **`createLightweightClip()` Memory Sanitizer**: Strips raw 15KB API waveform payloads down to 0.5KB per track in `content_suno.js`, reducing RAM consumption by 95% during long scanning sessions.
- **Live Counter Sync**: Unified `get_stats` API response so the floating page overlay and extension popup display the exact same live track count in real-time.

---

## 📂 Included Package Files

```
Suno_Workspace_Exporter_Portable/
├── workspace-organizer-portable.html   # Standalone Universal Web Organizer & Downloader
├── USER_GUIDE_HOW_TO_USE.md            # Plain-English Step-by-Step User Manual
├── RELEASE_NOTES_V7_ULTIMATE.md        # Release Notes & Collaboration Overview
├── CHANGELOG.md                        # Full Version History & Engineering Log
└── suno-token-extension/               # Chrome Extension v7.0 Pro (Load Unpacked)
    ├── manifest.json
    ├── background.js
    ├── content_suno.js
    ├── injected.js
    ├── bridge_organizer.js
    ├── popup.html
    ├── popup.js
    ├── README.md
    └── icons/
```

---

## 📦 Zip Download Location

- **ZIP File**: `Downloads/Suno_Workspace_Exporter_Portable.zip`
- **Path**: `/home/andrew/Downloads/Suno_Workspace_Exporter_Portable.zip`
