/* ==========================================================
   Convertly - image-resizer.js
   Tool: Image Resizer (new width / height, aspect ratio lock)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('imgsize', 'Image Resizer', `
    ${UI.dropHtml('imgsize', 'image/*', UI.ICON_IMG, 'Drop an image here or <u>browse</u>', 'Set a new width or height in pixels.')}
    ${UI.cardHtml('imgsize', 'IMG')}
    <div class="options">
      <div class="field">
        <label for="imgsizeW">Width (px)</label>
        <input type="number" id="imgsizeW" min="1" max="8000" disabled />
      </div>
      <div class="field">
        <label for="imgsizeH">Height (px)</label>
        <input type="number" id="imgsizeH" min="1" max="8000" disabled />
      </div>
    </div>
    <p class="hint note">
      <label><input type="checkbox" id="imgsizeLock" checked /> Keep the aspect ratio</label>
    </p>
    <div class="actions"><button class="btn btn-primary" id="imgsizeBtn" type="button" disabled>Resize image</button></div>
  `);

  const el = {
    input: $('#imgsizeInput'),
    drop: $('#imgsizeDrop'),
    card: $('#imgsizeFileCard'),
    name: $('#imgsizeName'),
    meta: $('#imgsizeMeta'),
    remove: $('#imgsizeRemove'),
    w: $('#imgsizeW'),
    h: $('#imgsizeH'),
    lock: $('#imgsizeLock'),
    btn: $('#imgsizeBtn'),
  };
  const state = { file: null, img: null, ratio: 1, busy: false };

  async function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    try {
      const img = await UI.loadImage(file);
      state.file = file;
      state.img = img;
      state.ratio = img.naturalWidth / img.naturalHeight;
      el.name.textContent = file.name;
      el.meta.textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' · ' + formatBytes(file.size);
      el.card.hidden = false;
      el.w.value = img.naturalWidth; // start with the original size
      el.h.value = img.naturalHeight;
      el.w.disabled = el.h.disabled = false;
      el.btn.disabled = false;
    } catch (err) {
      console.error(err);
      toast('Could not read this image. Try JPG, PNG or WebP.', 'error');
    }
  }

  function reset() {
    state.file = state.img = null;
    el.input.value = '';
    el.card.hidden = true;
    el.w.value = el.h.value = '';
    el.w.disabled = el.h.disabled = true;
    el.btn.disabled = true;
  }

  /* Keep the other field in step while the ratio lock is on */
  function syncWidth() {
    if (el.lock.checked && el.w.value) el.h.value = Math.max(1, Math.round(Number(el.w.value) / state.ratio));
  }
  function syncHeight() {
    if (el.lock.checked && el.h.value) el.w.value = Math.max(1, Math.round(Number(el.h.value) * state.ratio));
  }

  async function resize() {
    if (!state.file || !state.img || state.busy) return;
    const w = Math.round(Number(el.w.value));
    const h = Math.round(Number(el.h.value));
    if (!(w >= 1 && w <= 8000 && h >= 1 && h <= 8000)) {
      toast('Enter a size between 1 and 8000 pixels.', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Resizing…';

    try {
      const out = UI.imageOut(state.file.type);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (out.mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'; // transparency becomes white in a JPG
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(state.img, 0, 0, w, h);
      const blob = await canvasToBlob(canvas, out.mime, 0.92);
      canvas.width = canvas.height = 0; // give the memory back

      downloadBlob(blob, baseName(state.file.name) + '-' + w + 'x' + h + '.' + out.ext);
      toast('Image resized to ' + w + ' × ' + h + '.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not resize this image. Try another file.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Resize image';
      el.btn.disabled = !state.file;
    }
  }

  el.w.addEventListener('input', syncWidth);
  el.h.addEventListener('input', syncHeight);
  el.input.addEventListener('change', (e) => {
    choose(e.target.files);
    el.input.value = ''; // so the same file can be picked again
  });
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', resize);
  setupDropzone(el.drop, choose);
})();
