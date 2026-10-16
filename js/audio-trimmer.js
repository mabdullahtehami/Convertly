/* ==========================================================
   Convertly - audio-trimmer.js
   Tool: Audio Trimmer (cut a part of audio, save as MP3 or WAV)
   ========================================================== */
'use strict';

(function () {
  const MAX_SIZE = 200 * 1024 * 1024; /* 200 MB */

  MT.addTool('trim', 'Audio Trimmer', `
    <h2 class="mt-title">Audio Trimmer</h2>
    <p class="mt-sub">Cut the part you want from an audio file (or the audio of a video). Save as MP3 or WAV.</p>
    ${MT.dropHtml('trim', 'audio/*,video/*', 'Drag and drop an audio file here')}
    ${MT.cardHtml('trim')}
    <audio id="trimPlayer" class="mt-media" controls hidden></audio>
    <div class="mt-row" id="trimOptions" hidden>
      <label>Start (seconds)
        <input type="number" id="trimStart" class="mt-input" min="0" step="0.1" value="0">
      </label>
      <label>End (seconds)
        <input type="number" id="trimEnd" class="mt-input" min="0" step="0.1" value="0">
      </label>
      <label>Save as
        <select id="trimFormat" class="mt-input">
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
        </select>
      </label>
    </div>
    <button type="button" class="mt-btn mt-primary" id="trimBtn" disabled>Trim audio</button>
    ${MT.progressHtml('trim')}
  `);

  const el = {
    input: $('#trimInput'),
    drop: $('#trimDrop'),
    card: $('#trimCard'),
    name: $('#trimName'),
    meta: $('#trimMeta'),
    remove: $('#trimRemove'),
    player: $('#trimPlayer'),
    options: $('#trimOptions'),
    start: $('#trimStart'),
    end: $('#trimEnd'),
    format: $('#trimFormat'),
    btn: $('#trimBtn'),
    progress: $('#trimProgress'),
  };
  const state = { file: null, buffer: null, url: null, busy: false };

  function clearUrl() {
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = null;
  }

  function reset() {
    clearUrl();
    state.file = state.buffer = null;
    el.input.value = '';
    el.player.removeAttribute('src');
    el.player.hidden = true;
    el.card.hidden = true;
    el.options.hidden = true;
    el.progress.hidden = true;
    el.btn.disabled = true;
  }

  async function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!(file.type.startsWith('audio/') || file.type.startsWith('video/') || /\.(mp3|wav|m4a|ogg|aac|mp4|webm|mov)$/i.test(file.name))) {
      toast('Please choose an audio or video file.', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast('Please choose a file smaller than 200 MB.', 'error');
      return;
    }

    toast('Reading audio…');
    try {
      const buffer = await MT.decodeAudio(file);
      clearUrl();
      state.file = file;
      state.buffer = buffer;
      state.url = URL.createObjectURL(file);

      el.name.textContent = file.name;
      el.meta.textContent = formatBytes(file.size) + ', length ' + MT.formatTime(buffer.duration);
      el.card.hidden = false;
      el.player.src = state.url;
      el.player.hidden = false;
      el.options.hidden = false;
      el.start.value = '0';
      el.end.value = buffer.duration.toFixed(1);
      el.end.max = buffer.duration.toFixed(1);
      el.btn.disabled = false;
      el.progress.hidden = true;
    } catch (err) {
      console.error(err);
      toast('Could not read audio from this file.', 'error');
    }
  }

  async function trim() {
    if (!state.buffer || state.busy) return;
    const duration = state.buffer.duration;
    const start = Number(el.start.value);
    const end = Number(el.end.value);

    if (!(start >= 0) || !(end > start) || end > duration + 0.05) {
      toast('Enter a valid start and end time (file length is ' + duration.toFixed(1) + ' s).', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Trimming…';
    el.progress.hidden = false;
    setProgress('trim', 5, 'Working…');

    try {
      const stem = baseName(state.file.name) + '-trimmed';
      await nextFrame();
      if (el.format.value === 'wav') {
        const blob = MT.encodeWav(state.buffer, start, end);
        setProgress('trim', 100, 'Done.');
        downloadBlob(blob, stem + '.wav');
      } else {
        const blob = await MT.encodeMp3(state.buffer, 192, start, end, (p) =>
          setProgress('trim', 5 + p * 90, 'Creating MP3… ' + Math.round(p * 100) + '%')
        );
        setProgress('trim', 100, 'Done.');
        downloadBlob(blob, stem + '.mp3');
      }
      toast('Audio trimmed.', 'success');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      toast('Could not trim this audio.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Trim audio';
      el.btn.disabled = !state.buffer;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', trim);
  setupDropzone(el.drop, choose);
})();
