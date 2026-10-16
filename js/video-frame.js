/* ==========================================================
   Convertly - video-frame.js
   Tool: Video to Image (save any frame of a video as JPG / PNG)
   ========================================================== */
'use strict';

(function () {
  MT.addTool('vframe', 'Video to Image', `
    <h2 class="mt-title">Video to Image</h2>
    <p class="mt-sub">Play or drag the video to the moment you want, then capture that frame as a picture.</p>
    ${MT.dropHtml('vframe', 'video/*', 'Drag and drop a video file here')}
    ${MT.cardHtml('vframe')}
    <video id="vframePlayer" class="mt-media" controls playsinline hidden></video>
    <div class="mt-row" id="vframeOptions" hidden>
      <label>Save as
        <select id="vframeFormat" class="mt-input">
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
        </select>
      </label>
      <button type="button" class="mt-btn mt-primary" id="vframeBtn">Capture this frame</button>
    </div>
    <div class="mt-result" id="vframeResults" hidden>
      <img id="vframePreview" class="mt-media" alt="Captured frame" style="max-height:220px">
      <button type="button" class="mt-btn mt-primary" id="vframeDownload">Download image</button>
    </div>
  `);

  const el = {
    input: $('#vframeInput'),
    drop: $('#vframeDrop'),
    card: $('#vframeCard'),
    name: $('#vframeName'),
    meta: $('#vframeMeta'),
    remove: $('#vframeRemove'),
    player: $('#vframePlayer'),
    options: $('#vframeOptions'),
    format: $('#vframeFormat'),
    btn: $('#vframeBtn'),
    results: $('#vframeResults'),
    preview: $('#vframePreview'),
    download: $('#vframeDownload'),
  };
  const state = { file: null, url: null, blob: null, previewUrl: null, ext: 'jpg' };

  function clearUrls() {
    if (state.url) URL.revokeObjectURL(state.url);
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.url = state.previewUrl = null;
  }

  function reset() {
    clearUrls();
    state.file = state.blob = null;
    el.input.value = '';
    el.player.pause();
    el.player.removeAttribute('src');
    el.player.hidden = true;
    el.card.hidden = true;
    el.options.hidden = true;
    el.results.hidden = true;
  }

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!(file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name))) {
      toast('Please choose a video file.', 'error');
      return;
    }
    clearUrls();
    state.file = file;
    state.blob = null;
    state.url = URL.createObjectURL(file);
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.hidden = false;
    el.player.src = state.url;
    el.player.hidden = false;
    el.options.hidden = false;
    el.results.hidden = true;
  }

  async function capture() {
    const v = el.player;
    if (!v.videoWidth) {
      toast('The video is still loading. Try again in a moment.', 'error');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);

      const isPng = el.format.value === 'png';
      state.ext = isPng ? 'png' : 'jpg';
      state.blob = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.92);

      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = URL.createObjectURL(state.blob);
      el.preview.src = state.previewUrl;
      el.results.hidden = false;
      toast('Frame captured.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not capture this frame.', 'error');
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', capture);
  el.download.addEventListener('click', () => {
    if (!state.blob || !state.file) return;
    const t = Math.round(el.player.currentTime * 10) / 10;
    downloadBlob(state.blob, baseName(state.file.name) + '-' + t + 's.' + state.ext);
  });
  setupDropzone(el.drop, choose);
})();
