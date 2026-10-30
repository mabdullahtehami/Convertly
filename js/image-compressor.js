/* ==========================================================
   Convertly - image-compressor.js
   Tool: Image Compressor (re-encode an image as a smaller JPG)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('imgcomp', 'Image Compressor', `
    ${UI.dropHtml('imgcomp', 'image/*', UI.ICON_IMG, 'Drop an image here or <u>browse</u>', 'JPG, PNG or WebP in, one smaller JPG out.')}
    ${UI.cardHtml('imgcomp', 'JPG')}
    <div class="options">
      <div class="field">
        <label for="imgcompQuality">Quality <output id="imgcompQualityOut">80%</output></label>
        <input type="range" id="imgcompQuality" min="40" max="95" step="5" value="80" />
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="imgcompBtn" type="button" disabled>Compress image</button></div>
    <div class="results" id="imgcompResults" hidden>
      <div class="results-head">
        <h2 id="imgcompSummary">Your image is ready</h2>
        <button class="btn btn-primary btn-sm" id="imgcompDownload" type="button">Download JPG</button>
      </div>
    </div>
  `);

  const el = {
    input: $('#imgcompInput'),
    drop: $('#imgcompDrop'),
    card: $('#imgcompFileCard'),
    name: $('#imgcompName'),
    meta: $('#imgcompMeta'),
    remove: $('#imgcompRemove'),
    quality: $('#imgcompQuality'),
    qualityOut: $('#imgcompQualityOut'),
    btn: $('#imgcompBtn'),
    results: $('#imgcompResults'),
    summary: $('#imgcompSummary'),
    download: $('#imgcompDownload'),
  };
  const state = { file: null, blob: null, busy: false };

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    state.file = file;
    state.blob = null;
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.hidden = false;
    el.results.hidden = true;
    el.btn.disabled = false;
  }

  function reset() {
    state.file = state.blob = null;
    el.input.value = '';
    el.card.hidden = true;
    el.results.hidden = true;
    el.btn.disabled = true;
  }

  async function compress() {
    if (!state.file || state.busy) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Compressing…';
    el.results.hidden = true;

    try {
      const img = await UI.loadImage(state.file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // transparency becomes white in a JPG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      state.blob = await canvasToBlob(canvas, 'image/jpeg', Number(el.quality.value) / 100);
      canvas.width = canvas.height = 0; // give the memory back

      const before = state.file.size;
      const after = state.blob.size;
      const saved = Math.round((1 - after / before) * 100);
      if (after < before) {
        el.summary.textContent = formatBytes(before) + ' to ' + formatBytes(after) + ' (' + saved + '% smaller)';
        toast('Image compressed.', 'success');
      } else {
        el.summary.textContent = 'No size reduction. The original is already small.';
        toast('This image is already small. Try a lower quality.', 'error');
      }
      el.results.hidden = false;
    } catch (err) {
      console.error(err);
      toast('Could not read this image. Try JPG, PNG or WebP.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Compress image';
      el.btn.disabled = !state.file;
    }
  }

  el.quality.addEventListener('input', () => (el.qualityOut.textContent = el.quality.value + '%'));
  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', compress);
  el.download.addEventListener('click', () => {
    if (state.blob && state.file) downloadBlob(state.blob, baseName(state.file.name) + '-compressed.jpg');
  });
  setupDropzone(el.drop, choose);
})();
