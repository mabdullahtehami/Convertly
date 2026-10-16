/* ==========================================================
   Convertly - audio-recorder.js
   Tool: Audio Recorder (record from microphone, save original or MP3)
   NOTE: the microphone only works on https:// or localhost.
   ========================================================== */
'use strict';

(function () {
  MT.addTool('rec', 'Audio Recorder', `
    <h2 class="mt-title">Audio Recorder</h2>
    <p class="mt-sub">Record your voice from the microphone and download it.</p>
    <div class="mt-time" id="recTime">0:00</div>
    <div class="mt-row">
      <button type="button" class="mt-btn mt-primary" id="recStart">Start recording</button>
      <button type="button" class="mt-btn mt-danger" id="recStop" disabled>Stop</button>
    </div>
    <audio id="recPlayer" class="mt-media" controls hidden></audio>
    <div class="mt-result" id="recResults" hidden>
      <button type="button" class="mt-btn" id="recDownload">Download recording</button>
      <button type="button" class="mt-btn mt-primary" id="recMp3">Download as MP3</button>
    </div>
    ${MT.progressHtml('rec')}
  `);

  const el = {
    time: $('#recTime'),
    start: $('#recStart'),
    stop: $('#recStop'),
    player: $('#recPlayer'),
    results: $('#recResults'),
    download: $('#recDownload'),
    mp3: $('#recMp3'),
    progress: $('#recProgress'),
  };
  const state = { recorder: null, stream: null, chunks: [], blob: null, url: null, timer: 0, startedAt: 0, busy: false };

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  function extFor(type) {
    if (/ogg/.test(type)) return 'ogg';
    if (/mp4|aac/.test(type)) return 'm4a';
    return 'webm';
  }

  function stopStream() {
    if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      toast('Recording is not supported here. Use Chrome, Edge or Firefox on https or localhost.', 'error');
      return;
    }
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error(err);
      toast('Microphone access was blocked. Please allow the microphone and try again.', 'error');
      return;
    }

    if (state.url) URL.revokeObjectURL(state.url);
    state.url = null;
    state.blob = null;
    state.chunks = [];
    el.player.hidden = true;
    el.results.hidden = true;
    el.progress.hidden = true;

    const recorder = new MediaRecorder(state.stream);
    state.recorder = recorder;
    recorder.ondataavailable = (e) => e.data && e.data.size && state.chunks.push(e.data);
    recorder.onstop = () => {
      clearInterval(state.timer);
      stopStream();
      state.blob = new Blob(state.chunks, { type: recorder.mimeType || 'audio/webm' });
      state.url = URL.createObjectURL(state.blob);
      el.player.src = state.url;
      el.player.hidden = false;
      el.results.hidden = false;
      el.start.disabled = false;
      el.stop.disabled = true;
      toast('Recording saved. You can play or download it.', 'success');
    };

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
    if (state.blob) downloadBlob(state.blob, 'recording.' + extFor(state.blob.type));
  });

  el.mp3.addEventListener('click', async () => {
    if (!state.blob || state.busy) return;
    if (!window.lamejs) {
      toast('MP3 library failed to load. Check your internet and refresh.', 'error');
      return;
    }
    state.busy = true;
    el.mp3.disabled = true;
    el.progress.hidden = false;
    setProgress('rec', 5, 'Preparing…');
    try {
      const audio = await MT.decodeAudio(state.blob);
      const mp3 = await MT.encodeMp3(audio, 192, 0, audio.duration, (p) =>
        setProgress('rec', 10 + p * 85, 'Creating MP3… ' + Math.round(p * 100) + '%')
      );
      setProgress('rec', 100, 'Done.');
      downloadBlob(mp3, 'recording.mp3');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      toast('Could not create the MP3. Download the original recording instead.', 'error');
    } finally {
      state.busy = false;
      el.mp3.disabled = false;
    }
  });
})();
