/* ==========================================================
   Convertly - compress-pdf.js
   7) COMPRESS PDF
   Renders each page as an optimized JPG and rebuilds the PDF.
   ========================================================== */
'use strict';

(function () {
  const LEVELS = {
    low: { dpi: 150, quality: 0.85 },
    medium: { dpi: 110, quality: 0.7 },
    high: { dpi: 72, quality: 0.5 },
  };

  const cp = {
    file: null,
    blob: null,
    busy: false,
    input: $('#compressInput'),
    drop: $('#compressDrop'),
    card: $('#compressFileCard'),
    name: $('#compressName'),
    meta: $('#compressMeta'),
    remove: $('#compressRemove'),
    level: $('#compressLevel'),
    btn: $('#compressBtn'),
    progress: $('#compressProgress'),
    results: $('#compressResults'),
    summary: $('#compressSummary'),
    download: $('#compressDownload'),
  };

  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      toast('Please choose a PDF file.', 'error');
      return;
    }
    cp.file = file;
    cp.blob = null;
    cp.name.textContent = file.name;
    cp.meta.textContent = formatBytes(file.size);
    cp.card.hidden = false;
    cp.results.hidden = true;
    cp.progress.hidden = true;
    cp.btn.disabled = false;
  }

  function reset() {
    cp.file = cp.blob = null;
    cp.input.value = '';
    cp.card.hidden = true;
    cp.results.hidden = true;
    cp.progress.hidden = true;
    cp.btn.disabled = true;
  }

  async function compress() {
    if (!cp.file || cp.busy || !libsReady()) return;
    if (!window.pdfjsLib) {
      toast('PDF library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    cp.busy = true;
    cp.btn.disabled = true;
    cp.btn.textContent = 'Compressing…';
    cp.results.hidden = true;
    cp.progress.hidden = false;
    setProgress('compress', 0, 'Reading PDF…');

    const { dpi, quality } = LEVELS[cp.level.value];
    let pdf;

    try {
      const data = new Uint8Array(await cp.file.arrayBuffer());
      pdf = await pdfjsLib.getDocument({ data }).promise;
      const total = pdf.numPages;
      const out = await PDFLib.PDFDocument.create();

      for (let n = 1; n <= total; n++) {
        setProgress('compress', ((n - 1) / total) * 100, 'Compressing page ' + n + ' of ' + total + '…');
        await nextFrame();

        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: dpi / 72 });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;

        const jpg = await canvasToBlob(canvas, 'image/jpeg', quality);
        const image = await out.embedJpg(await jpg.arrayBuffer());
        const pdfPage = out.addPage([base.width, base.height]);
        pdfPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });

        canvas.width = canvas.height = 0;
        page.cleanup();
      }

      setProgress('compress', 100, 'Saving…');
      const bytes = await out.save();
      cp.blob = new Blob([bytes], { type: 'application/pdf' });

      const before = cp.file.size;
      const after = cp.blob.size;
      if (after < before) {
        const saved = Math.round((1 - after / before) * 100);
        cp.summary.textContent = formatBytes(before) + ' to ' + formatBytes(after) + ' (' + saved + '% smaller)';
        toast('PDF compressed.', 'success');
      } else {
        cp.summary.textContent = 'No size reduction. Try a higher compression level.';
        toast('This PDF is already small. Try a higher compression level.', 'error');
      }
      cp.results.hidden = false;
    } catch (err) {
      console.error(err);
      cp.progress.hidden = true;
      if (err && err.name === 'PasswordException') {
        toast('This PDF is password protected. Remove the password and try again.', 'error');
      } else {
        toast('Could not compress this PDF. Try another file.', 'error');
      }
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      cp.busy = false;
      cp.btn.textContent = 'Compress PDF';
      cp.btn.disabled = !cp.file;
    }
  }

  cp.input.addEventListener('change', (e) => choose(e.target.files));
  cp.remove.addEventListener('click', reset);
  cp.btn.addEventListener('click', compress);
  cp.download.addEventListener('click', () => {
    if (cp.blob && cp.file) downloadBlob(cp.blob, baseName(cp.file.name) + '-compressed.pdf');
  });
  setupDropzone(cp.drop, choose);
})();
