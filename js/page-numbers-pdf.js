/* ==========================================================
   Convertly - page-numbers-pdf.js
   Tool: Page Numbers (draw a number on every PDF page)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('pagenums', 'Page Numbers', `
    ${UI.dropHtml('pagenums', 'application/pdf,.pdf', UI.ICON_PDF, 'Drop a PDF here or <u>browse</u>', 'A small number is drawn on every page.')}
    ${UI.cardHtml('pagenums', 'PDF')}
    <div class="options">
      <div class="field">
        <label for="pagenumsPos">Position</label>
        <select id="pagenumsPos">
          <option value="bc" selected>Bottom center</option>
          <option value="br">Bottom right</option>
          <option value="tc">Top center</option>
          <option value="tr">Top right</option>
        </select>
      </div>
      <div class="field">
        <label for="pagenumsStart">Start at</label>
        <input type="number" id="pagenumsStart" min="0" value="1" />
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="pagenumsBtn" type="button" disabled>Add page numbers</button></div>
  `);

  const el = {
    input: $('#pagenumsInput'),
    drop: $('#pagenumsDrop'),
    card: $('#pagenumsFileCard'),
    name: $('#pagenumsName'),
    meta: $('#pagenumsMeta'),
    remove: $('#pagenumsRemove'),
    pos: $('#pagenumsPos'),
    start: $('#pagenumsStart'),
    btn: $('#pagenumsBtn'),
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

  async function addNumbers() {
    if (!state.file || state.busy || !libsReady()) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Adding numbers…';

    try {
      const doc = await PDFLib.PDFDocument.load(await state.file.arrayBuffer());
      const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      const pos = el.pos.value; // 'bc' bottom center, 'br' bottom right, 'tc' top center, 'tr' top right
      let n = Number(el.start.value);
      if (!Number.isFinite(n) || n < 0) n = 1;

      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const label = String(n++);
        const labelWidth = font.widthOfTextAtSize(label, 10);
        const x = pos.includes('c') ? (width - labelWidth) / 2 : width - 24 - labelWidth;
        const y = pos[0] === 't' ? height - 24 : 24; // 't…' = top row, 'b…' = bottom row
        page.drawText(label, { x, y, size: 10, font, color: PDFLib.rgb(0.25, 0.25, 0.25) });
      });

      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(state.file.name) + '-numbered.pdf');
      toast('Page numbers added.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not add page numbers. The PDF may be damaged or protected.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Add page numbers';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => {
    choose(e.target.files);
    el.input.value = ''; // so the same file can be picked again
  });
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', addNumbers);
  setupDropzone(el.drop, choose);
})();
