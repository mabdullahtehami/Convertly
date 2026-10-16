/* ==========================================================
   Convertly - split-pdf.js
   6) SPLIT PDF
   ========================================================== */
'use strict';

(function () {
  const sp = {
    file: null,
    buffer: null,
    pages: 0,
    busy: false,
    input: $('#splitInput'),
    drop: $('#splitDrop'),
    card: $('#splitFileCard'),
    name: $('#splitName'),
    meta: $('#splitMeta'),
    remove: $('#splitRemove'),
    mode: $('#splitMode'),
    rangeField: $('#splitRangeField'),
    range: $('#splitRange'),
    btn: $('#splitBtn'),
    progress: $('#splitProgress'),
  };

  async function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      toast('Please choose a PDF file.', 'error');
      return;
    }
    if (!libsReady()) return;
    const buffer = await file.arrayBuffer();
    const doc = await openPdfLib(buffer);
    if (!doc) {
      toast('This PDF is damaged or password protected.', 'error');
      return;
    }
    sp.file = file;
    sp.buffer = buffer;
    sp.pages = doc.getPageCount();
    sp.name.textContent = file.name;
    sp.meta.textContent = sp.pages + (sp.pages === 1 ? ' page, ' : ' pages, ') + formatBytes(file.size);
    sp.card.hidden = false;
    sp.btn.disabled = false;
    sp.range.placeholder = 'Example: 1-3, 5 (total ' + sp.pages + ' pages)';
  }

  function reset() {
    sp.file = sp.buffer = null;
    sp.pages = 0;
    sp.input.value = '';
    sp.card.hidden = true;
    sp.btn.disabled = true;
    sp.progress.hidden = true;
  }

  async function split() {
    if (!sp.file || sp.busy || !libsReady()) return;
    const mode = sp.mode.value;
    let indices = null;

    if (mode === 'extract') {
      indices = parseRanges(sp.range.value, sp.pages);
      if (!indices) {
        toast('Enter valid pages between 1 and ' + sp.pages + ', like 1-3, 5.', 'error');
        sp.range.focus();
        return;
      }
    } else if (sp.pages < 2) {
      toast('This PDF has only one page.', 'error');
      return;
    } else if (!window.JSZip) {
      toast('ZIP library failed to load. Refresh and try again.', 'error');
      return;
    }

    sp.busy = true;
    sp.btn.disabled = true;
    sp.btn.textContent = 'Splitting…';
    sp.progress.hidden = false;
    setProgress('split', 0, 'Reading PDF…');

    try {
      const src = await PDFLib.PDFDocument.load(sp.buffer);
      const stem = baseName(sp.file.name);

      if (mode === 'extract') {
        const out = await PDFLib.PDFDocument.create();
        const pages = await out.copyPages(src, indices);
        pages.forEach((p) => out.addPage(p));
        setProgress('split', 100, 'Saving…');
        const bytes = await out.save();
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), stem + '-extracted.pdf');
        toast('Pages extracted.', 'success');
      } else {
        const zip = new JSZip();
        const pad = String(sp.pages).length;
        for (let i = 0; i < sp.pages; i++) {
          setProgress('split', (i / sp.pages) * 100, 'Splitting page ' + (i + 1) + ' of ' + sp.pages + '…');
          await nextFrame();
          const out = await PDFLib.PDFDocument.create();
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          zip.file(stem + '-page-' + String(i + 1).padStart(pad, '0') + '.pdf', await out.save());
        }
        setProgress('split', 100, 'Creating ZIP…');
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        downloadBlob(blob, stem + '-pages.zip');
        toast('PDF split into ' + sp.pages + ' files.', 'success');
      }
    } catch (err) {
      console.error(err);
      sp.progress.hidden = true;
      toast('Could not split this PDF. Try another file.', 'error');
    } finally {
      sp.busy = false;
      sp.btn.textContent = 'Split PDF';
      sp.btn.disabled = !sp.file;
    }
  }

  sp.input.addEventListener('change', (e) => choose(e.target.files));
  sp.remove.addEventListener('click', reset);
  sp.btn.addEventListener('click', split);
  sp.mode.addEventListener('change', () => (sp.rangeField.hidden = sp.mode.value !== 'extract'));
  setupDropzone(sp.drop, choose);
})();
