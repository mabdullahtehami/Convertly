/* ==========================================================
   Convertly - audio-converter.js
   Tool: Audio Converter (any audio file -> MP3 or WAV)
   ========================================================== */
'use strict';

(function () {
  const MAX_SIZE = 200 * 1024 * 1024; /* 200 MB */

  MT.addTool('audioconv', 'Audio Converter', `
    <h2 class="mt-title">Audio Converter</h2>
    <p class="mt-sub">Convert any audio file to MP3 or WAV, entirely in your browser.</p>
    ${MT.dropHtml('audioconv', 'audio/*', 'Drag and drop an audio file here')}
    ${MT.cardHtml('audioconv')}
    <div class="mt-row">
      <label>Format
        <select id="audioconvFormat" class="mt-input">
          <option value="mp3" selected>MP3</option>
          <option value="wav">WAV</option>
        </select>
      </label>
      <label>MP3 quality
        <select id="audioconvBitrate" class="mt-input">
          <option value="128">Standard (128 kbps)</option>
          <option value="192" selected>High (192 kbps)</option>
          <option value="320">Best (320 kbps)</option>
        </select>
      </label>
    </div>
    <button type="button" class="mt-btn mt-primary" id="audioconvBtn" disabled>Convert</button>
    ${MT.progressHtml('audioconv')}
    <div class="mt-result" id="audioconvResults" hidden>
      <button type="button" class="mt-btn mt-primary" id="audioconvDownload">Download</button>
    </div>
  `);

  const el = {
    input: $('#audioconvInput'),
    drop: $('#audioconvDrop'),
    card: $('#audioconvCard'),
    name: $('#audioconvName'),
    meta: $('#audioconvMeta'),
    remove: $('#audioconvRemove'),
    format: $('#audioconvFormat'),
    bitrate: $('#audioconvBitrate'),
    btn: $('#audioconvBtn'),
    progress: $('#audioconvProgress'),
    results: $('#audioconvResults'),
    download: $('#audioconvDownload'),
  };
  const state = { file: null, blob: null, busy: false };

  const isAudio = (f) => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name);

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isAudio(file)) {
      toast('Please choose an audio file.', 'error');
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
    const fmt = el.format.value;
    if (fmt === 'mp3' && !window.lamejs) {
      toast('MP3 library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Converting…';
    el.results.hidden = true;
    el.progress.hidden = false;
    setProgress('audioconv', 5, 'Reading file…');

    try {
      const audio = await MT.decodeAudio(state.file);

      if (fmt === 'wav') {
        state.blob = MT.encodeWav(audio, 0, audio.duration); // WAV is instant
        setProgress('audioconv', 100, 'WAV ready (' + formatBytes(state.blob.size) + ').');
      } else {
        state.blob = await MT.encodeMp3(audio, Number(el.bitrate.value), 0, audio.duration, (p) =>
          setProgress('audioconv', 20 + p * 75, 'Creating MP3… ' + Math.round(p * 100) + '%')
        );
        setProgress('audioconv', 100, 'MP3 ready (' + formatBytes(state.blob.size) + ').');
      }

      el.results.hidden = false;
      toast(fmt.toUpperCase() + ' created.', 'success');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      toast('Could not read audio from this file. Try MP3, WAV, M4A or OGG.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Convert';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => {
    choose(e.target.files);
    el.input.value = ''; // so the same file can be picked again
  });
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', convert);
  el.download.addEventListener('click', () => {
    if (state.blob && state.file) downloadBlob(state.blob, baseName(state.file.name) + '.' + el.format.value);
  });
  setupDropzone(el.drop, choose);
})();
