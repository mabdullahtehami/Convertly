/* ==========================================================
   Convertly - pdf-to-text.js
   Tool: PDF -> TXT (text based PDFs, same line grouping as pdf-to-docx.js)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('pdftotxt', 'PDF to Text', `
    ${UI.dropHtml('pdftotxt', 'application/pdf,.pdf', UI.ICON_LINES, 'Drop a PDF here or <u>browse</u>', 'Text-based PDFs only. Scanned PDFs have no selectable text.')}
    ${UI.cardHtml('pdftotxt', 'PDF')}
    <div class="actions"><button class="btn btn-primary" id="pdftotxtBtn" type="button" disabled>Extract text</button></div>
    ${UI.progressHtml('pdftotxt')}
  `);

  const el = {
    input: $('#pdftotxtInput'),
    drop: $('#pdftotxtDrop'),
    card: $('#pdftotxtFileCard'),
    name: $('#pdftotxtName'),
    meta: $('#pdftotxtMeta'),
    remove: $('#pdftotxtRemove'),
    btn: $('#pdftotxtBtn'),
    progress: $('#pdftotxtProgress'),
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
    el.progress.hidden = true;
    el.btn.disabled = true;
  }

  async function convert() {
    if (!state.file || state.busy) return;
    if (!window.pdfjsLib) {
      toast('PDF library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Extracting…';
    el.progress.hidden = false;
    setProgress('pdftotxt', 0, 'Reading PDF…');

    let pdf;
    try {
      const data = new Uint8Array(await state.file.arrayBuffer());
      pdf = await pdfjsLib.getDocument({ data }).promise;
      const total = pdf.numPages;
      const pages = [];

      for (let n = 1; n <= total; n++) {
        setProgress('pdftotxt', ((n - 1) / total) * 90, 'Reading page ' + n + ' of ' + total + '…');
        await nextFrame(); // let the progress bar repaint between pages

        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        const lines = new Map(); // group the scattered words back into lines

        for (const item of content.items) {
          if (!item.str || !item.str.trim() || !item.transform) continue;
          const key = Math.round(item.transform[5] / 3) * 3; // same rounded Y = same line
          if (!lines.has(key)) lines.set(key, []);
          lines.get(key).push({ x: item.transform[4], text: item.str });
        }

        const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]); // top to bottom
        pages.push(
          sorted
            .map(([, words]) => words.sort((a, b) => a.x - b.x).map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim()) // left to right
            .filter(Boolean)
            .join('\n')
        );
        page.cleanup();
      }

      const text = pages.join('\n\n');
      if (!text.trim()) throw new Error('No selectable text was found.');

      setProgress('pdftotxt', 100, 'Done.');
      downloadBlob(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }), baseName(state.file.name) + '.txt');
      toast('Text extracted.', 'success');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      if (err && err.message === 'No selectable text was found.') {
        toast('No selectable text was found. This PDF is probably a scan.', 'error');
      } else {
        toast('Could not read this PDF. It may be damaged or protected.', 'error');
      }
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      state.busy = false;
      el.btn.textContent = 'Extract text';
      el.btn.disabled = !state.file;
    }
  }

  el.input.addEventListener('change', (e) => {
    choose(e.target.files);
    el.input.value = ''; // so the same file can be picked again
  });
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', convert);
  setupDropzone(el.drop, choose);
})();
