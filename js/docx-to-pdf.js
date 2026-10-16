/* ==========================================================
   Convertly - docx-to-pdf.js
   3) DOCX -> PDF
   ========================================================== */
'use strict';

(function () {
  const el = {
    input: $('#docxInput'),
    drop: $('#docxDrop'),
    card: $('#docxFileCard'),
    name: $('#docxName'),
    meta: $('#docxMeta'),
    remove: $('#docxRemove'),
    convert: $('#docxConvert'),
    progress: $('#docxProgress'),
    bar: $('#docxBar'),
    results: $('#docxResults'),
    download: $('#docxDownload'),
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
    if (!/\.docx$/i.test(file.name)) {
      toast('Please select a .docx Word document.', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast('Please choose a DOCX file smaller than 25 MB.', 'error');
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
    if (!window.mammoth || typeof window.html2pdf !== 'function') {
      toast('A conversion library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    state.busy = true;
    el.convert.disabled = true;
    el.convert.textContent = 'Converting…';
    el.progress.hidden = false;
    el.results.hidden = true;
    setProgress('docx', 10, 'Reading Word document…');

    let container;
    try {
      const arrayBuffer = await state.file.arrayBuffer();
      const result = await window.mammoth.convertToHtml({ arrayBuffer });

      container = document.createElement('div');
      container.style.cssText =
        'position:fixed;left:-10000px;top:0;width:794px;padding:40px;' +
        'background:#fff;color:#222;font:14px Arial,sans-serif;overflow-wrap:break-word;';

      const style = document.createElement('style');
      style.textContent =
        'h1,h2,h3{page-break-after:avoid}p{line-height:1.5}' +
        'img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}' +
        'td,th{border:1px solid #ccc;padding:5px}';
      container.append(style);

      const content = document.createElement('div');
      content.innerHTML = result.value;
      container.append(content);
      document.body.append(container);

      setProgress('docx', 35, 'Preparing PDF…');

      const blob = await window.html2pdf()
        .set({
          margin: 10,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 1.5, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(container)
        .outputPdf('blob');

      if (!blob || !blob.size) throw new Error('The PDF output was empty.');

      state.blob = blob;
      el.results.hidden = false;
      setProgress('docx', 100, 'PDF ready to download.');
      toast('DOCX to PDF conversion complete.', 'success');
    } catch (err) {
      console.error('DOCX to PDF error:', err);
      el.progress.hidden = true;
      toast('Could not convert this Word file. Try another DOCX file.', 'error');
    } finally {
      if (container) container.remove();
      state.busy = false;
      el.convert.disabled = !state.file;
      el.convert.textContent = 'Convert to PDF';
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.convert.addEventListener('click', convert);
  el.download.addEventListener('click', () => {
    if (state.blob && state.file) downloadBlob(state.blob, baseName(state.file.name) + '.pdf');
  });
  setupDropzone(el.drop, choose);
})();
