/* ==========================================================
   Convertly - image-converter.js
   Tool: Image Converter (JPG <-> PNG <-> WebP via canvas)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('imgconv', 'Image Converter', `
    ${UI.dropHtml('imgconv', 'image/*', UI.ICON_IMG, 'Drop an image here or <u>browse</u>', 'JPG, PNG or WebP in, any of them out.')}
    ${UI.cardHtml('imgconv', 'IMG')}
    <div class="options">
      <div class="field">
        <label for="imgconvFormat">Convert to</label>
        <select id="imgconvFormat">
          <option value="jpg" selected>JPG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
        </select>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="imgconvBtn" type="button" disabled>Convert image</button></div>
  `);

  const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

  const el = {
    input: $('#imgconvInput'),
    drop: $('#imgconvDrop'),
    card: $('#imgconvFileCard'),
    name: $('#imgconvName'),
    meta: $('#imgconvMeta'),
    remove: $('#imgconvRemove'),
    format: $('#imgconvFormat'),
    btn: $('#imgconvBtn'),
  };
  const state = { file: null, busy: false };

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    state.file = file;
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.hidden = false;
    el.btn.disabled = false;
  }

  function reset() {
    state.file = null;
    el.input.value = '';
    el.card.hidden = true;
    el.btn.disabled = true;
  }

  async function convert() {
    if (!state.file || state.busy) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Converting…';

    try {
      const img = await UI.loadImage(state.file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (el.format.value === 'jpg') {
        ctx.fillStyle = '#ffffff'; // JPG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, TYPES[el.format.value], 0.92);
      canvas.width = canvas.height = 0; // give the memory back

      const out = UI.imageOut(blob.type); // use what the browser really produced
      downloadBlob(blob, baseName(state.file.name) + '.' + out.ext);
      toast('Image converted to ' + out.ext.toUpperCase() + '.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not read this image. Try JPG, PNG or WebP.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Convert image';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', convert);
  setupDropzone(el.drop, choose);
})();
