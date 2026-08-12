// Read-only bridge between the Portable Workspace Organizer page and the extension buffer.
// Injected ONLY into workspace-organizer-portable.html (see manifest content_scripts).
// It exposes no write path: the organizer can detect the extension and read the captured
// buffer, nothing else.
(function() {
  // The organizer is normally opened from disk, and a file:// document has an opaque
  // origin: Chrome reports location.origin as the string "file://", which never matches
  // in a targetOrigin check, so any specific target silently drops the reply. '*' is the
  // only value that works here, and it is safe: postMessage reaches the very window that
  // asked, and this bridge is injected on the organizer page alone.
  const REPLY_TARGET = '*';

  function reply(payload) {
    window.postMessage(payload, REPLY_TARGET);
  }

  function sendTracks() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['suno_captured_clips', 'purged_total_count'], (res) => {
          const clips = (res && res.suno_captured_clips) ? res.suno_captured_clips : [];
          // What the organizer needs is "written to a part file AND removed from the
          // buffer". purged_total_count is exactly that and is uncapped — offloaded_ids
          // stops growing at its memory cap, so its size silently under-reported once a
          // capture went past it, and the running offloaded total counts chunks written
          // while RAM purge was off, whose clips are still in the buffer above.
          const purged = (res && typeof res.purged_total_count === 'number') ? res.purged_total_count : 0;
          reply({
            type: 'SUNO_EXT_FETCH_RES',
            success: true,
            clips: clips,
            total: clips.length,
            offloadedToDisk: purged
          });
        });
        return;
      }
    } catch (e) {}

    reply({ type: 'SUNO_EXT_FETCH_RES', success: false, clips: [], total: 0, offloadedToDisk: 0 });
  }

  window.addEventListener('message', (event) => {
    // Only messages this window posted to itself; a framed document has its own window.
    if (event.source !== window) return;
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'SUNO_EXT_PING') {
      reply({ type: 'SUNO_EXT_PONG', version: '5.2', active: true });
    } else if (event.data.type === 'SUNO_EXT_GET_TRACKS') {
      sendTracks();
    }
  });
})();
