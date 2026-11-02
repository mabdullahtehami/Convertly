/* ==========================================================
   Convertly - ocr.js
   Tool: Image & PDF OCR (Tesseract.js, English)
   The Tesseract library is fetched from jsDelivr
   the first time a file is scanned.
   ========================================================== */
'use strict';

(function () {
  UI.addTool('ocr', 'Image & PDF OCR', `
    ${UI.dropHtml('ocr', 'image/*,application/pdf,.pdf', UI.ICON_LINES, 'Drop an image or PDF here or <u>browse</u>', 'Text from scans, photos and screenshots. Nothing leaves your browser.')}
    ${UI.cardHtml('ocr', 'OCR')}
    <div class="actions"><button class="btn btn-primary" id="ocrBtn" type="button" disabled>Scan for text</button></div>
    ${UI.progressHtml('ocr')}
    <div class="results" id="ocrResults" hidden>
      <div class="results-head">
        <h2 id="ocrSummary">Text found</h2>
        <button class="btn btn-primary btn-sm" id="ocrDownload" type="button">Download TXT</button>
      </div>
      <textarea id="ocrText" rows="10" readonly></textarea>
    </div>
  `);

  const el = {
    input: $('#ocrInput'),
    drop: $('#ocrDrop'),
    card: $('#ocrFileCard'),
    name: $('#ocrName'),
    meta: $('#ocrMeta'),
    remove: $('#ocrRemove'),
    btn: $('#ocrBtn'),
    progress: $('#ocrProgress'),
    results: $('#ocrResults'),
    summary: $('#ocrSummary'),
    text: $('#ocrText'),
    download: $('#ocrDownload'),
  };
  const state = { file: null, text: '', busy: false };

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file) && !file.type.startsWith('image/')) {
      toast('Please select an image or a PDF file.', 'error');
      return;
    }
    state.file = file;
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.querySelector('.file-badge').textContent = isPdfFile(file) ? 'PDF' : 'IMG';
    el.card.hidden = false;
    el.results.hidden = true;
    el.btn.disabled = false;
  }

  function reset() {
    state.file = null;
    state.text = '';
    el.input.value = '';
    el.card.hidden = true;
    el.results.hidden = true;
    el.progress.hidden = true;
    el.btn.disabled = true;
  }

  /* One PDF page at a time, at 2x so small print stays readable.
     The canvas is dropped again after OCR, so a long PDF never keeps
     every rasterised page in memory. */
  async function renderPage(pdf, n) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    page.cleanup();
    return canvas;
  }

  async function convert() {
    if (!state.file || state.busy) return;
    if (isPdfFile(state.file) && !window.pdfjsLib) {
      toast('PDF library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Scanning…';
    el.results.hidden = true;
    el.progress.hidden = false;
    setProgress('ocr', 0, 'Preparing the OCR engine…');

    let worker;
    let pdf = null;
    let done = 0;
    try {
      const isPdf = isPdfFile(state.file);
      if (isPdf) {
        const data = new Uint8Array(await state.file.arrayBuffer());
        pdf = await pdfjsLib.getDocument({ data }).promise;
      }
      const total = isPdf ? pdf.numPages : 1;

      const Tesseract = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js');
      worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress('ocr', ((done + m.progress) / total) * 100,
              total > 1 ? 'Scanning page ' + (done + 1) + ' of ' + total + '…' : 'Scanning the image…');
          } else {
            setProgress('ocr', (done / total) * 100, 'Preparing the OCR engine…');
          }
        },
      });

      const found = [];
      for (let n = 1; n <= total; n++) {
        const image = pdf ? await renderPage(pdf, n) : state.file;
        const { data } = await worker.recognize(image);
        found.push(data.text.trim());
        if (image !== state.file) image.width = image.height = 0; /* free the canvas */
        done++;
      }

      const text = found.join('\n\n').trim();
      if (!text) {
        toast('No text was found. Try a clearer photo or scan.', 'error');
        el.progress.hidden = true;
        return;
      }

      state.text = text;
      el.text.value = text;
      el.summary.textContent = total > 1 ? 'Text found in ' + total + ' pages' : 'Text found';
      el.results.hidden = false;
      setProgress('ocr', 100, 'Done.');
      toast('Text extracted.', 'success');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      toast('Could not read this file. Try a JPG, PNG or an unprotected PDF.', 'error');
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      if (worker) await worker.terminate().catch(() => {});
      state.busy = false;
      el.btn.textContent = 'Scan for text';
      el.btn.disabled = !state.file;
    }
  }

  onFileInput(el.input, choose);
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', convert);
  el.download.addEventListener('click', () => {
    if (state.text) downloadBlob(new Blob(['\uFEFF' + state.text], { type: 'text/plain;charset=utf-8' }), baseName(state.file.name) + '.txt');
  });
  setupDropzone(el.drop, choose);
})();
