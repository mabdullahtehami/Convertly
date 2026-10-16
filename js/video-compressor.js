/* ==========================================================
   Convertly - video-compressor.js
   Tool: Video Compressor (re-records the video as a smaller WebM)
   NOTE: runs in real time, so a 2 minute video takes about 2 minutes.
   ========================================================== */
'use strict';

(function () {
  MT.addTool('vcomp', 'Video Compressor', `
    <h2 class="mt-title">Video Compressor</h2>
    <p class="mt-sub">Make a video smaller. The result is saved as a WebM file.</p>
    ${MT.dropHtml('vcomp', 'video/*', 'Drag and drop a video file here')}
    ${MT.cardHtml('vcomp')}
    <div class="mt-row">
      <label>Size
        <select id="vcompSize" class="mt-input">
          <option value="0">Keep original size</option>
          <option value="720">720p</option>
          <option value="480" selected>480p</option>
          <option value="360">360p</option>
        </select>
      </label>
      <label>Quality
        <select id="vcompQuality" class="mt-input">
          <option value="2500000">High</option>
          <option value="1200000" selected>Medium</option>
          <option value="600000">Small file</option>
        </select>
      </label>
      <label class="mt-check"><input type="checkbox" id="vcompMute"> Remove sound</label>
    </div>
    <p class="mt-note">Keep this tab open and visible while compressing. It runs at the speed of the video.</p>
    <button type="button" class="mt-btn mt-primary" id="vcompBtn" disabled>Compress video</button>
    ${MT.progressHtml('vcomp')}
    <div class="mt-result" id="vcompResults" hidden>
      <span id="vcompSummary"></span>
      <button type="button" class="mt-btn mt-primary" id="vcompDownload">Download video</button>
    </div>
  `);

  const el = {
    input: $('#vcompInput'),
    drop: $('#vcompDrop'),
    card: $('#vcompCard'),
    name: $('#vcompName'),
    meta: $('#vcompMeta'),
    remove: $('#vcompRemove'),
    size: $('#vcompSize'),
    quality: $('#vcompQuality'),
    mute: $('#vcompMute'),
    btn: $('#vcompBtn'),
    progress: $('#vcompProgress'),
    results: $('#vcompResults'),
    summary: $('#vcompSummary'),
    download: $('#vcompDownload'),
  };
  const state = { file: null, blob: null, busy: false };

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!(file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name))) {
      toast('Please choose a video file.', 'error');
      return;
    }
    state.file = file;
    state.blob = null;
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.hidden = false;
    el.results.hidden = true;
    el.progress.hidden = true;
    el.btn.disabled = false;
  }

  function reset() {
    state.file = state.blob = null;
    el.input.value = '';
    el.card.hidden = true;
    el.results.hidden = true;
    el.progress.hidden = true;
    el.btn.disabled = true;
  }

  async function compress() {
    if (!state.file || state.busy) return;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      toast('Your browser does not support video compression. Please use Chrome, Edge or Firefox.', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Compressing…';
    el.results.hidden = true;
    el.progress.hidden = false;
    setProgress('vcomp', 0, 'Preparing…');

    const url = URL.createObjectURL(state.file);
    const video = document.createElement('video');
    const mute = el.mute.checked;
    let actx = null;
    let raf = 0;

    try {
      video.src = url;
      video.playsInline = true;
      video.muted = mute;
      video.preload = 'auto';
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('Cannot read this video.'));
      });

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const targetH = Number(el.size.value) || srcH;
      const scale = Math.min(1, targetH / srcH);
      const w = Math.max(2, Math.round((srcW * scale) / 2) * 2);
      const h = Math.max(2, Math.round((srcH * scale) / 2) * 2);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);

      /* Sound goes into the recording but not to the speakers */
      if (!mute) {
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        const source = actx.createMediaElementSource(video);
        const dest = actx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        await actx.resume();
      }

      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) =>
        MediaRecorder.isTypeSupported(m)
      );
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: Number(el.quality.value),
        audioBitsPerSecond: 96000,
      });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      const stopped = new Promise((resolve) => (recorder.onstop = resolve));
      const ended = new Promise((resolve) => (video.onended = resolve));

      const draw = () => {
        ctx.drawImage(video, 0, 0, w, h);
        if (isFinite(video.duration) && video.duration > 0) {
          const pct = Math.min(99, (video.currentTime / video.duration) * 100);
          setProgress('vcomp', pct, 'Compressing… ' + Math.round(pct) + '% (keep this tab open)');
        }
        raf = requestAnimationFrame(draw);
      };

      recorder.start(1000);
      draw();
      await video.play();
      await ended;

      cancelAnimationFrame(raf);
      recorder.stop();
      await stopped;

      state.blob = new Blob(chunks, { type: 'video/webm' });
      const before = state.file.size;
      const after = state.blob.size;
      el.summary.textContent =
        formatBytes(before) + ' to ' + formatBytes(after) +
        (after < before ? ' (' + Math.round((1 - after / before) * 100) + '% smaller)' : ' (not smaller, try Small file)');
      setProgress('vcomp', 100, 'Done.');
      el.results.hidden = false;
      toast('Video compressed.', 'success');
    } catch (err) {
      console.error('Video compress error:', err);
      el.progress.hidden = true;
      toast('Could not compress this video. Try another file.', 'error');
    } finally {
      cancelAnimationFrame(raf);
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      if (actx && actx.close) actx.close().catch(() => {});
      state.busy = false;
      el.btn.textContent = 'Compress video';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', compress);
  el.download.addEventListener('click', () => {
    if (state.blob && state.file) downloadBlob(state.blob, baseName(state.file.name) + '-compressed.webm');
  });
  setupDropzone(el.drop, choose);
})();
