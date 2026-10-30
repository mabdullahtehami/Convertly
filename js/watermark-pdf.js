/* ==========================================================
   Convertly - watermark-pdf.js
   Tool: Watermark PDF (stamp text across every page)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('watermark', 'Watermark PDF', `
    ${UI.dropHtml('watermark', 'application/pdf,.pdf', UI.ICON_PDF, 'Drop a PDF here or <u>browse</u>', 'The text is stamped across every page.')}
    ${UI.cardHtml('watermark', 'PDF')}
    <div class="options">
      <div class="field">
        <label for="watermarkText">Watermark text</label>
        <input type="text" id="watermarkText" value="CONFIDENTIAL" autocomplete="off" />
      </div>
      <div class="field">
        <label for="watermarkOpacity">Opacity</label>
        <select id="watermarkOpacity">
          <option value="0.15">Light</option>
          <option value="0.3" selected>Normal</option>
          <option value="0.5">Strong</option>
        </select>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="watermarkBtn" type="button" disabled>Add watermark</button></div>
  `);

  const el = {
    input: $('#watermarkInput'),
    drop: $('#watermarkDrop'),
    card: $('#watermarkFileCard'),
    name: $('#watermarkName'),
    meta: $('#watermarkMeta'),
    remove: $('#watermarkRemove'),
    text: $('#watermarkText'),
    opacity: $('#watermarkOpacity'),
    btn: $('#watermarkBtn'),
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

  async function addWatermark() {
    const text = el.text.value.trim();
    if (!text) {
      toast('Please enter the watermark text.', 'error');
      return;
    }
    if (!state.file || state.busy || !libsReady()) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Adding watermark…';

    try {
      const doc = await PDFLib.PDFDocument.load(await state.file.arrayBuffer());
      const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const color = PDFLib.rgb(0.45, 0.45, 0.45); // neutral grey reads on light and dark pages
      const opacity = Number(el.opacity.value);

      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        let size = Math.min(48, Math.round(width / 14)); // default watermark size
        const firstWidth = font.widthOfTextAtSize(text, size);
        if (firstWidth > width - 48) size = Math.floor((size * (width - 48)) / firstWidth); // shrink long text
        const textWidth = font.widthOfTextAtSize(text, size); // measure again after resizing
        page.drawText(text, {
          x: (width - textWidth) / 2, // centred horizontally
          y: (height - size) / 2, // centred vertically
          size,
          font,
          color,
          opacity,
        });
      });

      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(state.file.name) + '-watermarked.pdf');
      toast('Watermark added.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not add the watermark. The PDF may be damaged or protected.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Add watermark';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => {
    choose(e.target.files);
    el.input.value = ''; // so the same file can be picked again
  });
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', addWatermark);
  setupDropzone(el.drop, choose);
})();
