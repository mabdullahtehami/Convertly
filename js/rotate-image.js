/* ==========================================================
   Convertly - rotate-image.js
   Tool: Rotate Image (90° / 180° turns on a canvas)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('imgrot', 'Rotate Image', `
    ${UI.dropHtml('imgrot', 'image/*', UI.ICON_IMG, 'Drop an image here or <u>browse</u>', 'Turn the picture by 90° or 180°.')}
    ${UI.cardHtml('imgrot', 'IMG')}
    <div class="options">
      <div class="field">
        <label for="imgrotDir">Rotation</label>
        <select id="imgrotDir">
          <option value="90" selected>90° clockwise</option>
          <option value="-90">90° counter-clockwise</option>
          <option value="180">180°</option>
        </select>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="imgrotBtn" type="button" disabled>Rotate image</button></div>
  `);

  const el = {
    input: $('#imgrotInput'),
    drop: $('#imgrotDrop'),
    card: $('#imgrotFileCard'),
    name: $('#imgrotName'),
    meta: $('#imgrotMeta'),
    remove: $('#imgrotRemove'),
    dir: $('#imgrotDir'),
    btn: $('#imgrotBtn'),
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

  async function rotate() {
    if (!state.file || state.busy) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Rotating…';

    try {
      const img = await UI.loadImage(state.file);
      const turn = Number(el.dir.value);
      const swap = Math.abs(turn) === 90; // a quarter turn swaps width and height

      const canvas = document.createElement('canvas');
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext('2d');

      const out = UI.imageOut(state.file.type);
      if (out.mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'; // transparency becomes white in a JPG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.translate(canvas.width / 2, canvas.height / 2); // turn around the centre
      ctx.rotate((turn * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const blob = await canvasToBlob(canvas, out.mime, 0.92);
      canvas.width = canvas.height = 0; // give the memory back

      downloadBlob(blob, baseName(state.file.name) + '-rotated.' + out.ext);
      toast('Image rotated.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not read this image. Try JPG, PNG or WebP.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Rotate image';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', rotate);
  setupDropzone(el.drop, choose);
})();
