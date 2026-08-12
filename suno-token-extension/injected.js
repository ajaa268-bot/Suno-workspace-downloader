// Main World Passive Engine for Suno.com (Loaded via web_accessible_resources to bypass CSP)
(function() {
  window.__sunoSessionClips = window.__sunoSessionClips || new Map();

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function isUUID(str) {
    return typeof str === 'string' && UUID_REGEX.test(str.trim());
  }

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

  function captureRawText(text, url = '') {
    if (!text || typeof text !== 'string') return;
    try {
      if (text.startsWith('{') || text.startsWith('[')) {
        const json = JSON.parse(text);
        const clips = findClipsArray(json);
        if (clips && clips.length > 0) {
          window.postMessage({ type: 'SUNO_EXT_CLIPS_CAPTURED', clips: clips, url: url }, window.location.origin || '*');
          return;
        }
      }
    } catch(e){}
  }

  // Intercept window.fetch in Main World
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const reqUrl = (args[0] && typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url) || '';
    const response = await origFetch.apply(this, args);
    try {
      const clone = response.clone();
      clone.text().then(text => captureRawText(text, reqUrl)).catch(() => {});
    } catch(e){}
    return response;
  };

  // Intercept XMLHttpRequest in Main World
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url || '';
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    const reqUrl = this._url || '';
    this.addEventListener('load', function() {
      try {
        if (this.responseText) captureRawText(this.responseText, reqUrl);
      } catch(e){}
    });
    return origSend.apply(this, arguments);
  };
})();
