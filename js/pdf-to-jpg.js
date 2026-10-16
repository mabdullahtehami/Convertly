/* ==========================================================
   Convertly - pdf-to-jpg.js
   1) PDF -> JPG
   ========================================================== */
'use strict';

const pdfState = { file: null, results: [], busy: false };

const pdfEls = {
  input: $('#pdfInput'),
  drop: $('#pdfDrop'),
  card: $('#pdfFileCard'),
  name: $('#pdfName'),
  meta: $('#pdfMeta'),
  remove: $('#pdfRemove'),
  dpi: $('#pdfDpi'),
  quality: $('#pdfQuality'),
  qualityOut: $('#pdfQualityOut'),
  convert: $('#pdfConvert'),
  progress: $('#pdfProgress'),
  results: $('#pdfResults'),
  resultsTitle: $('#pdfResultsTitle'),
  grid: $('#pdfGrid'),
  zip: $('#pdfZip'),
};

function clearPdfResults() {
  pdfState.results.forEach((r) => URL.revokeObjectURL(r.url));
  pdfState.results = [];
  pdfEls.grid.innerHTML = '';
  pdfEls.results.hidden = true;
  pdfEls.progress.hidden = true;
}

function setPdfFile(fileList) {
  const file = fileList && fileList[0];
  if (!file) return;
  if (!isPdfFile(file)) {
    toast('That file is not a PDF. Please choose a .pdf file.', 'error');
    return;
  }
  clearPdfResults();
  pdfState.file = file;
  pdfEls.name.textContent = file.name;
  pdfEls.meta.textContent = formatBytes(file.size);
  pdfEls.card.hidden = false;
  pdfEls.convert.disabled = false;
}

function removePdfFile() {
  clearPdfResults();
  pdfState.file = null;
  pdfEls.input.value = '';
  pdfEls.card.hidden = true;
  pdfEls.convert.disabled = true;
}

function addPdfThumb(result, index) {
  const card = document.createElement('div');
  card.className = 'thumb';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'thumb-img';
  const img = document.createElement('img');
  img.src = result.url;
  img.alt = 'Page ' + index;
  img.loading = 'lazy';
  imgWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'thumb-body';
  const title = document.createElement('div');
  title.className = 'thumb-title';
  const strong = document.createElement('strong');
  strong.textContent = 'Page ' + index;
  const small = document.createElement('span');
  small.textContent = result.width + ' x ' + result.height + ' px, ' + formatBytes(result.blob.size);
  title.append(strong, small);

  const btn = makeIconButton(ICON_DOWNLOAD, 'Download page ' + index, 'download', false);
  btn.addEventListener('click', () => downloadBlob(result.blob, result.name));

  body.append(title, btn);
  card.append(imgWrap, body);
  pdfEls.grid.appendChild(card);
}

async function convertPdfToJpg() {
  if (!pdfState.file || pdfState.busy) return;
  if (!window.pdfjsLib) {
    toast('PDF library failed to load. Check your internet connection and refresh.', 'error');
    return;
  }

  pdfState.busy = true;
  pdfEls.convert.disabled = true;
  pdfEls.convert.textContent = 'Converting…';
  clearPdfResults();
  pdfEls.progress.hidden = false;
  setProgress('pdf', 0, 'Reading PDF…');

  const dpi = Number(pdfEls.dpi.value);
  const quality = Number(pdfEls.quality.value) / 100;
  const MAX_SIDE = 9000;

  try {
    const data = new Uint8Array(await pdfState.file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const total = pdf.numPages;
    const pad = String(total).length;
    const stem = baseName(pdfState.file.name);

    pdfEls.results.hidden = false;
    pdfEls.resultsTitle.textContent = 'Your images';

    for (let n = 1; n <= total; n++) {
      setProgress('pdf', ((n - 1) / total) * 100, 'Converting page ' + n + ' of ' + total + '…');
      await nextFrame();

      const page = await pdf.getPage(n);
      let scale = dpi / 72;
      const base = page.getViewport({ scale: 1 });
      const longest = Math.max(base.width, base.height) * scale;
      if (longest > MAX_SIDE) scale *= MAX_SIDE / longest;

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

      const result = {
        name: stem + '-page-' + String(n).padStart(pad, '0') + '.jpg',
        blob,
        url: URL.createObjectURL(blob),
        width: canvas.width,
        height: canvas.height,
      };
      pdfState.results.push(result);
      addPdfThumb(result, n);

      canvas.width = canvas.height = 0;
      page.cleanup();
    }

    setProgress('pdf', 100, 'Done. ' + total + (total === 1 ? ' page' : ' pages') + ' converted.');
    pdfEls.resultsTitle.textContent = total + (total === 1 ? ' image ready' : ' images ready');
    pdfEls.zip.hidden = total === 1;
    toast('Conversion complete.', 'success');
  } catch (err) {
    console.error(err);
    pdfEls.progress.hidden = true;
    if (err && err.name === 'PasswordException') {
      toast('This PDF is password protected. Remove the password and try again.', 'error');
    } else if (err && err.name === 'InvalidPDFException') {
      toast('This file is not a valid PDF or is damaged.', 'error');
    } else {
      toast('Something went wrong while converting. Please try another file.', 'error');
    }
  } finally {
    pdfState.busy = false;
    pdfEls.convert.disabled = !pdfState.file;
    pdfEls.convert.textContent = 'Convert to JPG';
  }
}

async function downloadPdfZip() {
  if (!pdfState.results.length) return;
  if (!window.JSZip) {
    toast('ZIP library failed to load. Download pages one by one instead.', 'error');
    return;
  }
  pdfEls.zip.disabled = true;
  const original = pdfEls.zip.textContent;
  pdfEls.zip.textContent = 'Preparing ZIP…';
  try {
    const zip = new JSZip();
    pdfState.results.forEach((r) => zip.file(r.name, r.blob));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    downloadBlob(blob, baseName(pdfState.file.name) + '-images.zip');
  } catch (err) {
    console.error(err);
    toast('Could not create the ZIP file.', 'error');
  } finally {
    pdfEls.zip.disabled = false;
    pdfEls.zip.textContent = original;
  }
}

pdfEls.input.addEventListener('change', (e) => setPdfFile(e.target.files));
pdfEls.remove.addEventListener('click', removePdfFile);
pdfEls.convert.addEventListener('click', convertPdfToJpg);
pdfEls.zip.addEventListener('click', downloadPdfZip);
pdfEls.quality.addEventListener('input', () => (pdfEls.qualityOut.textContent = pdfEls.quality.value + '%'));
setupDropzone(pdfEls.drop, setPdfFile);
