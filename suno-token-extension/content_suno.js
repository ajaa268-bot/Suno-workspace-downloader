// Standalone Suno Workspace Exporter - Content Script
// 4-Layer Bulletproof Capture Engine with Monotonic Storage Merger & Automatic Chunk-Threshold Auto-Save (Up to 60k tracks)
(function() {
  window.__sunoSessionClips = window.__sunoSessionClips || new Map();
  let autoScrollInterval = null;
  let isAutoScrolling = false;

  let lastAutoSavedCount = 0;
  let autoSaveChunkSize = 1000; // Default: Auto-save to disk every 1,000 songs
  let isAutoSaveEnabled = true;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function isUUID(str) {
    return typeof str === 'string' && UUID_REGEX.test(str.trim());
  }

  // Load preferences and restore captured clips from chrome.storage.local
  let totalOffloadedCount = 0;
  let partCounter = 1;
  let isAutoPurgeRAM = true;
  let isCaptureEngineActive = false; // MUST be started manually by user! Default inactive.
  const isUserLockEnabled = true; // MANDATORY SECURITY LOCK: Permanently enforced!
  let loggedInUser = null;

  function detectLoggedInUser() {
    try {
      const nextEl = document.getElementById('__NEXT_DATA__');
      if (nextEl) {
        const json = JSON.parse(nextEl.textContent);
        const u = json?.props?.pageProps?.user || json?.props?.pageProps?.profile || json?.query?.user;
        if (u && (u.id || u.handle)) {
          loggedInUser = { id: u.id || '', handle: u.handle || '', display_name: u.display_name || '' };
          return loggedInUser;
        }
      }
    } catch(e){}

    try {
      if (window.Clerk && window.Clerk.user) {
        const cu = window.Clerk.user;
        loggedInUser = {
          id: cu.id || '',
          handle: cu.username || cu.primaryEmailAddress?.emailAddress || '',
          display_name: cu.fullName || cu.firstName || ''
        };
        return loggedInUser;
      }
    } catch(e){}

    try {
      const root = document.getElementById('__next') || document.body;
      const key = Object.keys(root).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
      if (key) {
        let fiber = root[key];
        let depth = 0;
        while (fiber && depth < 30) {
          const props = fiber.memoizedProps;
          if (props && props.user && (props.user.id || props.user.handle)) {
            const u = props.user;
            loggedInUser = { id: u.id || '', handle: u.handle || '', display_name: u.display_name || '' };
            return loggedInUser;
          }
          fiber = fiber.child || fiber.sibling;
          depth++;
        }
      }
    } catch(e){}

    return loggedInUser;
  }

  // Load preferences and restore captured clips from chrome.storage.local
  function restoreStorageAndPrefs() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['suno_captured_clips', 'exporter_opts', 'offloaded_total_count', 'part_counter'], (result) => {
          if (result && result.exporter_opts) {
            autoSaveChunkSize = parseInt(result.exporter_opts.chunkSize, 10) || 1000;
            isAutoSaveEnabled = result.exporter_opts.autoSaveEnabled !== false;
            isAutoPurgeRAM = result.exporter_opts.autoPurgeRAM !== false;
            if (result.exporter_opts.scrollPace) {
              autoScrollPaceMs = parseInt(result.exporter_opts.scrollPace, 10) || 2000;
            }
          }
          if (result && typeof result.offloaded_total_count === 'number') {
            totalOffloadedCount = result.offloaded_total_count;
          }
          if (result && typeof result.part_counter === 'number') {
            partCounter = result.part_counter;
          }

          if (result && result.suno_captured_clips) {
            const loaded = result.suno_captured_clips;
            let count = 0;
            for (const clip of loaded) {
              const id = clip.id || clip.clip_id;
              if (id && !window.__sunoSessionClips.has(id)) {
                window.__sunoSessionClips.set(id, clip);
                count++;
              }
            }
            console.log(`[Suno Exporter] Restored ${count} tracks in active RAM. (Total Offloaded on Disk: ${totalOffloadedCount})`);
            updateShadowUIBadge();
          }
        });
      }
    } catch (e) {
      console.warn('[Suno Exporter] Storage restore warning:', e);
    }
  }

  restoreStorageAndPrefs();

  // Debounced monotonic save to chrome.storage.local
  let saveTimeout = null;
  function syncStorageDebounced() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['suno_captured_clips'], (result) => {
            const existingInStorage = result ? (result.suno_captured_clips || []) : [];
            
            for (const clip of existingInStorage) {
              const id = clip.id || clip.clip_id;
              if (id && !window.__sunoSessionClips.has(id)) {
                window.__sunoSessionClips.set(id, clip);
              }
            }

            const mergedArray = Array.from(window.__sunoSessionClips.values()).slice(0, 60000);
            chrome.storage.local.set({ 
              'suno_captured_clips': mergedArray,
              'offloaded_total_count': totalOffloadedCount,
              'part_counter': partCounter
            }, () => {
              if (chrome.runtime.lastError) {
                console.warn('[Suno Exporter] Storage save error:', chrome.runtime.lastError);
              }
              updateShadowUIBadge();
            });
          });
        }
      } catch(e) {}
    }, 800);
  }

  // Automatic Continuous Chunk Threshold Auto-Offloader (Offloads to disk & purges memory buffer)
  let isAutoSavingChunkLock = false;
  let lastOffloadTime = 0;

  function checkAndAutoSaveChunk() {
    if (!isAutoSaveEnabled || isAutoSavingChunkLock || !isCaptureEngineActive) return;
    if (Date.now() - lastOffloadTime < 5000) return; // Enforce 5s minimum cooldown between auto-saves

    const activeRamSize = window.__sunoSessionClips.size;
    const unsavedCount = isAutoPurgeRAM ? activeRamSize : (activeRamSize - lastAutoSavedCount);
    
    if (unsavedCount >= autoSaveChunkSize && activeRamSize > 0) {
      isAutoSavingChunkLock = true;
      lastOffloadTime = Date.now();

      const allClips = Array.from(window.__sunoSessionClips.values());
      const chunkData = allClips.slice(0, autoSaveChunkSize);
      const currentPart = partCounter;

      const wsName = scrapeActiveWorkspaceName(window.location.href);
      const cleanWsName = wsName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Workspace';
      const prefix = `suno_workspace_${cleanWsName}`;

      // Mark progress immediately to prevent duplicate triggers
      partCounter++;
      totalOffloadedCount += chunkData.length;
      if (!isAutoPurgeRAM) {
        lastAutoSavedCount = window.__sunoSessionClips.size;
      }

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: "AUTO_SAVE_CHUNK",
            chunkData: chunkData,
            partNum: currentPart,
            subfolder: 'SunoExports',
            prefix: prefix
          }, (response) => {
            isAutoSavingChunkLock = false;
            noNewClipsScrollAttempts = 0;
            lastCapturedCountForScroll = totalOffloadedCount + window.__sunoSessionClips.size;

            if (isAutoPurgeRAM) {
              // Purge offloaded clips from RAM memory to prevent memory accumulation
              for (const clip of chunkData) {
                const id = clip.id || clip.clip_id;
                if (id) window.__sunoSessionClips.delete(id);
              }
              lastAutoSavedCount = 0;
              const remainingArray = Array.from(window.__sunoSessionClips.values());
              if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ 
                  'suno_captured_clips': remainingArray,
                  'offloaded_total_count': totalOffloadedCount,
                  'part_counter': partCounter
                }, () => {
                  updateShadowUIBadge();
                });
              }
              showToastNotice(`💾 Offloaded Part ${currentPart} (${chunkData.length} songs) to SunoExports/! RAM Purged (0MB Bloat)`);
            } else {
              if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ 
                  'offloaded_total_count': totalOffloadedCount,
                  'part_counter': partCounter
                });
              }
              showToastNotice(`💾 Auto-Saved Part ${currentPart} (${chunkData.length} songs) to disk!`);
            }
          });
        } else {
          isAutoSavingChunkLock = false;
        }
      } catch(err) {
        isAutoSavingChunkLock = false;
      }
    }
  }

  // Automatic Workspace Finished Offloader (Dumps captured workspace to disk upon scan completion)
  let isWorkspaceOffloadingLock = false;

  function offloadActiveWorkspaceToDisk(reason = 'scan_completed') {
    if (isWorkspaceOffloadingLock) return;
    const clips = Array.from(window.__sunoSessionClips.values());
    if (!clips || clips.length === 0) return;

    isWorkspaceOffloadingLock = true;
    const wsName = scrapeActiveWorkspaceName(window.location.href);
    const cleanWsName = wsName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Workspace';
    const prefix = `suno_workspace_${cleanWsName}_${clips.length}_songs`;

    console.log(`[Workspace Auto-Offloader] Workspace scan finished (${reason}). Auto-offloading ${clips.length} tracks to disk...`);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: "AUTO_SAVE_CHUNK",
        chunkData: clips,
        partNum: partCounter,
        subfolder: 'SunoExports',
        prefix: prefix
      }, (resp) => {
        isWorkspaceOffloadingLock = false;
        partCounter++;
        totalOffloadedCount += clips.length;
        
        if (resp && resp.success) {
          showToastNotice(`🎉 Workspace Finished! Auto-offloaded ${clips.length.toLocaleString()} songs to SunoExports/${resp.filename || prefix + '.json'}`);
        } else {
          triggerDirectBlobDownload(clips, `${prefix}.json`);
          showToastNotice(`🎉 Workspace Finished! Auto-downloaded ${clips.length.toLocaleString()} songs to disk (${prefix}.json)`);
        }
        updateShadowUIBadge();
      });
    } else {
      isWorkspaceOffloadingLock = false;
      triggerDirectBlobDownload(clips, `${prefix}.json`);
      showToastNotice(`🎉 Workspace Finished! Auto-downloaded ${clips.length.toLocaleString()} songs to disk (${prefix}.json)`);
      updateShadowUIBadge();
    }
  }

  function triggerDirectBlobDownload(data, fileName) {
    try {
      const jsonStr = JSON.stringify(data);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
    } catch(e){}
  }

  function showToastNotice(msg) {
    let toast = document.getElementById('suno-exporter-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'suno-exporter-toast';
      toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 2147483647; background: #0f172a; border: 2px solid #10b981; color: #34d399; padding: 12px 18px; border-radius: 12px; font-family: system-ui, sans-serif; font-size: 13px; font-weight: bold; box-shadow: 0 8px 25px rgba(0,0,0,0.8); transition: opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }

  function getActiveWid(sourceUrl) {
    try {
      if (sourceUrl && (sourceUrl.includes('/feed') || sourceUrl.includes('/explore') || sourceUrl.includes('/trending'))) {
        return 'Public Explore Feed';
      }
      const urlMatch = window.location.href.match(/[?&](wid|workspace_id|project_id|playlist_id)=([a-f0-9-]{36})/i);
      if (urlMatch) return `Workspace ${urlMatch[2].substring(0,8)}`;
      const pathMatch = window.location.pathname.match(/\/(workspace|project|playlist)\/([a-f0-9-]{36})/i);
      if (pathMatch) return `Workspace ${pathMatch[2].substring(0,8)}`;

      const namedPathMatch = window.location.pathname.match(/\/(workspace|project|playlist)\/([a-zA-Z0-9_%-]+)/i);
      if (namedPathMatch) {
        const rawName = decodeURIComponent(namedPathMatch[2]).replace(/[-_]/g, ' ');
        return rawName.charAt(0).toUpperCase() + rawName.slice(1);
      }

      if (window.location.pathname.includes('/me') || window.location.pathname.includes('/library') || window.location.pathname.includes('/create')) {
        return 'My Personal Library';
      }
    } catch(e){}
    return 'Public Explore Feed';
  }

  function extractArtist(clip, existingArtist) {
    if (!clip && !existingArtist) return 'Suno Creator';
    
    const candidate = clip?.display_name || clip?.handle || clip?.artist || clip?.creator || clip?.user_name ||
                      clip?.user_display_name || clip?.user?.display_name || clip?.user?.handle ||
                      clip?.profile?.display_name || clip?.profile?.handle || clip?.metadata?.artist ||
                      clip?.metadata?.display_name || clip?.metadata?.handle;
                      
    if (typeof candidate === 'string' && candidate.trim().length > 0 && candidate !== 'Suno Creator' && candidate !== 'Unknown') {
      let cleaned = candidate.trim();
      if (!cleaned.startsWith('@') && clip?.handle && clip.handle.startsWith('@')) {
        return `${cleaned} (${clip.handle})`;
      }
      return cleaned;
    }

    if (existingArtist && typeof existingArtist === 'string' && existingArtist.trim().length > 0 && existingArtist !== 'Suno Creator' && existingArtist !== 'Unknown') {
      return existingArtist.trim();
    }

    return 'Suno Creator';
  }

  function extractTitle(clip, existingTitle) {
    if (!clip && !existingTitle) return 'Untitled Track';

    const candidate = clip?.title || clip?.name || clip?.song_name || clip?.metadata?.title;
    if (typeof candidate === 'string' && candidate.trim().length > 0 && candidate !== 'Suno Track' && candidate !== 'Untitled Track' && candidate !== 'Play') {
      return candidate.trim();
    }

    if (existingTitle && typeof existingTitle === 'string' && existingTitle.trim().length > 0 && existingTitle !== 'Suno Track' && existingTitle !== 'Untitled Track' && existingTitle !== 'Play') {
      return existingTitle.trim();
    }

    return 'Untitled Track';
  }

  function extractLyrics(clip) {
    if (!clip) return 'No lyrics provided for this track.';
    if (clip.metadata && typeof clip.metadata.prompt === 'string' && clip.metadata.prompt.trim().length > 0) {
      return clip.metadata.prompt.trim();
    }
    if (typeof clip.lyrics === 'string' && clip.lyrics.trim().length > 0 && clip.lyrics !== 'Exported from workspace view.') {
      return clip.lyrics.trim();
    }
    if (typeof clip.prompt === 'string' && clip.prompt.trim().length > 0) {
      return clip.prompt.trim();
    }
    if (clip.metadata && typeof clip.metadata.gpt_description_prompt === 'string') {
      return clip.metadata.gpt_description_prompt.trim();
    }
    return 'No lyrics provided for this track.';
  }

  function extractStyleTags(clip) {
    if (!clip) return 'None';
    if (clip.metadata && typeof clip.metadata.tags === 'string' && clip.metadata.tags.trim().length > 0) {
      return clip.metadata.tags.trim();
    }
    if (typeof clip.style === 'string' && clip.style.trim().length > 0 && clip.style !== 'Suno Track' && clip.style !== 'None') {
      return clip.style.trim();
    }
    if (typeof clip.tags === 'string' && clip.tags.trim().length > 0) {
      return clip.tags.trim();
    }
    return 'None';
  }

  function extractImageUrl(clip, id) {
    if (clip) {
      if (clip.image_large_url) return clip.image_large_url;
      if (clip.image_url) return clip.image_url;
      if (clip.avatar_image_url) return clip.avatar_image_url;
    }
    return id ? `https://cdn2.suno.ai/image_large_${id}.jpeg` : 'https://cdn2.suno.ai/default.jpeg';
  }

  function extractVideoUrl(clip, id) {
    if (clip && clip.video_url) return clip.video_url;
    return id ? `https://cdn1.suno.ai/${id}.mp4` : '';
  }

  // Deep object clip finder
  function isRealSongClip(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const id = obj.id || obj.clip_id || obj.song_id;
    if (!id || typeof id !== 'string') return false;
    
    if (obj.object_type === 'user' || obj.object_type === 'workspace' || obj.type === 'user' || obj.clerk_id) return false;

    const hasAudio = !!(obj.audio_url || obj.video_url || obj.image_url || obj.image_large_url);
    const hasMeta = !!(obj.metadata || obj.major_model_version || obj.model || obj.gpt_description_prompt || obj.title || obj.prompt || obj.tags);
    const hasStatus = !!(obj.status && (obj.status === 'complete' || obj.status === 'streaming' || obj.status === 'error' || obj.status === 'submitted'));

    return hasAudio || hasMeta || hasStatus;
  }

  function findClipsArray(obj, depth = 0) {
    if (!obj || depth > 12) return [];
    let clips = [];

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      if (isRealSongClip(obj)) {
        return [obj];
      }
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object') {
          if (item.clip && typeof item.clip === 'object' && isRealSongClip(item.clip)) {
            clips.push(item.clip);
          } else if (isRealSongClip(item)) {
            clips.push(item);
          } else {
            const nested = findClipsArray(item, depth + 1);
            if (nested.length > 0) clips.push(...nested);
          }
        }
      }
      if (clips.length > 0) return clips;
    }

    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key === 'user' || key === 'profile' || key === 'window' || key === 'clerk') continue;
        const val = obj[key];
        if (val && typeof val === 'object') {
          const nested = findClipsArray(val, depth + 1);
          if (nested.length > 0) clips.push(...nested);
        }
      }
    }

    return clips;
  }

  function scrapeActiveWorkspaceName(sourceUrl = '') {
    // 1. Check Next.js __NEXT_DATA__
    try {
      const nextEl = document.getElementById('__NEXT_DATA__');
      if (nextEl) {
        const json = JSON.parse(nextEl.textContent);
        const pp = json?.props?.pageProps;
        const wsName = pp?.workspace?.name || pp?.playlist?.name || pp?.playlist?.title || pp?.project?.name || pp?.folder?.name;
        if (wsName && typeof wsName === 'string' && wsName.trim()) {
          return wsName.trim();
        }
      }
    } catch(e){}

    // 2. Check React Fiber Tree for workspace / playlist props
    try {
      const root = document.getElementById('__next') || document.body;
      const key = Object.keys(root).find(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
      if (key) {
        let fiber = root[key];
        let depth = 0;
        while (fiber && depth < 35) {
          const props = fiber.memoizedProps;
          if (props) {
            const wsName = props.workspace?.name || props.playlist?.name || props.playlist?.title || props.project?.name || props.folder?.name;
            if (wsName && typeof wsName === 'string' && wsName.trim()) {
              return wsName.trim();
            }
          }
          fiber = fiber.child || fiber.sibling;
          depth++;
        }
      }
    } catch(e){}

    // 3. Scrape DOM Header <h1> or workspace title element
    try {
      const h1Els = document.querySelectorAll('h1, [class*="workspace-title"], [class*="playlist-title"], [class*="header-title"]');
      for (const h1 of h1Els) {
        const txt = (h1.textContent || '').trim();
        if (txt && txt.length > 1 && txt.length < 80 && !txt.toLowerCase().includes('suno ai') && txt !== 'Create' && txt !== 'Library' && txt !== 'Explore') {
          return txt;
        }
      }
    } catch(e){}

    // 4. Scrape from Document Title
    try {
      if (document.title && document.title.includes('|')) {
        const parts = document.title.split('|');
        const main = parts[0].trim();
        if (main && main !== 'Suno' && main !== 'Create' && main !== 'Library') {
          return main;
        }
      }
    } catch(e){}

    // 5. Fallback URL extraction
    try {
      const href = sourceUrl || window.location.href;
      if (href.includes('/feed') || href.includes('/explore') || href.includes('/trending')) {
        return 'Public Explore Feed';
      }
      const namedMatch = window.location.pathname.match(/\/(workspace|project|playlist)\/([a-zA-Z0-9_%-]+)/i);
      if (namedMatch) {
        const raw = decodeURIComponent(namedMatch[2]).replace(/[-_]/g, ' ');
        return raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      if (window.location.pathname.includes('/me') || window.location.pathname.includes('/library') || window.location.pathname.includes('/create')) {
        return 'My Personal Library';
      }
    } catch(e){}

    return 'My Personal Library';
  }

  function createLightweightClip(clip, existing = {}, scrapedWsName = '') {
    const id = clip.id || clip.clip_id || clip.song_id || existing.id;
    const title = extractTitle(clip, existing.title);
    const artist = extractArtist(clip, existing.artist);

    return {
      id: id,
      title: title,
      artist: artist,
      display_name: artist,
      lyrics: extractLyrics(clip) !== 'No lyrics provided for this track.' ? extractLyrics(clip) : (existing.lyrics || 'No lyrics provided for this track.'),
      prompt: extractLyrics(clip) !== 'No lyrics provided for this track.' ? extractLyrics(clip) : (existing.prompt || 'No lyrics provided for this track.'),
      style: extractStyleTags(clip) !== 'None' ? extractStyleTags(clip) : (existing.style || 'None'),
      image_url: extractImageUrl(clip, id) || existing.image_url || `https://cdn1.suno.ai/image_${id}.png`,
      audio_url: clip.audio_url || existing.audio_url || `https://cdn1.suno.ai/${id}.mp3`,
      video_url: extractVideoUrl(clip, id) || existing.video_url || `https://cdn1.suno.ai/${id}.mp4`,
      workspace: clip.workspace_name || clip.metadata?.workspace_name || clip.project_name || clip.playlist_name || existing.workspace || scrapedWsName || 'My Personal Library',
      created_at: clip.created_at || clip.createdAt || clip.created_time || existing.created_at || new Date().toISOString(),
      duration: Number(clip.duration || clip.metadata?.duration || existing.duration) || 0,
      model_name: clip.model_name || clip.major_model_version || existing.model_name || 'v3.5',
      is_liked: !!(clip.is_liked || existing.is_liked),
      is_trashed: !!(clip.is_trashed || existing.is_trashed)
    };
  }

  function captureClips(clips, targetWid, sourceUrl = '') {
    if (!isCaptureEngineActive) return 0;
    if (!clips || !Array.isArray(clips)) return 0;

    // Strict User Lock: Only capture tracks created by the logged-in account
    if (isUserLockEnabled) {
      const currUser = detectLoggedInUser();
      if (currUser && (currUser.id || currUser.handle)) {
        clips = clips.filter(clip => {
          const clipUserId = clip.user_id || clip.user?.id || clip.profile?.id || '';
          const clipHandle = clip.handle || clip.user?.handle || clip.profile?.handle || '';
          
          if (clipUserId && currUser.id && clipUserId === currUser.id) return true;
          if (clipHandle && currUser.handle && clipHandle.toLowerCase() === currUser.handle.toLowerCase()) return true;

          // Reject if explicitly from another user account
          if (clipUserId && currUser.id && clipUserId !== currUser.id) return false;
          if (clipHandle && currUser.handle && clipHandle.toLowerCase() !== currUser.handle.toLowerCase()) return false;

          return true;
        });
      }
    }

    // Strict Personal Track Filtering: Block public explore / trending feed requests!
    const isPublicFeed = sourceUrl && (
      sourceUrl.includes('/explore') || 
      sourceUrl.includes('/feed/trending') || 
      sourceUrl.includes('/playlist/public')
    );

    const activeWid = targetWid || getActiveWid(sourceUrl);
    const scrapedWsName = scrapeActiveWorkspaceName(sourceUrl);
    let newlyAdded = 0;

    for (const clip of clips) {
      if (window.__sunoSessionClips.size >= 60000) break;
      const id = clip.id || clip.clip_id || clip.song_id;
      if (id) {
        // Discard public explore feed tracks to enforce personal track capture only!
        if (isPublicFeed && !clip.is_liked && !clip.is_trashed && !clip.project_id && !clip.workspace_name) {
          continue;
        }

        const existing = window.__sunoSessionClips.get(id) || {};
        const title = extractTitle(clip, existing.title);
        const artist = extractArtist(clip, existing.artist);

        const enriched = createLightweightClip(clip, existing, scrapedWsName);

        const titleUpdated = title !== 'Untitled Track' && existing.title === 'Untitled Track';
        const artistUpdated = artist !== 'Suno Creator' && existing.artist === 'Suno Creator';

        if (!window.__sunoSessionClips.has(id) || titleUpdated || artistUpdated) newlyAdded++;
        window.__sunoSessionClips.set(id, enriched);
        queueClipForEnrichment(id);
      }
    }

    if (newlyAdded > 0) {
      updateShadowUIBadge();
      syncStorageDebounced();
      checkAndAutoSaveChunk();
    }
    return newlyAdded;
  }

  // Layer 5: Automatic Background Clip Metadata Enricher
  const enrichmentQueue = new Set();
  let isEnriching = false;

  function queueClipForEnrichment(id) {
    if (!id || !isUUID(id) || enrichmentQueue.has(id) || enrichmentQueue.size > 5000) return;
    const clip = window.__sunoSessionClips.get(id);
    if (!clip) return;

    const needsLyrics = !clip.lyrics || clip.lyrics === 'No lyrics provided for this track.' || clip.lyrics === 'No lyrics provided.';
    const needsStyle = !clip.style || clip.style === 'None';
    const needsArtist = !clip.artist || clip.artist === 'Suno Creator';

    if (needsLyrics || needsStyle || needsArtist) {
      enrichmentQueue.add(id);
      processEnrichmentQueue();
    }
  }

  async function processEnrichmentQueue() {
    if (isEnriching || enrichmentQueue.size === 0) return;
    isEnriching = true;

    while (enrichmentQueue.size > 0) {
      const ids = Array.from(enrichmentQueue).slice(0, 6);
      ids.forEach(id => enrichmentQueue.delete(id));

      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`https://studio-api.prod.suno.com/api/clip/${id}`);
          if (res.ok) {
            const clipData = await res.json();
            if (clipData && (clipData.id || clipData.title)) {
              const existing = window.__sunoSessionClips.get(id) || {};
              const enriched = createLightweightClip(clipData, existing, existing.workspace);
              window.__sunoSessionClips.set(id, enriched);
              syncStorageDebounced();
            }
          }
        } catch(e){}
      }));

      await new Promise(r => setTimeout(r, 120));
    }

    isEnriching = false;
  }

  // Scan Raw Text for JSON or UUID track matches
  function scanRawTextForClips(text, targetWid, sourceUrl = '') {
    if (!text || typeof text !== 'string') return 0;

    try {
      if (text.startsWith('{') || text.startsWith('[')) {
        const json = JSON.parse(text);
        const clips = findClipsArray(json);
        if (clips && clips.length > 0) return captureClips(clips, targetWid, sourceUrl);
      }
    } catch(e){}

    return 0;
  }

  // Layer 1: Network Fetch & XHR Interceptor
  (function interceptNetwork() {
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await origFetch.apply(this, args);
      try {
        const clone = response.clone();
        clone.text().then(text => {
          scanRawTextForClips(text);
        }).catch(() => {});
      } catch(e) {}
      return response;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('load', function() {
        try {
          if (this.responseText) {
            scanRawTextForClips(this.responseText);
          }
        } catch(e) {}
      });
      return origSend.apply(this, arguments);
    };
  })();

  // Layer 2: DOM Elements & Links Scanner
  function scanDOMForTrackElements() {
    const activeWid = getActiveWid();
    const tempClips = [];

    const links = document.querySelectorAll('a[href*="/song/"], a[href*="/clip/"], a[href*="cdn1.suno.ai"], a[href*="cdn2.suno.ai"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const match = href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) {
        const id = match[0];
        let titleText = (a.textContent || a.getAttribute('title') || '').trim();
        const parentCard = a.closest('div[class*="card"], div[class*="row"], div[class*="item"], li, tr, article, section') || a.parentElement?.parentElement || a.parentElement;
        
        let cardTitle = '';
        let creatorText = '';

        if (parentCard) {
          cardTitle = (parentCard.querySelector('.title, [class*="title"], [class*="name"], h2, h3, h4, span[class*="bold"]')?.textContent || '').trim();
          const creatorEl = parentCard.querySelector('a[href*="/@"], a[href*="/user/"], [class*="creator"], [class*="artist"], [class*="handle"], [class*="user"], [class*="by"]');
          if (creatorEl) creatorText = (creatorEl.textContent || creatorEl.getAttribute('title') || '').trim();
        }

        let finalTitle = cardTitle || titleText;
        if (finalTitle === 'Play') finalTitle = 'Untitled Track';

        tempClips.push({
          id: id,
          title: finalTitle || 'Untitled Track',
          artist: creatorText || 'Suno Creator',
          display_name: creatorText || 'Suno Creator',
          audio_url: `https://cdn1.suno.ai/${id}.mp3`,
          image_url: `https://cdn2.suno.ai/image_large_${id}.jpeg`,
          video_url: `https://cdn1.suno.ai/${id}.mp4`,
          workspace: activeWid ? `Workspace ${activeWid.substring(0,8)}` : 'Default Workspace'
        });
      }
    }

    const elements = document.querySelectorAll('[data-clip-id], [data-id], [data-song-id], img[src*="suno"], audio[src*="suno"], source[src*="suno"]');
    for (const el of elements) {
      const dataId = el.getAttribute('data-clip-id') || el.getAttribute('data-id') || el.getAttribute('data-song-id') || el.getAttribute('src') || '';
      const match = dataId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) {
        const id = match[0];
        const parentCard = el.closest('div[class*="card"], div[class*="row"], div[class*="item"], li, tr, article, section') || el.parentElement;
        let titleText = '';
        let creatorText = '';
        if (parentCard) {
          const titleEl = parentCard.querySelector('a[href*="/song/"], a[href*="/clip/"], [class*="title"], [class*="name"], h2, h3, h4');
          if (titleEl) titleText = (titleEl.textContent || '').trim();

          const creatorEl = parentCard.querySelector('a[href*="/@"], a[href*="/user/"], [class*="creator"], [class*="artist"], [class*="handle"], [class*="user"]');
          if (creatorEl) creatorText = (creatorEl.textContent || '').trim();
        }

        if (titleText === 'Play') titleText = 'Untitled Track';

        tempClips.push({
          id: id,
          title: titleText || 'Untitled Track',
          artist: creatorText || 'Suno Creator',
          display_name: creatorText || 'Suno Creator',
          audio_url: `https://cdn1.suno.ai/${id}.mp3`,
          image_url: `https://cdn2.suno.ai/image_large_${id}.jpeg`,
          video_url: `https://cdn1.suno.ai/${id}.mp4`,
          workspace: activeWid ? `Workspace ${activeWid.substring(0,8)}` : 'Default Workspace'
        });
      }
    }

    if (tempClips.length > 0) {
      captureClips(tempClips, activeWid);
    }
  }

  // Layer 3: Next.js & React Fiber Tree Scanner
  function scanDOMAndReactState() {
    const activeWid = getActiveWid();

    try {
      const nextDataEl = document.getElementById('__NEXT_DATA__');
      if (nextDataEl && nextDataEl.textContent) {
        scanRawTextForClips(nextDataEl.textContent, activeWid);
      }
    } catch(e){}

    try {
      const elements = document.querySelectorAll('main, div, section, article, table, tr');
      for (const el of elements) {
        for (const key in el) {
          if (key.startsWith('__reactFiber$') || key.startsWith('__reactProps$') || key.startsWith('__reactContainer$')) {
            const fiber = el[key];
            if (fiber) {
              const clips = findClipsArray(fiber);
              if (clips && clips.length > 0) captureClips(clips, activeWid);
            }
          }
        }
      }
    } catch(e){}

    scanDOMForTrackElements();
  }

  // Layer 4: Direct Single Song / Clip Auto-Fetcher Engine
  let lastFetchedSongId = '';
  async function checkAndFetchSingleSong() {
    try {
      const match = window.location.pathname.match(/\/(song|clip)\/([a-f0-9-]{36})/i);
      if (match && match[2] && match[2] !== lastFetchedSongId) {
        lastFetchedSongId = match[2];
        const songId = match[2];
        console.log(`[Suno Exporter] Detected single song page for clip: ${songId}`);
        const res = await fetch(`https://studio-api.prod.suno.com/api/clip/${songId}`);
        if (res.ok) {
          const clipData = await res.json();
          if (clipData && (clipData.id || clipData.title)) {
            captureClips([clipData]);
            console.log(`[Suno Exporter] Successfully captured single song metadata: "${clipData.title}" by ${clipData.display_name || clipData.handle}`);
            showToastNotice(`🎵 Scraped Song: "${clipData.title}" by ${clipData.display_name || clipData.handle || 'Suno Creator'}`);
          }
        }
      }
    } catch(e){}
  }

  setInterval(() => {
    if (isCaptureEngineActive) scanDOMAndReactState();
  }, 1500);

  setInterval(() => {
    if (isCaptureEngineActive) checkAndFetchSingleSong();
  }, 2000);

  // Message Handler
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
      sendResponse({ status: 'ok', active: isCaptureEngineActive, total: window.__sunoSessionClips.size });
      return true;
    }

    if (request.action === 'start_engine') {
      isCaptureEngineActive = true;
      detectLoggedInUser();
      scanDOMAndReactState();
      startAutoScroll();
      updateShadowUIBadge();
      showToastNotice(`🟢 Engine Started! Locked to: @${loggedInUser?.handle || 'Logged-in Account'}`);
      sendResponse({ success: true, user: loggedInUser });
      return true;
    }

    if (request.action === 'stop_engine') {
      isCaptureEngineActive = false;
      stopAutoScroll();
      updateShadowUIBadge();
      showToastNotice(`🔴 Engine Halted / Stopped.`);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'get_stats') {
      const ramCount = window.__sunoSessionClips.size;
      const grandTotal = totalOffloadedCount + ramCount;
      sendResponse({
        total: grandTotal,
        ramCount: ramCount,
        offloadedCount: totalOffloadedCount,
        isAutoScrolling: isAutoScrolling,
        isEngineActive: isCaptureEngineActive,
        lastAutoSavedCount: lastAutoSavedCount,
        activeWid: getActiveWid(),
        user: loggedInUser
      });
      return true;
    }

    if (request.action === 'update_options') {
      restoreStorageAndPrefs();
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'force_scan') {
      isCaptureEngineActive = true;
      scanDOMAndReactState();
      sendResponse({ total: window.__sunoSessionClips.size });
      return true;
    }

    if (request.action === 'RESUME_CAPTURE_FROM_CHECKPOINT') {
      isCaptureEngineActive = true;
      const checkpoint = request.checkpoint || {};
      showToastNotice(`🛡️ Auto-Healing Engine: Resumed from "${checkpoint.song_title || 'Last Track'}"!`);
      scanDOMAndReactState();
      startAutoScroll();
      sendResponse({ success: true, message: `Resumed from track ${checkpoint.song_title || 'Checkpoint'}` });
      return true;
    }

    if (request.action === 'start_export') {
      const clips = Array.from(window.__sunoSessionClips.values());
      sendResponse({ success: true, clips: clips });
      return true;
    }

    if (request.action === 'export_chunks') {
      const chunkSize = request.chunkSize || 10000;
      const options = request.options || {};
      const allClips = filterAndFormatClips(Array.from(window.__sunoSessionClips.values()), options);
      const filesCount = downloadInChunks(allClips, chunkSize, options);
      sendResponse({ success: true, total: allClips.length, chunks: filesCount });
      return true;
    }

    if (request.action === 'toggle_autoscroll') {
      toggleAutoScroll();
      sendResponse({ isAutoScrolling: isAutoScrolling });
      return true;
    }

    if (request.action === 'clear_storage') {
      window.__sunoSessionClips.clear();
      lastAutoSavedCount = 0;
      totalOffloadedCount = 0;
      partCounter = 1;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['suno_captured_clips', 'last_autosaved_count', 'offloaded_total_count', 'part_counter']);
      }
      updateShadowUIBadge();
      sendResponse({ success: true });
      return true;
    }
  });

  function filterAndFormatClips(clipsArray, options = {}) {
    let filtered = clipsArray;

    if (options.filterScope === 'workspace') {
      const wid = getActiveWid();
      if (wid) {
        filtered = filtered.filter(c => (c.workspace && c.workspace.includes(wid.substring(0,8))) || (c.project_id === wid || c.playlist_id === wid));
      }
    } else if (options.filterScope === 'has_lyrics') {
      filtered = filtered.filter(c => c.lyrics && c.lyrics !== 'No lyrics provided for this track.');
    }

    const fields = options.fieldsPreset || 'all';
    return filtered.map(clip => {
      const id = clip.id || clip.clip_id;
      if (fields === 'minimal') {
        return {
          id: id,
          title: clip.title || 'Suno Track',
          audio_url: clip.audio_url || `https://cdn1.suno.ai/${id}.mp3`
        };
      }
      if (fields === 'standard') {
        return {
          id: id,
          title: clip.title || 'Suno Track',
          audio_url: clip.audio_url || `https://cdn1.suno.ai/${id}.mp3`,
          lyrics: extractLyrics(clip),
          style: extractStyleTags(clip),
          image_url: extractImageUrl(clip, id),
          video_url: extractVideoUrl(clip, id),
          workspace: clip.workspace || 'Default Workspace'
        };
      }
      return clip;
    });
  }

  function downloadInChunks(clipsArray, chunkSize = 10000, options = {}) {
    if (!clipsArray || clipsArray.length === 0) return 0;
    const total = clipsArray.length;
    const numChunks = Math.ceil(total / chunkSize);

    const wsName = scrapeActiveWorkspaceName(window.location.href);
    const cleanWsName = wsName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Workspace';
    const defaultPrefix = `suno_workspace_${cleanWsName}`;

    const prefix = (options.filenamePrefix || defaultPrefix).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = (options.subfolder || 'SunoExports').trim().replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    const folderPath = folder ? `${folder}/` : '';

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, total);
      const chunkData = clipsArray.slice(start, end);
      const partNum = i + 1;
      const filename = `${folderPath}${prefix}_part_${partNum}_of_${numChunks}_(${start + 1}-${end}_of_${total}_songs).json`;

      setTimeout(() => {
        const jsonStr = JSON.stringify(chunkData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const reader = new FileReader();
        reader.onload = function() {
          if (typeof chrome !== 'undefined' && chrome.downloads) {
            chrome.downloads.download({
              url: reader.result,
              filename: filename,
              saveAs: false
            });
          } else {
            const a = document.createElement('a');
            a.href = reader.result;
            a.download = `${prefix}_part_${partNum}_of_${numChunks}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { a.remove(); }, 1500);
          }
        };
        reader.readAsDataURL(blob);
      }, i * 500);
    }
    return numChunks;
  }

  function findScrollContainers() {
    const containers = new Set();

    // 1. Target main content containers
    const mainEl = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainEl) containers.add(mainEl);

    // 2. Target all overflowing DOM containers
    try {
      const allEls = document.querySelectorAll('div, section, main, article, ul, ol, [class*="scroll"], [class*="content"], [class*="feed"], [class*="workspace"], [class*="playlist"]');
      for (const el of allEls) {
        if (el.scrollHeight > el.clientHeight + 20) {
          containers.add(el);
        }
      }
    } catch(e){}

    containers.add(window);
    containers.add(document.body);
    containers.add(document.documentElement);
    return Array.from(containers);
  }

  function toggleAutoScroll() {
    isCaptureEngineActive = true;
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  }

  let noNewClipsScrollAttempts = 0;
  let lastCapturedCountForScroll = 0;
  let autoScrollStepCount = 0;
  let autoScrollPaceMs = 800; // Fast & reliable 800ms scroll step

  function startAutoScroll() {
    isCaptureEngineActive = true; // Automatically activate capture engine!
    isAutoScrolling = true;
    noNewClipsScrollAttempts = 0;
    autoScrollStepCount = 0;
    lastCapturedCountForScroll = totalOffloadedCount + window.__sunoSessionClips.size;
    updateShadowUIBadge();

    if (autoScrollInterval) clearInterval(autoScrollInterval);

    autoScrollInterval = setInterval(() => {
      if (!isAutoScrolling) {
        stopAutoScroll();
        return;
      }

      autoScrollStepCount++;
      const containers = findScrollContainers();

      // 1. Window & Document Scroll
      try {
        window.scrollBy({ top: 750, behavior: 'smooth' });
        if (document.documentElement) document.documentElement.scrollTop += 750;
        if (document.body) document.body.scrollTop += 750;
      } catch(e){}

      // 2. Target Inner Elements Scroll
      for (const c of containers) {
        if (c && c !== window) {
          try {
            c.scrollTop += 750;
            c.dispatchEvent(new Event('scroll', { bubbles: true }));
            c.dispatchEvent(new CustomEvent('scroll', { bubbles: true }));
            c.dispatchEvent(new WheelEvent('wheel', { deltaY: 750, bubbles: true }));
          } catch(e){}
        }
      }

      // 3. Synthetic Keyboard Down Events
      try {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', keyCode: 34, bubbles: true, cancelable: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true }));
      } catch(e){}

      // 4. Click Load / Show More buttons if present
      try {
        const buttons = document.querySelectorAll('button, a[role="button"], div[role="button"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase().trim();
          if (text === 'load more' || text === 'show more' || text.includes('view more') || text.includes('load next') || text.includes('see more')) {
            btn.click();
          }
        }
      } catch(e){}

      // 5. Scan DOM & State for new clips
      scanDOMAndReactState();

      // Track progress against total grand count (offloaded + active RAM)
      const currentGrandTotal = totalOffloadedCount + window.__sunoSessionClips.size;
      if (currentGrandTotal > lastCapturedCountForScroll) {
        noNewClipsScrollAttempts = 0;
        lastCapturedCountForScroll = currentGrandTotal;
      } else {
        noNewClipsScrollAttempts++;
        const windowAtBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 120);

        // Perform bounce scroll every 6 steps at bottom to trigger Suno React IntersectionObserver
        if (windowAtBottom && noNewClipsScrollAttempts % 6 === 0) {
          try {
            window.scrollBy({ top: -400, behavior: 'instant' });
            setTimeout(() => {
              window.scrollBy({ top: 800, behavior: 'smooth' });
            }, 180);
          } catch(e){}
        }

        // Auto-stop ONLY after 120 consecutive idle steps (~100 seconds) AND window is confirmed at bottom
        if (windowAtBottom && noNewClipsScrollAttempts >= 120) {
          console.log('[Auto-Scroller] Complete workspace scan finished! Stopping scroller...');
          stopAutoScroll();
          offloadActiveWorkspaceToDisk('workspace_end_reached');
        }
      }

      updateShadowUIBadge();
    }, autoScrollPaceMs);
  }

  function stopAutoScroll() {
    const wasScrolling = isAutoScrolling;
    const stepsRan = autoScrollStepCount;
    isAutoScrolling = false;
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
    noNewClipsScrollAttempts = 0;
    updateShadowUIBadge();

    if (wasScrolling && stepsRan >= 3) {
      offloadActiveWorkspaceToDisk('autoscroll_stopped');
    }
  }

  function mountShadowUI() {
    if (document.getElementById('suno-exporter-shadow-host') || !window.location.href.includes('suno.com')) return;

    const host = document.createElement('suno-exporter-shadow-host');
    host.id = 'suno-exporter-shadow-host';
    host.style.cssText = 'position: fixed !important; bottom: 24px !important; left: 24px !important; z-index: 2147483647 !important; display: block !important;';

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        .panel {
          background: #0f172a !important;
          border: 2px solid #334155 !important;
          border-radius: 16px !important;
          padding: 12px 16px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8) !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          color: #f8fafc !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }
        .badge {
          background: #1e293b !important;
          border: 1px solid #ef4444 !important;
          color: #fca5a5 !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          padding: 6px 12px !important;
          border-radius: 99px !important;
          white-space: nowrap !important;
        }
        .btn {
          border: none !important;
          padding: 8px 14px !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: transform 0.1s, opacity 0.15s !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .btn:hover { opacity: 0.9 !important; }
        .btn:active { transform: scale(0.96) !important; }
        .btn-start { background: linear-gradient(135deg, #10b981, #059669) !important; color: white !important; }
        .btn-stop { background: linear-gradient(135deg, #ef4444, #dc2626) !important; color: white !important; }
        .btn-scan { background: #0284c7 !important; color: white !important; }
        .btn-scroll { background: #8b5cf6 !important; color: white !important; }
        .btn-scroll.active { background: #ef4444 !important; }
        .btn-export { background: linear-gradient(135deg, #0284c7, #0369a1) !important; color: white !important; }
      </style>
      <div class="panel">
        <div id="countBadge" class="badge">🔴 IDLE (Click Start Scan)</div>
        <button id="engineBtn" class="btn btn-start">▶ Start Scan</button>
        <button id="scrollBtn" class="btn btn-scroll">📜 Auto-Scroll</button>
        <button id="exportBtn" class="btn btn-export">📥 Export JSON</button>
      </div>
    `;

    const countBadge = shadow.getElementById('countBadge');
    const engineBtn = shadow.getElementById('engineBtn');
    const scrollBtn = shadow.getElementById('scrollBtn');
    const exportBtn = shadow.getElementById('exportBtn');

    if (engineBtn) {
      engineBtn.onclick = (e) => {
        e.preventDefault();
        if (isCaptureEngineActive) {
          isCaptureEngineActive = false;
          stopAutoScroll();
          offloadActiveWorkspaceToDisk('engine_manually_stopped');
          showToastNotice('🔴 Engine Halted / Workspace Offloaded to Disk.');
        } else {
          isCaptureEngineActive = true;
          detectLoggedInUser();
          scanDOMAndReactState();
          startAutoScroll();
          showToastNotice(`🟢 Engine Started! Locked to: @${loggedInUser?.handle || 'Logged-in Account'}`);
        }
        updateShadowUIBadge();
      };
    }

    scrollBtn.onclick = (e) => {
      e.preventDefault();
      toggleAutoScroll();
    };

    exportBtn.onclick = (e) => {
      e.preventDefault();
      const clips = Array.from(window.__sunoSessionClips.values());
      if (clips.length === 0) {
        alert('No tracks captured yet! Click Start Scan on Suno to capture tracks.');
        return;
      }
      downloadInChunks(clips, 10000);
    };

    (document.documentElement || document.body).appendChild(host);
    updateShadowUIBadge();
  }

  function updateShadowUIBadge() {
    const host = document.getElementById('suno-exporter-shadow-host');
    if (!host || !host.shadowRoot) return;

    const countBadge = host.shadowRoot.getElementById('countBadge');
    const engineBtn = host.shadowRoot.getElementById('engineBtn');
    const scrollBtn = host.shadowRoot.getElementById('scrollBtn');

    const activeRam = window.__sunoSessionClips.size;
    const grandTotal = totalOffloadedCount + activeRam;
    const uStr = loggedInUser?.handle ? ` (@${loggedInUser.handle})` : '';

    if (countBadge) {
      if (!isCaptureEngineActive) {
        countBadge.textContent = `🔴 IDLE / PAUSED${uStr} (Click Start)`;
        countBadge.style.borderColor = '#ef4444';
        countBadge.style.color = '#fca5a5';
      } else if (isAutoScrolling) {
        countBadge.textContent = `📜 AUTO-SCROLLING (#${autoScrollStepCount})... ${grandTotal.toLocaleString()} Tracks${uStr}`;
        countBadge.style.borderColor = '#8b5cf6';
        countBadge.style.color = '#c084fc';
      } else if (totalOffloadedCount > 0) {
        countBadge.textContent = `🟢 SCANNING... ${grandTotal.toLocaleString()} Captured (Disk: ${totalOffloadedCount.toLocaleString()})${uStr}`;
        countBadge.style.borderColor = '#10b981';
        countBadge.style.color = '#34d399';
      } else {
        countBadge.textContent = `🟢 SCANNING... ${activeRam.toLocaleString()} Tracks${uStr}`;
        countBadge.style.borderColor = '#10b981';
        countBadge.style.color = '#34d399';
      }
    }

    if (engineBtn) {
      if (isCaptureEngineActive) {
        engineBtn.textContent = '⏹ Stop Scan';
        engineBtn.className = 'btn btn-stop';
      } else {
        engineBtn.textContent = '▶ Start Scan';
        engineBtn.className = 'btn btn-start';
      }
    }

    if (scrollBtn) {
      if (isAutoScrolling) {
        scrollBtn.textContent = '⏹️ Stop Scroll';
        scrollBtn.classList.add('active');
      } else {
        scrollBtn.textContent = '📜 Auto-Scroll';
        scrollBtn.classList.remove('active');
      }
    }
  }

  // Window PostMessage Bridge for Portable Workspace Organizer & Exporter Hub
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || typeof event.data !== 'object') return;
    const { type } = event.data;

    if (type === 'SUNO_EXT_CLIPS_CAPTURED' && event.data.clips) {
      captureClips(event.data.clips, null, event.data.url || '');
    } else if (type === 'SUNO_EXT_PING') {
      window.postMessage({
        type: 'SUNO_EXT_PONG',
        version: '7.0',
        active: true,
        totalCaptured: window.__sunoSessionClips.size
      }, window.location.origin || '*');
    } else if (type === 'SUNO_EXT_GET_TRACKS') {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['suno_captured_clips'], (res) => {
            const clips = (res && res.suno_captured_clips) ? res.suno_captured_clips : Array.from(window.__sunoSessionClips.values());
            window.postMessage({
              type: 'SUNO_EXT_FETCH_RES',
              success: true,
              clips: clips,
              total: clips.length
            }, window.location.origin || '*');
          });
        } else {
          const clips = Array.from(window.__sunoSessionClips.values());
          window.postMessage({
            type: 'SUNO_EXT_FETCH_RES',
            success: true,
            clips: clips,
            total: clips.length
          }, window.location.origin || '*');
        }
      } catch(e) {
        const clips = Array.from(window.__sunoSessionClips.values());
        window.postMessage({
          type: 'SUNO_EXT_FETCH_RES',
          success: true,
          clips: clips,
          total: clips.length
        }, window.location.origin || '*');
      }
    } else if (type === 'SUNO_EXT_START_SCROLL') {
      startAutoScroll();
      window.postMessage({ type: 'SUNO_EXT_LOG', message: '📜 Auto-scroll capture toggled from Workspace Hub!', level: 'info' }, '*');
    }
  });

  setInterval(mountShadowUI, 1000);
  mountShadowUI();
})();
