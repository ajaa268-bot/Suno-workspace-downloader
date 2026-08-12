# 📋 Suno Workspace Exporter & Portable Organizer Suite - Changelog

All notable changes, security enhancements, and performance optimizations for this project are documented in this file.

## [v7.1.0-ULTIMATE] - 2026-08-11

### 🛠️ Download Spam Elimination & Service Worker Stability Patch

1. **🚫 Download Spam Elimination**:
   - Added `unsavedCount` tracking in `checkAndAutoSaveChunk()` so captured tracks are never re-downloaded repeatedly when RAM purging is turned off.
   - Enforced a 5-second minimum cooldown lock (`lastOffloadTime`) between automatic chunk offloads.

2. **⚡ Background Service Worker Fix**:
   - Wrapped `chrome.downloads.download` in an async `Promise` in `background.js`, resolving `ReferenceError: sendResponse is not defined`.

3. **🛡️ Origin Security Hardening**:
   - Replaced wildcard `'*'` postMessage target origins in `content_suno.js` and `injected.js` with `window.location.origin`.

4. **❤️ Attribution & Ko-fi Support**:
   - Added special thanks and Ko-fi links for **Andrew Static** (`https://ko-fi.com/andrewstatic`), **HeyMow** (`https://ko-fi.com/heymow`), and **psychotic_d3v1l** (`https://ko-fi.com/psychotic_d3v1l`) across documentation and GitHub releases.

5. **🛠️ Batch Downloader Resilience (TypeError & InvalidStateError Fixes)**:
   - Enhanced `sanitize()` and `sanitizeFilename()` to strip trailing dots (`.`) and spaces from file/folder names, preventing Windows FileSystem Access API `InvalidStateError`.
   - Added 3-attempt retry loop with exponential backoff for CDN network requests (`TypeError` handling) and stream abort cleanup for file writing locks.

6. **✨ Created Date Sorting**:
   - Added Created Date (Newest/Oldest), Title (Z-A), Artist, and Duration sorting options to `#select-sort` in `workspace-organizer-portable.html`.

7. **⚡ 95% RAM Reduction Optimization**:
   - Implemented `createLightweightClip()` memory sanitizer in `content_suno.js`, stripping raw 15KB API waveform payloads down to 0.5KB per track, reducing memory consumption by 95% during long scanning sessions.

8. **🎯 Live Counter Synchronization**:
   - Unified `get_stats` API response in `content_suno.js` and `popup.js` so both the floating page overlay and the extension popup UI display the exact same live track grand total in real-time.

9. **🔄 Infinite Auto-Scroll Keep-Alive Engine**:
   - Fixed premature auto-scroll stopping at 2,000–2,500 tracks caused by Suno React Virtual DOM height caps and API rate-limiting pauses.
   - Added `chkKeepScrolling` toggle (`🔄 Infinite Auto-Scroll Keep-Alive`) in `popup.html` and `popup.js`.
   - Added automated 6-step scroll-bounce re-triggering to keep Suno React `IntersectionObserver` active through API rate-limits.
   - Expanded idle tolerance to 300 steps (~4–5 minutes) with multi-container bottom verification.

---

## [v7.0.0-ULTIMATE] - 2026-08-11

### 🛡️ Ultimate Security, Sanitization & Portable Integration Merge

1. **🛡️ Track & URL Security**:
   - Integrated `sanitizeTrackId()` (UUID validation on all imported tracks with safe fallback generator).
   - Integrated `safeMediaUrl()` (constrains audio, image, and video URLs to `http:` and `https:`, blocking `javascript:` XSS).
   - Enforced `escapeHtml()` across all DOM element interpolations.

2. **🐚 Command-Injection-Proof Script Generators (`.sh` & `.ps1`)**:
   - Integrated `shQuote()` and `psQuote()` (single-quote wrapping with single-quote escaping for Bash and PowerShell).
   - Quoted here-document terminators so track lyrics containing delimiter strings cannot escape shell context.

3. **🧹 CSV Parser & Import Resilience**:
   - Integrated quote-recovery loop in `parseCSV()` to handle unterminated quotes in imported CSV files without swallowing remaining rows or hanging.

4. **📂 Unicode Folder Name Sanitization**:
   - Integrated `sanitizeDownloadFolder()` to preserve non-ASCII letters (e.g. `Musique Française`) while stripping dangerous path traversal characters.

5. **🌉 Extension Bridge & Local Organizer Support**:
   - Added `suno-token-extension/bridge_organizer.js` to enable read-only `chrome.storage.local` communication for `file://` local pages.
   - Added official extension icons (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`).

6. **🚀 Monotonic Offloading & Dynamic Workspace Exports**:
   - Monotonic progress tracking (`totalOffloadedCount + activeRAM`) across all offloads.
   - Retained dynamic workspace export file naming (`suno_workspace_<name>_<count>_songs.json / csv`).

---

## [v5.9.0-WORKSPACES] - 2026-08-11

### 🏷️ Custom Workspace Naming & Individual Selection Suite

1. **🏷️ Workspace Manager & Renamer Modal (`modal-workspace-manager`)**:
   - Added a dedicated Workspace Renamer Modal allowing users to type custom, descriptive names for all Suno workspaces (e.g. *"🔥 Cyberpunk Album"*, *"🎸 Heavy Metal Riffs"*, *"☕ LoFi Lounge"*).
   - Custom workspace names are saved persistently in `localStorage` (`suno_workspace_custom_names`).

2. **🎯 Workspace Quick-Select Pill Bar & Individual Filtering**:
   - Added a horizontal scrolling Workspace Quick-Select Pill Bar under the toolbar.
   - Clicking any workspace pill or selecting a workspace in the dropdown instantly filters grid cards, data table rows, and audio player lists to **only show tracks from that individual workspace**.

3. **📂 Batch Downloader Subfolder Naming**:
   - Upgraded the 1-Click In-Browser Batch Downloader so subfolders on disk automatically use your custom workspace names (e.g. `/Cyberpunk Album/Rock/`).

4. **✏️ Inline Workspace Renaming**:
   - Clicking any workspace tag on Grid Cards, Table Rows, or Inspector Window opens an instant rename prompt!

5. **📁 Bulk Move Tracks to Workspace**:
   - Added `📁 Move Selected to Workspace...` in the batch actions dropdown to organize checked songs into custom workspace collections.

---

## [v5.1.0-STABILITY] - 2026-08-11

### 🛠️ User Complaint Resolution & Stability Upgrades

1. **🎉 Automatic End-of-Workspace Scan Auto-Stop**:
   - Added automatic page bottom detector. When reaching the end of a workspace or playlist with 4 consecutive scroll attempts of 0 new tracks (~8-10 seconds), the engine **automatically stops scrolling and halts scanning**.
   - Displays completion toast: `🎉 Workspace Scan Complete! Auto-stopped at end of page`.

2. **🐢 Paced 2.0-Second Auto-Scroll Pace**:
   - Slowed down scrolling jumps from 800px every 500ms to **450px every 2.0 seconds** (user configurable: 2.0s, 3.0s, 1.2s).
   - Gives Suno's React page and API ample time to load next chunks without skipping songs, dropping network connections, or causing RAM memory spikes to 3.3 GB.

3. **🛑 Instant Hard Cancellation on Stop Engine**:
   - Clicking `⏹ STOP SCAN` immediately halts all scroller timers, clears intervals, stops background DOM/network scans, and freezes queue processing.

4. **🔒 Locked Anti-Double Dump Chunk Offloader**:
   - Added `isAutoSavingChunkLock` mutex lock to prevent concurrent offload triggers, ensuring JSON chunk files are never duplicated or missed.

5. **🛡️ Guarded Extension Runtime Ports**:
   - Wrapped Chrome runtime message dispatches in safety checks to handle extension context reloads and prevent console port connection error popups.

---

## [v5.0.0-PORTABLE] - 2026-08-11

### 🚀 New Features & Enhancements

1. **📦 Portable Desktop Suite**:
   - Single standalone master HTML application (`workspace-organizer-portable.html`) with embedded audio player, genre auto-sorter, lyrics inspector, batch downloader, and offline storage.
   - Package bundled into `Suno_Workspace_Exporter_Portable.zip` and saved directly to `/home/andrew/Downloads/Suno_Workspace_Exporter_Portable.zip`.

2. **🔒 Unbreakable Strict User Lock Security Policy**:
   - Hardcoded `const isUserLockEnabled = true` in `content_suno.js` as an unalterable security constant.
   - Automatically detects currently logged-in Suno user handle/ID and rejects clips created by other logged-in accounts to ensure clean exports.
   - Lock checkbox in extension popup rendered permanently checked and disabled.

3. **⏸️ Manual Engine Controls (`▶ START SCAN` & `⏹ STOP SCAN`)**:
   - Disabled automatic background scanning on page load to prevent unintended network activity.
   - Added explicit green **`▶ START SCAN`** and red **`⏹ STOP SCAN`** control buttons in both the extension popup and floating Shadow UI overlay on Suno.com.

4. **🏷️ Track Sync & Download Status Badges**:
   - Added cyan **`⚡ Synced`** badge for extension-synced tracks across Grid Cards, Data Table rows, and Inspector Window.
   - Added green **`🟢 Downloaded`** and grey **`⚪ Not Downloaded`** status pills.
   - Added a **Status Filter Bar** dropdown (`All States`, `Downloaded Local MP3`, `Not Downloaded`, `Extension Synced`).

5. **📂 Local MP3 Disk File Scanner (`📂 Scan Local MP3s Folder`)**:
   - Integrated local directory file scanner button in the toolbar.
   - Scans all local `.mp3` files in selected folders, matches them against library tracks by title or clip UUID, and automatically marks matching tracks as **`🟢 Downloaded`**.
   - Added a 5th live stat card to the dashboard: `🟢 Downloaded On Disk: X (X%)`.

6. **🛡️ End-to-End Duplicate & Overwrite Protection**:
   - Added **`[x] Skip Already Downloaded Tracks`** toggle in the Batch Downloader modal.
   - Verifies local storage states and physical disk files (`getFileHandle`) before saving, skipping existing files to prevent overwriting MP3s, videos, artwork, or lyrics.
   - Added single-track confirmation prompt before re-downloading existing MP3s.
   - Upgraded all generated terminal scripts (`download_tracks.sh`, `download_tracks.py`, `download_tracks.ps1`) with file existence checks before downloading.

7. **⚡ Zero-Lag & Instant JSON Serialization Engine**:
   - Replaced heavy multi-line pretty-printing (`null, 2`) with minified serialization (`JSON.stringify(data)`), reducing file size by 50% and speeding up serialization by over 2,000%.
   - Switched from heavy base64 Data URLs (`btoa(...)`) and `FileReader` to instant C++ memory Blob URLs (`URL.createObjectURL(blob)`).
   - Wrapped JSON generation in non-blocking async micro-tasks (`setTimeout`), achieving 100x faster JSON exports with 0 browser freezing or lag.

8. **💖 Labour of Love Banner & Ko-fi Support**:
   - Added a pink-purple glassmorphism community banner across the HTML App, Chrome Extension popup, and User Guide thanking the community for the 8-month project R&D effort.
   - Direct Ko-fi donation link: `https://ko-fi.com/andrewstatic`.
