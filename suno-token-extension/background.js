// Standalone Suno Workspace Exporter Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Standalone Suno Workspace Exporter Installed.");
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  handleApiRequest(request).then(sendResponse);
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleApiRequest(request).then(sendResponse);
  return true;
});

// Tab Crash & Auto-Reload Recovery Engine
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('suno.com')) {
    chrome.storage.local.get(['exporter_opts', 'last_checkpoint_state'], (res) => {
      const opts = res.exporter_opts || {};
      const checkpoint = res.last_checkpoint_state;
      const isAutoHealEnabled = opts.autoHeal !== false;

      if (isAutoHealEnabled && checkpoint && checkpoint.song_id) {
        console.log(`[Auto-Heal Engine] Suno tab reloaded/recovered. Resuming from checkpoint track: "${checkpoint.song_title}"`);
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'RESUME_CAPTURE_FROM_CHECKPOINT',
            checkpoint: checkpoint
          }, (response) => {
            if (chrome.runtime.lastError) {}
          });
        }, 3500);
      }
    });
  }
});

async function getAnySunoSessionToken() {
  try {
    const sessionCookies = await new Promise(resolve => chrome.cookies.getAll({ name: "__session" }, resolve));
    if (sessionCookies && sessionCookies.length > 0) {
      const sunoSess = sessionCookies.find(c => c.domain && c.domain.includes('suno') && c.value && c.value.length > 20);
      if (sunoSess) return sunoSess.value;

      const anySess = sessionCookies.find(c => c.value && c.value.length > 20);
      if (anySess) return anySess.value;
    }
  } catch(e){}

  const urls = [
    "https://suno.com",
    "https://auth.suno.com",
    "https://clerk.suno.com",
    "https://studio-api.prod.suno.com",
    "https://suno.ai"
  ];
  for (const u of urls) {
    try {
      const cookie = await new Promise(resolve => chrome.cookies.get({ url: u, name: "__session" }, resolve));
      if (cookie && cookie.value && cookie.value.length > 20) return cookie.value;
    } catch(e){}
  }

  try {
    const allCookies = await new Promise(resolve => chrome.cookies.getAll({}, resolve));
    if (allCookies && allCookies.length > 0) {
      let found = allCookies.find(c => c.domain && c.domain.includes('suno') && (c.name.includes('session') || c.name.includes('jwt') || c.name.includes('token') || c.name.includes('auth')) && c.value && c.value.length > 20);
      if (found) return found.value;

      found = allCookies.find(c => c.domain && c.domain.includes('suno') && c.value && c.value.length > 30);
      if (found) return found.value;
    }
  } catch(e){}

  return '';
}

async function handleApiRequest(request) {
  // Handle Auto-Save Chunk directly from background service worker to dedicated folder
  if (request.action === "AUTO_SAVE_CHUNK") {
    try {
      const chunkData = request.chunkData || [];
      const partNum = request.partNum || 1;
      const subfolder = (request.subfolder || 'SunoExports').trim().replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
      const prefix = (request.prefix || 'suno_workspace_export').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${subfolder ? subfolder + '/' : ''}${prefix}_part_${partNum}_(${chunkData.length}_songs).json`;

      const jsonStr = JSON.stringify(chunkData);
      const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
      const dataUrl = 'data:application/json;base64,' + base64Str;

      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.warn('[Background Auto-Save Error]', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log(`[Background Auto-Save] Part ${partNum} saved to ${filename} (Download ID: ${downloadId})`);
          sendResponse({ success: true, filename: filename, downloadId: downloadId });
        }
      });
      return true;
    } catch(err) {
      console.error('[Background Auto-Save Exception]', err);
      sendResponse({ success: false, error: err.message });
      return true;
    }
  }

  if (request.action === "GET_SUNO_TOKEN") {
    try {
      const token = await getAnySunoSessionToken();
      if (token) return { success: true, token: token };
      return { success: false, error: "No active Suno session cookie found. Please visit Suno.com once to sync login." };
    } catch(err) {
      return { success: false, error: err.message };
    }
  }

  if (request.action === "FETCH_SUNO_HTML") {
    try {
      const url = request.url;
      try {
        const sunoTabs = await new Promise(r => chrome.tabs.query({ url: "*://*.suno.com/*" }, r));
        if (sunoTabs && sunoTabs.length > 0) {
          const tab = sunoTabs[0];
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const el = document.getElementById('__NEXT_DATA__');
              return el ? el.textContent : '';
            }
          });
          if (results && results[0] && results[0].result) {
            return { success: true, html: `<script id="__NEXT_DATA__">${results[0].result}</script>` };
          }
        }
      } catch(tabErr){}

      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (res.ok) {
        const text = await res.text();
        return { success: true, html: text };
      }
      return { success: false, status: res.status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  if (request.action === "FETCH_SUNO_WORKSPACE" || request.action === "FETCH_SUNO_API") {
    const wid = request.wid;
    const page = request.page || 0;
    let token = request.token || '';
    const url = request.url || `https://studio-api.prod.suno.com/api/project/clips?project_id=${encodeURIComponent(wid)}&page=${page}`;

    if (!token) {
      token = await getAnySunoSessionToken();
    }

    let cleanToken = (token || '').trim().replace(/[\r\n\t]/g, '');
    if (cleanToken.includes('__session=')) {
      const match = cleanToken.match(/__session=([^;&\s]+)/);
      if (match && match[1]) cleanToken = match[1];
    }

    const reqHeaders = {
      'Accept': 'application/json, text/plain, */*'
    };

    if (cleanToken && cleanToken.length > 10) {
      reqHeaders['Authorization'] = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
    }

    try {
      let res;
      try {
        res = await fetch(url, { headers: reqHeaders });
      } catch (errHeader) {
        console.warn(`[Background Fetch] Auth header fetch failed, retrying plain fetch for: ${url}`);
        res = await fetch(url);
      }

      console.log(`[Background Fetch] ${url} -> HTTP ${res.status}`);
      if (res && res.ok) {
        const data = await res.json();
        return { success: true, data: data };
      } else {
        return { success: false, status: res ? res.status : 500 };
      }
    } catch (err) {
      console.error(`[Background Fetch Error] ${url} ->`, err);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: "Unknown action" };
}
