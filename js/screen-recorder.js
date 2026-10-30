/* ==========================================================
   Convertly - screen-recorder.js
   Tool: Screen Recorder (getDisplayMedia + MediaRecorder)
   NOTE: screen sharing only works on https:// or localhost.
   ========================================================== */
'use strict';

(function () {
  MT.addTool('screen', 'Screen Recorder', `
    <h2 class="mt-title">Screen Recorder</h2>
    <p class="mt-sub">Record your screen (and tab audio if you allow it) and download the video.</p>
    <div class="mt-time" id="screenTime">0:00</div>
    <div class="mt-row">
      <button type="button" class="mt-btn mt-primary" id="screenStart">Start recording</button>
      <button type="button" class="mt-btn mt-danger" id="screenStop" disabled>Stop</button>
    </div>
    <video id="screenPlayer" class="mt-media" controls playsinline hidden></video>
    <div class="mt-result" id="screenResults" hidden>
      <button type="button" class="mt-btn mt-primary" id="screenDownload">Download video</button>
    </div>
  `);

  const el = {
    time: $('#screenTime'),
    start: $('#screenStart'),
    stop: $('#screenStop'),
    player: $('#screenPlayer'),
    results: $('#screenResults'),
    download: $('#screenDownload'),
  };
  const state = { recorder: null, stream: null, chunks: [], blob: null, url: null, timer: 0, startedAt: 0 };

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  const extFor = (type) => (type.includes('mp4') ? 'mp4' : 'webm');

  function stopStream() {
    if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.MediaRecorder) {
      toast('Screen recording is not supported here. Use Chrome, Edge or Firefox on https or localhost.', 'error');
      return;
    }
    try {
      state.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } catch (err) {
      console.error(err);
      toast('Screen recording was cancelled or blocked. Please allow screen sharing.', 'error');
      return;
    }

    if (state.url) URL.revokeObjectURL(state.url);
    state.url = null;
    state.blob = null;
    state.chunks = [];
    el.player.hidden = true;
    el.results.hidden = true;

    const recorder = new MediaRecorder(state.stream);
    state.recorder = recorder;
    recorder.ondataavailable = (e) => e.data && e.data.size && state.chunks.push(e.data);
    recorder.onstop = () => {
      clearInterval(state.timer);
      stopStream();
      state.blob = new Blob(state.chunks, { type: recorder.mimeType || 'video/webm' });
      state.url = URL.createObjectURL(state.blob);
      el.player.src = state.url;
      el.player.hidden = false;
      el.results.hidden = false;
      el.start.disabled = false;
      el.stop.disabled = true;
      toast('Recording saved. You can play or download it.', 'success');
    };

    /* The browser's own "Stop sharing" button ends the recording too */
    const videoTrack = state.stream.getVideoTracks()[0];
    if (videoTrack) videoTrack.addEventListener('ended', stop);

    recorder.start();
    state.startedAt = Date.now();
    el.time.textContent = '0:00';
    state.timer = setInterval(() => (el.time.textContent = fmt(Date.now() - state.startedAt)), 250);
    el.start.disabled = true;
    el.stop.disabled = false;
  }

  function stop() {
    if (state.recorder && state.recorder.state !== 'inactive') state.recorder.stop();
  }

  el.start.addEventListener('click', start);
  el.stop.addEventListener('click', stop);
  el.download.addEventListener('click', () => {
    if (state.blob) downloadBlob(state.blob, 'screen-recording.' + extFor(state.blob.type));
  });
})();
