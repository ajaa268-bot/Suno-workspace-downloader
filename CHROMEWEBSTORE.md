# Chrome Web Store Listing — Suno Workspace Exporter v7.1 Ultimate Edition

> Last Updated: 2026-08-12

## Store Listing

**Extension Name**: Suno Workspace Exporter
<!-- Must match manifest.json "name". Max 75 characters. -->

**Short Description**: Universal Exporter, Batch Downloader & Bridge for Suno AI music workspaces and Portable Organizer Suite.
<!-- Max 132 characters. Shown in search results and tiles. -->

**Detailed Description**:
Suno Workspace Exporter is a lightweight, high-performance browser extension designed to help creators backup, organize, and export their generated Suno AI music tracks.

Key Features:
- Real-time track capture and automatic JSON export for logged-in Suno creator accounts.
- Continuous auto-scrolling engine with rate-limit keep-alive protection.
- High-efficiency memory sanitization keeping RAM footprint below 5 MB during 10,000+ track scans.
- Seamless Web Bridge integration with the Portable Organizer Suite (`workspace-organizer-portable.html`).
- Mandatory security lock preventing unauthorized access to external user tracks.

How to Use:
1. Open Suno.com and sign in to your creator account.
2. Click the Suno Workspace Exporter icon in your toolbar.
3. Click "Start Scan" to auto-scroll and capture your library into local JSON backups.
4. Open the Portable Organizer Suite to sort by Created Date, filter genres, or batch download MP3s.

Privacy & Security:
Suno Workspace Exporter operates 100% locally inside your browser. No personal data, credentials, or music files are transmitted to external servers.

Support:
Visit our GitHub repository for support and user guides: https://github.com/ajaa268-bot/Suno-workspace-downloader

**Category**: Developer Tools / Productivity

**Single Purpose**: Captures, exports, and organizes personal AI music track metadata from Suno creator workspaces into local JSON and MP3 backup files.

**Primary Language**: English


## Permissions Justification

Every permission in `manifest.json` is strictly scoped to core user functionality:

| Permission | Type | Justification |
|------------|------|---------------|
| `cookies` | permissions | Reads session context from Suno.com to verify logged-in account identity for security locking. |
| `storage` | permissions | Stores user preferences, captured track metadata chunks, and checkpoint resume states locally. |
| `unlimitedStorage` | permissions | Prevents storage quota errors when backing up large 10,000+ track music libraries locally. |
| `downloads` | permissions | Triggers local JSON chunk offloads and MP3 audio downloads to the user's Downloads folder. |
| `scripting` | permissions | Programmatically injects `content_suno.js` into Suno tabs to enable auto-scrolling and page scanning. |
| `https://*.suno.com/*` | host_permissions | Restricted scope required to capture track feed metadata and detect active workspace views. |
| `https://*.suno.ai/*` | host_permissions | Restricted scope required to resolve direct audio CDN links (`cdn1.suno.ai`). |
| `https://studio-api.prod.suno.com/*` | host_permissions | Restricted scope required to enrich track lyrics, style tags, and high-res artwork. |
| `https://clerk.suno.com/*` | host_permissions | Restricted scope required to verify account authentication tokens securely. |


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No (Data is processed strictly on-device in local browser storage).

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Authentication info | Local Only | No | Verification | No |
| Website content | Local Only | No | Track Backup | No |
| User activity | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties.
- [x] Data is NOT used for purposes unrelated to the extension's core functionality.
- [x] Data is NOT used for creditworthiness or lending purposes.


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 7.1 | 2026-08-12 | Manifest V3 compliance, Service Worker Async Download fix, Infinite Scroller, 95% RAM Reduction | Ready |

