/* ==========================================================
   Convertly - pdf-to-docx.js
   4) PDF -> DOCX (text based PDFs)
   ========================================================== */
'use strict';

(function () {
  const el = {
    input: $('#wordPdfInput'),
    drop: $('#wordPdfDrop'),
    card: $('#wordPdfFileCard'),
    name: $('#wordPdfName'),
    meta: $('#wordPdfMeta'),
    remove: $('#wordPdfRemove'),
    convert: $('#wordPdfConvert'),
    progress: $('#wordPdfProgress'),
    bar: $('#wordPdfBar'),
    results: $('#wordPdfResults'),
    download: $('#wordPdfDownload'),
  };
  const state = { file: null, blob: null, busy: false };

  function reset() {
    state.file = null;
    state.blob = null;
    el.input.value = '';
    el.card.hidden = true;
    el.results.hidden = true;
    el.progress.hidden = true;
    el.convert.disabled = true;
    el.bar.style.width = '0%';
  }

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      toast('Please select a PDF file.', 'error');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast('Please choose a PDF smaller than 30 MB.', 'error');
      return;
    }
    state.file = file;
    state.blob = null;
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.hidden = false;
    el.results.hidden = true;
    el.convert.disabled = false;
  }

  async function convert() {
    if (!state.file || state.busy) return;
    if (!window.pdfjsLib || !window.docx || !window.docx.Document || !window.docx.Packer) {
      toast('A required library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    state.busy = true;
    el.convert.disabled = true;
    el.convert.textContent = 'Converting…';
    el.progress.hidden = false;
    el.results.hidden = true;
    setProgress('wordPdf', 0, 'Reading PDF…');

    let pdf;
    try {
      const data = new Uint8Array(await state.file.arrayBuffer());
      pdf = await window.pdfjsLib.getDocument({ data }).promise;

      const D = window.docx;
      const paragraphs = [];
      const total = pdf.numPages;

      for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
        setProgress(
          'wordPdf',
          Math.round(((pageNumber - 1) / total) * 80),
          'Extracting text from page ' + pageNumber + ' of ' + total + '…'
        );
        await nextFrame();

        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines = new Map();

        for (const item of content.items) {
          if (!item.str || !item.str.trim() || !item.transform) continue;
          const key = Math.round(item.transform[5] / 3) * 3;
          if (!lines.has(key)) lines.set(key, []);
          lines.get(key).push({ x: item.transform[4], text: item.str });
        }

        const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]);
        let first = true;

        for (const [, words] of sorted) {
          words.sort((a, b) => a.x - b.x);
          const lineText = words.map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim();
          if (!lineText) continue;
          paragraphs.push(
            new D.Paragraph({
              children: [new D.TextRun({ text: lineText })],
              pageBreakBefore: first && pageNumber > 1,
            })
          );
          first = false;
        }
        page.cleanup();
      }

      if (!paragraphs.length) throw new Error('No selectable text was found in the PDF.');

      setProgress('wordPdf', 85, 'Creating Word document…');
      const documentFile = new D.Document({ sections: [{ children: paragraphs }] });
      state.blob = await D.Packer.toBlob(documentFile);

      el.results.hidden = false;
      setProgress('wordPdf', 100, 'Word document ready to download.');
      toast('PDF text converted to DOCX.', 'success');
    } catch (err) {
      console.error('PDF to DOCX error:', err);
      el.progress.hidden = true;
      toast('Could not convert this PDF. It may be damaged, protected, or scanned.', 'error');
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      state.busy = false;
      el.convert.disabled = !state.file;
      el.convert.textContent = 'Convert to DOCX';
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.convert.addEventListener('click', convert);
  el.download.addEventListener('click', () => {
    if (state.blob && state.file) downloadBlob(state.blob, baseName(state.file.name) + '.docx');
  });
  setupDropzone(el.drop, choose);
})();
