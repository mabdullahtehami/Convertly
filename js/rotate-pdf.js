/* ==========================================================
   Convertly - rotate-pdf.js
   Tool: Rotate PDF (turn every page by the same angle)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('rotate', 'Rotate PDF', `
    ${UI.dropHtml('rotate', 'application/pdf,.pdf', UI.ICON_PDF, 'Drop a PDF here or <u>browse</u>', 'Every page is turned by the same angle.')}
    ${UI.cardHtml('rotate', 'PDF')}
    <div class="options">
      <div class="field">
        <label for="rotateAngle">Rotation</label>
        <select id="rotateAngle">
          <option value="90" selected>90° clockwise</option>
          <option value="180">180°</option>
          <option value="-90">90° counter-clockwise</option>
        </select>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="rotateBtn" type="button" disabled>Rotate PDF</button></div>
  `);

  const el = {
    input: $('#rotateInput'),
    drop: $('#rotateDrop'),
    card: $('#rotateFileCard'),
    name: $('#rotateName'),
    meta: $('#rotateMeta'),
    remove: $('#rotateRemove'),
    angle: $('#rotateAngle'),
    btn: $('#rotateBtn'),
  };
  const state = { file: null, busy: false };

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      toast('Please select a PDF file.', 'error');
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
    if (!state.file || state.busy || !libsReady()) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Rotating…';

    try {
      const doc = await PDFLib.PDFDocument.load(await state.file.arrayBuffer());
      const deg = Number(el.angle.value);
      doc.getPages().forEach((page) => {
        const angle = (page.getRotation().angle + deg + 360) % 360; // keep it between 0 and 359
        page.setRotation(PDFLib.degrees(angle));
      });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(state.file.name) + '-rotated.pdf');
      toast('PDF rotated.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not rotate this PDF. It may be damaged or protected.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Rotate PDF';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', rotate);
  setupDropzone(el.drop, choose);
})();
