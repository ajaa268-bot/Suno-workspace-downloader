document.addEventListener('DOMContentLoaded', async () => {
  const trackCounter = document.getElementById('trackCounter');
  const fieldsPresetSelect = document.getElementById('fieldsPresetSelect');
  const filterScopeSelect = document.getElementById('filterScopeSelect');
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  const subfolderInput = document.getElementById('subfolderInput');
  const filenamePrefixInput = document.getElementById('filenamePrefixInput');
  const chunkSizeSelect = document.getElementById('chunkSizeSelect');
  const exportChunksBtn = document.getElementById('exportChunksBtn');
  const forceScanBtn = document.getElementById('forceScanBtn');
  const toggleScrollBtn = document.getElementById('toggleScrollBtn');
  const clearBufferBtn = document.getElementById('clearBufferBtn');
  const logConsole = document.getElementById('logConsole');

  const chkOnlyPersonal = document.getElementById('chkOnlyPersonal');
  const chkExcludeEmpty = document.getElementById('chkExcludeEmpty');
  const chkDeduplicate = document.getElementById('chkDeduplicate');
  const chkAutoEnrich = document.getElementById('chkAutoEnrich');
  const chkAutoPurgeRAM = document.getElementById('chkAutoPurgeRAM');
  const chkAutoHeal = document.getElementById('chkAutoHeal');
  const chkUserLock = document.getElementById('chkUserLock');
  const startCaptureBtn = document.getElementById('startCaptureBtn');
  const stopCaptureBtn = document.getElementById('stopCaptureBtn');

  const lblLastWorkspace = document.getElementById('lblLastWorkspace');
  const lblLastSongTitle = document.getElementById('lblLastSongTitle');
  const lblLastClipId = document.getElementById('lblLastClipId');
  const lblLastTimestamp = document.getElementById('lblLastTimestamp');
  const checkpointBadge = document.getElementById('checkpointBadge');
  const resumeScanBtn = document.getElementById('resumeScanBtn');

  const scrollPaceSelect = document.getElementById('scrollPaceSelect');

  let maxTrackCount = 0;
  let isEngineRunning = false;
  let currentCheckpointState = null;

  function log(msg, isError = false) {
    const div = document.createElement('div');
    div.style.color = isError ? '#f87171' : '#38bdf8';
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logConsole.appendChild(div);
    logConsole.scrollTop = logConsole.scrollHeight;
  }

  // Load saved preferences
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['exporter_opts', 'last_checkpoint_state'], (res) => {
        if (res && res.exporter_opts) {
          const opts = res.exporter_opts;
          if (opts.fieldsPreset) fieldsPresetSelect.value = opts.fieldsPreset;
          if (opts.filterScope) filterScopeSelect.value = opts.filterScope;
          if (opts.scrollPace && scrollPaceSelect) scrollPaceSelect.value = opts.scrollPace;
          if (typeof opts.autoSaveEnabled === 'boolean') autoSaveToggle.checked = opts.autoSaveEnabled;
          if (typeof opts.autoPurgeRAM === 'boolean') chkAutoPurgeRAM.checked = opts.autoPurgeRAM;
          if (typeof opts.autoHeal === 'boolean' && chkAutoHeal) chkAutoHeal.checked = opts.autoHeal;
          if (typeof opts.userLock === 'boolean' && chkUserLock) chkUserLock.checked = opts.userLock;
          if (typeof opts.onlyPersonal === 'boolean') chkOnlyPersonal.checked = opts.onlyPersonal;
          if (typeof opts.excludeEmpty === 'boolean') chkExcludeEmpty.checked = opts.excludeEmpty;
          if (typeof opts.deduplicate === 'boolean') chkDeduplicate.checked = opts.deduplicate;
          if (typeof opts.autoEnrich === 'boolean') chkAutoEnrich.checked = opts.autoEnrich;
          if (opts.subfolder) subfolderInput.value = opts.subfolder;
          if (opts.filenamePrefix) filenamePrefixInput.value = opts.filenamePrefix;
          if (opts.chunkSize) chunkSizeSelect.value = opts.chunkSize;
        }
        if (res && res.last_checkpoint_state) {
          updateCheckpointDisplay(res.last_checkpoint_state);
        }
      });
    }
  } catch(e){}

  function updateCheckpointDisplay(cp) {
    if (!cp) return;
    currentCheckpointState = cp;
    if (lblLastWorkspace) lblLastWorkspace.textContent = cp.workspace || 'My Personal Library';
    if (lblLastSongTitle) lblLastSongTitle.textContent = cp.song_title || 'Untitled Track';
    if (lblLastClipId) lblLastClipId.textContent = cp.song_id ? `${cp.song_id.substring(0, 13)}...` : 'None';
    if (lblLastTimestamp) {
      const dt = cp.timestamp ? new Date(cp.timestamp).toLocaleTimeString() : '';
      lblLastTimestamp.textContent = dt ? `Saved at ${dt}` : 'Saved';
    }
    if (checkpointBadge) {
      checkpointBadge.textContent = 'READY TO RESUME';
      checkpointBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      checkpointBadge.style.color = '#34d399';
    }
  }

  function savePreferences() {
    const opts = {
      fieldsPreset: fieldsPresetSelect.value,
      filterScope: filterScopeSelect.value,
      scrollPace: scrollPaceSelect ? scrollPaceSelect.value : '2000',
      autoSaveEnabled: autoSaveToggle.checked,
      autoPurgeRAM: chkAutoPurgeRAM ? chkAutoPurgeRAM.checked : true,
      autoHeal: chkAutoHeal ? chkAutoHeal.checked : true,
      userLock: chkUserLock ? chkUserLock.checked : true,
      onlyPersonal: chkOnlyPersonal.checked,
      excludeEmpty: chkExcludeEmpty.checked,
      deduplicate: chkDeduplicate.checked,
      autoEnrich: chkAutoEnrich.checked,
      subfolder: subfolderInput.value,
      filenamePrefix: filenamePrefixInput.value,
      chunkSize: chunkSizeSelect.value
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'exporter_opts': opts }, async () => {
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
            if (tabs && tabs[0] && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'update_options' }, () => {
                if (chrome.runtime.lastError) {}
              });
            }
          } catch(e){}
        });
      }
    } catch(e){}
  }

  async function getSunoTab() {
    try {
      let tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('suno.com')) {
        return tabs[0];
      }
      tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true }).catch(() => []);
      if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('suno.com')) {
        return tabs[0];
      }
      tabs = await chrome.tabs.query({ url: "*://*.suno.com/*" }).catch(() => []);
      if (tabs && tabs[0]) {
        return tabs[0];
      }
    } catch(e){}
    return null;
  }

  async function ensureContentScriptInjected(tab) {
    if (!tab || !tab.id) return false;
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_suno.js']
          }).then(() => {
            setTimeout(() => resolve(true), 300);
          }).catch((err) => {
            resolve(false);
          });
        } else {
          resolve(true);
        }
      });
    });
  }

  if (startCaptureBtn) {
    startCaptureBtn.onclick = async () => {
      try {
        savePreferences();
        log('▶ Starting scan engine...');
        const tab = await getSunoTab();
        if (!tab) {
          log('Please open Suno.com in your browser first!', true);
          return;
        }

        await ensureContentScriptInjected(tab);

        chrome.tabs.sendMessage(tab.id, { action: 'start_engine' }, (res) => {
          if (chrome.runtime.lastError) {
            log('Error connecting to Suno tab. Try refreshing suno.com (F5).', true);
            return;
          }
          log('🟢 Scan engine active! Capturing logged-in account songs...');
        });
      } catch(e) {
        log('Scan error.', true);
      }
    };
  }

  if (stopCaptureBtn) {
    stopCaptureBtn.onclick = async () => {
      try {
        log('⏹ Stopping scan engine...');
        const tab = await getSunoTab();
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'stop_engine' }, (res) => {
            if (chrome.runtime.lastError) {}
            log('🔴 Scan engine halted.');
          });
        }
      } catch(e) {}
    };
  }

  if (resumeScanBtn) {
    resumeScanBtn.onclick = async () => {
      try {
        if (!currentCheckpointState || !currentCheckpointState.url) {
          log('No saved checkpoint found yet. Start scrolling on Suno.com first!', true);
          return;
        }

        log(`📍 Resuming scan from last track: "${currentCheckpointState.song_title}" (${currentCheckpointState.workspace})...`);
        
        const targetUrl = currentCheckpointState.url || 'https://suno.com/me';
        const sunoTabs = await chrome.tabs.query({ url: "*://*.suno.com/*" }).catch(() => []);
        
        let activeTab;
        if (sunoTabs && sunoTabs.length > 0) {
          activeTab = sunoTabs[0];
          await chrome.tabs.update(activeTab.id, { url: targetUrl, active: true }).catch(() => {});
        } else {
          activeTab = await chrome.tabs.create({ url: targetUrl, active: true }).catch(() => {});
        }

        if (activeTab && activeTab.id) {
          setTimeout(async () => {
            try {
              await ensureContentScriptInjected(activeTab);
              chrome.tabs.sendMessage(activeTab.id, {
                action: 'RESUME_CAPTURE_FROM_CHECKPOINT',
                checkpoint: currentCheckpointState
              }, (res) => {
                if (chrome.runtime.lastError) {}
                if (res && res.success) {
                  log(`✅ Auto-scrolling resumed from checkpoint track "${currentCheckpointState.song_title}"!`);
                } else {
                  log(`📍 Navigated to ${targetUrl}. Resuming capture engine...`);
                }
              });
            } catch(e){}
          }, 2000);
        }
      } catch(e){}
    };
  }

  [fieldsPresetSelect, filterScopeSelect, chunkSizeSelect, autoSaveToggle, chkAutoPurgeRAM, chkAutoHeal, chkOnlyPersonal, chkExcludeEmpty, chkDeduplicate, chkAutoEnrich].forEach(el => {
    if (el) el.addEventListener('change', savePreferences);
  });
  [subfolderInput, filenamePrefixInput].forEach(el => {
    if (el) el.addEventListener('input', savePreferences);
  });

  // Refresh stats counter
  async function refreshStats() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['suno_captured_clips', 'offloaded_total_count', 'part_counter'], (result) => {
          if (chrome.runtime.lastError) return;
          const clips = (result && result.suno_captured_clips) ? result.suno_captured_clips : [];
          const offloaded = (result && result.offloaded_total_count) ? result.offloaded_total_count : 0;
          const currentTotal = offloaded + clips.length;

          if (trackCounter) trackCounter.textContent = currentTotal.toLocaleString();

          const lbl = document.querySelector('.counter-lbl');
          if (lbl) {
            if (offloaded > 0) {
              const parts = Math.max(1, (result.part_counter || 1) - 1);
              lbl.textContent = `Captured Songs (${offloaded.toLocaleString()} Offloaded to Disk in ${parts} Part Files)`;
            } else {
              lbl.textContent = 'Captured Songs / 60,000 Buffer';
            }
          }
        });
      }
    } catch(e) {}

    try {
      const tab = await getSunoTab();
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'get_stats' }, (res) => {
          if (chrome.runtime.lastError) return;
          if (res && typeof res.total === 'number') {
            if (toggleScrollBtn) {
              toggleScrollBtn.textContent = res.isAutoScrolling ? '⏹️ Stop Auto-Scroll' : '📜 Start Auto-Scroll';
              toggleScrollBtn.style.background = res.isAutoScrolling ? '#ef4444' : '#8b5cf6';
            }
          }
        });
      }
    } catch(e){}
  }

  refreshStats();
  setInterval(refreshStats, 800);

  // Force Scan Active Page & DOM Now
  if (forceScanBtn) {
    forceScanBtn.onclick = async () => {
      try {
        log('⚡ Executing 4-Layer Page & DOM Scan...');
        const tab = await getSunoTab();
        if (!tab) {
          log('Please open Suno.com in your browser first!', true);
          return;
        }

        await ensureContentScriptInjected(tab);

        chrome.tabs.sendMessage(tab.id, { action: 'force_scan' }, (res) => {
          if (chrome.runtime.lastError) {
            log('Error connecting to Suno tab. Try refreshing suno.com (F5).', true);
            return;
          }
          if (res && typeof res.total === 'number') {
            log(`✅ Instant Scan Complete! ${res.total.toLocaleString()} tracks captured in storage.`);
          }
        });
      } catch(e) {
        log('Error executing scan.', true);
      }
    };
  }

  // Trigger Chunked JSON Download with User Options
  exportChunksBtn.onclick = async () => {
    savePreferences();
    const chunkSize = parseInt(chunkSizeSelect.value, 10) || 10000;
    const options = {
      fieldsPreset: fieldsPresetSelect.value,
      filterScope: filterScopeSelect.value,
      subfolder: subfolderInput.value,
      filenamePrefix: filenamePrefixInput.value
    };

    log(`Preparing chunked export (${chunkSize.toLocaleString()} songs/file, folder: ${options.subfolder}/)...`);

    chrome.storage.local.get(['suno_captured_clips'], async (result) => {
      let clips = result.suno_captured_clips || [];

      if (!clips || clips.length === 0) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'export_chunks', chunkSize: chunkSize, options: options }, (res) => {
            if (res && res.success) {
              log(`✅ Exported ${res.total.toLocaleString()} tracks in ${res.chunks} file(s)!`);
            } else {
              log('No tracks captured yet! Open Suno.com and scroll to capture songs.', true);
            }
          });
          return;
        }
        log('No tracks captured yet! Open Suno.com and scroll to capture songs.', true);
        return;
      }

      const processedClips = filterAndFormatClips(clips, options);
      processChunks(processedClips, chunkSize, options);
    });
  };

  function filterAndFormatClips(clipsArray, options) {
    let filtered = clipsArray;

    // 1. Exclude public explore / trending feed tracks if onlyPersonal is checked
    if (options.onlyPersonal !== false) {
      filtered = filtered.filter(c => {
        const ws = (c.workspace || 'Default Workspace').toLowerCase();
        return !ws.includes('public') && !ws.includes('explore') && !ws.includes('feed');
      });
    }

    // 2. Exclude incomplete / empty tracks ("ones with no info")
    if (options.excludeEmpty !== false) {
      filtered = filtered.filter(c => {
        const hasTitle = c.title && c.title !== 'Untitled Track' && c.title !== 'Suno Track' && c.title !== 'Play';
        const hasLyrics = c.lyrics && c.lyrics !== 'No lyrics provided for this track.' && c.lyrics !== 'No lyrics provided.';
        const hasAudio = c.audio_url && !c.audio_url.includes('undefined');
        return hasTitle || hasLyrics || hasAudio;
      });
    }

    // 3. Deduplicate tracks ("remove doubles")
    if (options.deduplicate !== false) {
      const seenIds = new Set();
      const seenSigs = new Set();
      filtered = filtered.filter(c => {
        const id = c.id || c.clip_id;
        if (id && seenIds.has(id)) return false;
        if (id) seenIds.add(id);

        const title = (c.title || '').trim().toLowerCase();
        const lyricsSnippet = (c.lyrics || c.prompt || '').trim().substring(0, 60).toLowerCase();
        if (title && lyricsSnippet && lyricsSnippet !== 'no lyrics provided.') {
          const sig = `${title}|${lyricsSnippet}`;
          if (seenSigs.has(sig)) return false;
          seenSigs.add(sig);
        }
        return true;
      });
    }

    if (options.filterScope === 'has_lyrics') {
      filtered = filtered.filter(c => c.lyrics && c.lyrics !== 'No lyrics provided for this track.' && c.lyrics !== 'No lyrics provided.');
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
          lyrics: clip.lyrics || clip.prompt || 'No lyrics provided for this track.',
          style: clip.style || clip.tags || 'None',
          image_url: clip.image_url || `https://cdn2.suno.ai/image_large_${id}.jpeg`,
          video_url: clip.video_url || `https://cdn1.suno.ai/${id}.mp4`,
          workspace: clip.workspace || 'Default Workspace'
        };
      }
      return clip;
    });
  }

  function processChunks(clips, chunkSize, options) {
    const total = clips.length;
    if (total === 0) {
      log('No matching tracks found for selected scope/filter!', true);
      return;
    }

    const firstWs = clips[0]?.workspace || 'Workspace';
    const cleanWs = firstWs.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Workspace';
    const defaultPrefix = `suno_workspace_${cleanWs}`;

    const numChunks = Math.ceil(total / chunkSize);
    const prefix = (options.filenamePrefix && options.filenamePrefix !== 'suno_workspace_export' ? options.filenamePrefix : defaultPrefix).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = (options.subfolder || 'SunoExports').trim().replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    const folderPath = folder ? `${folder}/` : '';

    log(`🚀 Exporting ${total.toLocaleString()} tracks into ${folderPath}${prefix} (${numChunks} file(s))...`);

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, total);
      const chunkData = clips.slice(start, end);
      const partNum = i + 1;
      const filename = `${folderPath}${prefix}_part_${partNum}_of_${numChunks}_(${start + 1}-${end}_of_${total}_songs).json`;

      setTimeout(() => {
        const jsonStr = JSON.stringify(chunkData);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        }, (downloadId) => {
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          if (chrome.runtime.lastError) {
            log(`Part ${partNum} download note: ${chrome.runtime.lastError.message}`, true);
          } else {
            log(`✅ Downloaded Part ${partNum}/${numChunks}: ${filename}`);
          }
        });
      }, i * 200);
    }
  }

  // Toggle Auto-Scroll on active tab
  if (toggleScrollBtn) {
    toggleScrollBtn.onclick = async () => {
      try {
        const tab = await getSunoTab();
        if (!tab) {
          log('Please open Suno.com in your browser first!', true);
          return;
        }

        await ensureContentScriptInjected(tab);

        chrome.tabs.sendMessage(tab.id, { action: 'toggle_autoscroll' }, (res) => {
          if (chrome.runtime.lastError) {
            log('Error connecting to Suno page. Try refreshing suno.com (F5).', true);
            return;
          }
          if (res && res.isAutoScrolling) {
            log('📜 Auto-scroll started! Auto-saving every 1,000 songs to subfolder...');
            toggleScrollBtn.textContent = '⏹️ Stop Auto-Scroll';
            toggleScrollBtn.style.background = '#ef4444';
          } else {
            log('⏹️ Auto-scroll stopped.');
            toggleScrollBtn.textContent = '📜 Toggle Auto-Scroll Capture';
            toggleScrollBtn.style.background = '#8b5cf6';
          }
        });
      } catch(e){}
    };
  }

  // Clear Storage Buffer
  if (clearBufferBtn) {
    clearBufferBtn.onclick = async () => {
      try {
        if (!confirm('Are you sure you want to clear all captured songs and reset disk offload counters from extension storage?')) return;

        maxTrackCount = 0;
        chrome.storage.local.remove(['suno_captured_clips', 'last_autosaved_count', 'offloaded_total_count', 'part_counter'], () => {
          if (trackCounter) trackCounter.textContent = '0';
          const lbl = document.querySelector('.counter-lbl');
          if (lbl) lbl.textContent = 'Captured Songs / 60,000 Buffer';
          log('🗑️ Storage buffer & offload counters completely reset to 0.');
        });

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'clear_storage' }, () => {
            if (chrome.runtime.lastError) {}
          });
        }
      } catch(e){}
    };
  }

  // Single Song Direct Scraper Handler
  const singleSongUrlInput = document.getElementById('singleSongUrlInput');
  const scrapeSingleSongBtn = document.getElementById('scrapeSingleSongBtn');

  if (scrapeSingleSongBtn) {
    scrapeSingleSongBtn.onclick = async () => {
      try {
        const rawInput = (singleSongUrlInput ? singleSongUrlInput.value : '').trim();
        if (!rawInput) {
          log('Please enter a Suno song URL or clip ID!', true);
          return;
        }

        const match = rawInput.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (!match) {
          log('Invalid Suno clip UUID or URL!', true);
          return;
        }

        const songId = match[0];
        log(`🎯 Fetching song metadata for clip ${songId}...`);

        const res = await fetch(`https://studio-api.prod.suno.com/api/clip/${songId}`);
        if (res.ok) {
          const clipData = await res.json();
          if (clipData && (clipData.id || clipData.title)) {
            chrome.storage.local.get(['suno_captured_clips'], async (result) => {
              if (chrome.runtime.lastError) return;
              const existing = (result && result.suno_captured_clips) ? result.suno_captured_clips : [];
              const updatedMap = new Map(existing.map(c => [c.id || c.clip_id, c]));

              const title = String(clipData.title || clipData.name || clipData.metadata?.title || 'Untitled Track');
              const artist = String(clipData.display_name || clipData.handle || clipData.artist || clipData.user?.display_name || clipData.user?.handle || 'Suno Creator');

              const formatted = {
                id: clipData.id,
                title: title !== 'Play' ? title : 'Untitled Track',
                artist: artist,
                display_name: artist,
                audio_url: clipData.audio_url || `https://cdn1.suno.ai/${clipData.id}.mp3`,
                video_url: clipData.video_url || `https://cdn1.suno.ai/${clipData.id}.mp4`,
                image_url: clipData.image_large_url || clipData.image_url || `https://cdn2.suno.ai/image_large_${clipData.id}.png`,
                style: clipData.metadata?.tags || clipData.style || 'None',
                lyrics: clipData.metadata?.prompt || clipData.lyrics || clipData.prompt || 'No lyrics provided.',
                workspace: 'Single Scrape'
              };

              updatedMap.set(clipData.id, formatted);
              const finalArr = Array.from(updatedMap.values());
              chrome.storage.local.set({ 'suno_captured_clips': finalArr }, async () => {
                maxTrackCount = finalArr.length;
                if (trackCounter) trackCounter.textContent = maxTrackCount.toLocaleString();
                log(`✅ Scraped "${formatted.title}" by ${formatted.artist}!`);
                if (singleSongUrlInput) singleSongUrlInput.value = '';
              });
            });

            const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
            if (tabs && tabs[0] && tabs[0].id) {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'force_scan' }, () => {
                if (chrome.runtime.lastError) {}
              });
            }
          }
        } else {
          log(`HTTP ${res.status}: Failed to fetch clip ${songId}`, true);
        }
      } catch(err) {
        log(`Error: ${err.message}`, true);
      }
    };
  }
});
