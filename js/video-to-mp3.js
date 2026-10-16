/* ==========================================================
   Convertly - video-to-mp3.js
   Tool: Video / Audio -> MP3
   ========================================================== */
'use strict';

(function () {
  const MAX_SIZE = 200 * 1024 * 1024; /* 200 MB */

  MT.addTool('mp3', 'Video to MP3', `
    <h2 class="mt-title">Video / Audio to MP3</h2>
    <p class="mt-sub">Take the sound out of a video (MP4, WebM, MOV) or convert an audio file to MP3.</p>
    ${MT.dropHtml('mp3', 'video/*,audio/*', 'Drag and drop a video or audio file here')}
    ${MT.cardHtml('mp3')}
    <div class="mt-row">
      <label>Quality
        <select id="mp3Bitrate" class="mt-input">
          <option value="128">Standard (128 kbps)</option>
          <option value="192" selected>High (192 kbps)</option>
          <option value="320">Best (320 kbps)</option>
        </select>
      </label>
    </div>
    <button type="button" class="mt-btn mt-primary" id="mp3Btn" disabled>Convert to MP3</button>
    ${MT.progressHtml('mp3')}
    <div class="mt-result" id="mp3Results" hidden>
      <button type="button" class="mt-btn mt-primary" id="mp3Download">Download MP3</button>
    </div>
  `);

  const el = {
    input: $('#mp3Input'),
    drop: $('#mp3Drop'),
    card: $('#mp3Card'),
    name: $('#mp3Name'),
    meta: $('#mp3Meta'),
    remove: $('#mp3Remove'),
    bitrate: $('#mp3Bitrate'),
    btn: $('#mp3Btn'),
    progress: $('#mp3Progress'),
    results: $('#mp3Results'),
    download: $('#mp3Download'),
  };
  const state = { file: null, blob: null, busy: false };

  const isMedia = (f) =>
    f.type.startsWith('video/') ||
    f.type.startsWith('audio/') ||
    /\.(mp4|mov|webm|mkv|avi|mp3|wav|m4a|ogg|aac)$/i.test(f.name);

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isMedia(file)) {
      toast('Please choose a video or audio file.', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast('Please choose a file smaller than 200 MB.', 'error');
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

  async function convert() {
    if (!state.file || state.busy) return;
    if (!window.lamejs) {
      toast('MP3 library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Converting…';
    el.results.hidden = true;
    el.progress.hidden = false;
    setProgress('mp3', 5, 'Reading file…');

    try {
      setProgress('mp3', 15, 'Extracting audio…');
      await nextFrame();
      const audio = await MT.decodeAudio(state.file);

      state.blob = await MT.encodeMp3(audio, Number(el.bitrate.value), 0, audio.duration, (p) =>
        setProgress('mp3', 20 + p * 75, 'Creating MP3… ' + Math.round(p * 100) + '%')
      );

      setProgress('mp3', 100, 'MP3 ready (' + formatBytes(state.blob.size) + ').');
      el.results.hidden = false;
      toast('MP3 created.', 'success');
    } catch (err) {
      console.error('Video to MP3 error:', err);
      el.progress.hidden = true;
      toast('Could not read audio from this file. Try MP4, WebM, MP3 or WAV.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Convert to MP3';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', convert);
  el.download.addEventListener('click', () => {
    if (state.blob && state.file) downloadBlob(state.blob, baseName(state.file.name) + '.mp3');
  });
  setupDropzone(el.drop, choose);
})();
