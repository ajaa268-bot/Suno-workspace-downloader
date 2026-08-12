# 📖 Plain English User Guide: Suno Extension & Workspace Organizer

Welcome! This guide explains in simple, step-by-step instructions how to install and use the **Chrome Extension** to capture all your Suno songs without crashing your computer, and how to use the **Workspace Organizer Web Page** (`workspace-organizer-portable.html`) to view, sort, play, and download your music.

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

## 🛠️ Part 1: How to Install the Extension in Chrome (One-Time Setup)

1. **Open Chrome Extension Settings**:
   - Open Google Chrome.
   - In the top address bar, type `chrome://extensions` and press **Enter**.

2. **Turn On Developer Mode**:
   - In the top right corner of the Extensions page, switch the toggle button for **"Developer mode"** to **ON**.

3. **Load the Extension**:
   - Click the button near the top left that says **"Load unpacked"**.
   - Browse to your folder: `auxplaylist_insights/suno-token-extension`
   - Click **Select Folder**.
   - You will now see **Standalone Suno Workspace Exporter v7.0 Ultimate Edition** listed in your extensions!

4. **Pin the Extension to Your Toolbar**:
   - Click the small **Puzzle Piece icon** 🧩 in the top-right corner of Chrome.
   - Find **Suno Token & Workspace Exporter** and click the **Pin 📌** icon so it stays visible on your toolbar.

---

## 🚀 Part 2: How to Capture Your Suno Songs (Hands-Free & Crash-Proof)

### Step 1: Open Suno.com
1. Go to [https://suno.com](https://suno.com) and make sure you are logged in to your account.
2. Go to **Library** or **Create** page (or open any specific Workspace playlist you want to download).

### Step 2: Open the Extension & Check Your Settings
1. Click the **Suno Extension Icon 🧩** on your Chrome toolbar.
2. In the menu that pops up, make sure these boxes are checked:
   - ✅ **🔒 Strict User Lock**: Locks scanning strictly to your currently logged-in account. Ignores any other user's songs!
   - ✅ **🔒 Only My Personal Tracks**: Excludes public explore feed songs so only your songs are captured.
   - ✅ **💾 Continuous Auto-Offload to Disk**: Automatically saves JSON files to your computer as it scrolls.
   - ✅ **⚡ Purge Memory Buffer After Offload**: Clears saved songs from computer RAM memory so Chrome never freezes or bogs down!
   - ✅ **🛡️ Auto-Heal & Auto-Resume Tab Crashes**: If Suno reloads or crashes, it automatically recovers and keeps scrolling.
3. Select your **Chunk Threshold**:
   - Recommended: **500 Songs / Chunk** or **1,000 Songs / Chunk**.

### Step 3: Start & Stop Scanning on Demand
1. **No Automatic Scanning on Page Load**: When you open Suno, the extension starts in `🔴 IDLE` mode so it won't scan or download anything automatically!
2. Click **`▶ START SCAN`** (in the popup or bottom-left overlay on Suno.com) to begin capturing your logged-in account's library.
3. Click **`⏹ STOP SCAN`** at any time to halt scanning, auto-scrolling, and file downloads immediately.
4. **What happens automatically while active**:
   - Every time it reaches 500 or 1,000 songs, Chrome automatically saves a file to your Downloads folder: `Downloads/SunoExports/suno_workspace_export_part_1.json`, `part_2.json`, `part_3.json`, etc.

---

## 📍 Part 3: What to Do If You Stop or If Suno Crashes? (Resume Scan)

If you close your browser, pause scrolling, or if Suno reloads:
1. Open Suno.com again.
2. Click the **Suno Extension Icon 🧩**.
3. Look at the top box labeled **📍 Checkpoint Resume Memory**:
   - It shows the exact **Last Workspace** and **Last Song** you captured!
4. Click the blue button: **`📍 RESUME SCAN FROM LAST SONG & WORKSPACE`**.
5. The extension will automatically open your last workspace page and resume scrolling right after the last song you saved!

---

## 🎧 Part 4: How to Use the Portable Workspace Organizer Web Page

The **Workspace Organizer** is your single master web app to search, sort, play, inspect lyrics, and download your music.

### Step 1: Open the Organizer Page
- Double-click `workspace-organizer-portable.html` in your project folder, or open it in any web browser!

### Step 2: Import Your Captured Songs
There are 2 super easy ways to load your songs:
- **Option A (Instant Extension Sync)**: Click **`⚡ Sync Active Chrome Extension Buffer`** at the top.
- **Option B (Load Offloaded JSON Files)**: Drag-and-drop all your saved `suno_workspace_export_part_*.json` files directly into the big box that says **`📥 Drag & Drop files here`**, or click **`⚡ Import Manifest JSON`** and select all your part files at once!

### Step 3: Organize Your Songs into Genre Categories
1. **Auto-Sort Genres**: Click the purple button **`⚡ Auto-Sort Genres`**. The organizer will read the style tags of every song and automatically place them into **Rock 🎸**, **Pop 🎤**, **Metal ⚡**, **Acoustic 🎻**, **Electronic 🎹**, **Ambient 🌌**, **Jazz 🎷**, **Country 🤠**, or **Favorites ⭐**!
2. **Category Tabs**: Click any category tab at the top (e.g. `Rock (45)`) to view only songs in that category.
3. **Genre Distribution Bar**: The colorful bar under the tabs shows you what percentage of your library belongs to each genre!

### Step 4: Play Music & Inspect Full Lyrics
1. Click **`▶ Play`** on any song card or table row to listen in the sticky bottom music player!
2. Click any song card to view its **Top Inspector Studio**:
   - Shows full lyrics with section markers (`[Intro]`, `[Chorus]`, `[Verse]`).
   - Shows style prompt and sonic DNA tags.
   - Click **`🌐 Open Suno Page`** to open that song's live web page on Suno.com in a new tab!

### Step 5: Exporting & Batch Downloading
- **Download Single Song Audio**: Click **`🎵 MP3`** on any card.
- **Download Single Song Lyrics**: Click **`📜 Lyrics`** to save a `.txt` file of the lyrics.
- **Download Single Song Style**: Click **`🏷️ Style`** to save a `.txt` file of the style prompt.
- **Batch Download Entire Category**: Select check boxes (or click **Select All**), then click **`⚡ Select Target Folder & Batch Download`** to save MP3s, lyrics, and styles into your computer's local folder all at once!
- **Export M3U Playlist**: Click **`Export M3U Playlist`** to create a playlist file for VLC or media players!

### Step 6: Scan Local Disk Folder for Downloaded MP3s
1. Click **`📂 Scan Local MP3s Folder`** in the toolbar.
2. Pick your local music folder or Downloads folder where your Suno audio files are stored.
3. The app will scan all your local MP3 files, match them by title or clip ID, and automatically mark all matching tracks as **`🟢 Downloaded`**!

---

## 💡 Pro Tips & Tooltips

- **Hover over any button**: Every button in the extension and web app has a dark tooltip that pops up to tell you exactly what that button does when you hover over it with your mouse!
- **Zero RAM Bloat**: Leaving **Continuous Auto-Offload** and **Purge Memory Buffer** checked ensures you can capture 100,000+ songs overnight without your computer slowing down!

---

## 📋 Recent Updates & Changelog (v5.0.0-PORTABLE)

- **Unbreakable Strict User Lock**: Hardcoded user lock so only songs created by the currently logged-in account are scanned.
- **Manual Engine Control**: Added green `▶ START SCAN` and red `⏹ STOP SCAN` buttons to prevent auto-scanning on load.
- **Track Status Badges**: Added visual badges for `⚡ Synced` and `🟢 Downloaded` / `⚪ Not Downloaded`.
- **Local MP3 Disk Scanner**: Added `📂 Scan Local MP3s Folder` to scan local disk folders and mark matching tracks as `🟢 Downloaded`.
- **End-to-End Overwrite Prevention**: Skip downloading existing files in batch downloading, single downloads, and terminal scripts.
- **Zero-Lag JSON Export**: Instant minified JSON generation using Blob object URLs (`URL.createObjectURL(blob)`).
- **Labour of Love Banner**: Added community banner with Ko-fi support link (`https://ko-fi.com/andrewstatic`).
