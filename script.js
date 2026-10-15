/* ==========================================================
   Convertly - script.js
   PDF to JPG, JPG to PDF, DOCX to PDF, PDF to DOCX,
   Merge PDF, Split PDF, Compress PDF
   ========================================================== */
'use strict';

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* ---------- Helpers ---------- */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function baseName(filename) {
  return filename.replace(/\.[^.]+$/, '') || 'file';
}

let toastTimer;
function toast(message, type = '') {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast ' + type), 3500);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setProgress(prefix, percent, text) {
  $('#' + prefix + 'Bar').style.width = percent + '%';
  if (text) $('#' + prefix + 'ProgressText').textContent = text;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), type, quality)
  );
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const isPdfFile = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

function setupDropzone(zone, onFiles) {
  ['dragenter', 'dragover'].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
    })
  );
  zone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  });
}

const ICON_DOWNLOAD =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m-5-5l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_UP =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_DOWN =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_TRASH =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2m-7 0l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function makeIconButton(svg, label, action, disabled, extraClass = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = ('icon-btn ' + extraClass).trim();
  b.dataset.action = action;
  b.title = label;
  b.setAttribute('aria-label', label);
  b.disabled = disabled;
  b.innerHTML = svg;
  return b;
}

/* ==========================================================
   Tabs
   ========================================================== */
const tabs = $$('.switch-btn');

function activateTab(tab) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    $('#panel-' + t.dataset.target).hidden = !active;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    activateTab(next);
    next.focus();
  });
});

/* ==========================================================
   1) PDF -> JPG
   ========================================================== */
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

/* ==========================================================
   2) JPG -> PDF
   ========================================================== */
const imgState = { items: [], uid: 0, dragId: null, busy: false };

const imgEls = {
  input: $('#imgInput'),
  drop: $('#imgDrop'),
  wrap: $('#imgListWrap'),
  list: $('#imgList'),
  count: $('#imgCount'),
  clear: $('#imgClear'),
  size: $('#pageSize'),
  margin: $('#pageMargin'),
  create: $('#pdfCreate'),
  progress: $('#imgProgress'),
};

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const thumbUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve({
        id: ++imgState.uid,
        name: file.name,
        size: file.size,
        width: canvas.width,
        height: canvas.height,
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        thumbUrl,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(thumbUrl);
      reject(new Error('Cannot read ' + file.name));
    };
    img.src = thumbUrl;
  });
}

async function addImages(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (!files.length) {
    toast('Please choose image files (JPG, PNG or WebP).', 'error');
    return;
  }
  const failed = [];
  for (const file of files) {
    try {
      imgState.items.push(await loadImageFile(file));
    } catch {
      failed.push(file.name);
    }
  }
  if (failed.length) {
    toast('Could not read: ' + failed.slice(0, 2).join(', ') + (failed.length > 2 ? '…' : ''), 'error');
  }
  renderImageList();
}

function renderImageList() {
  const items = imgState.items;
  imgEls.wrap.hidden = items.length === 0;
  imgEls.create.disabled = items.length === 0;
  imgEls.count.textContent = items.length + (items.length === 1 ? ' image' : ' images');
  imgEls.list.innerHTML = '';

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'img-item';
    li.draggable = true;
    li.dataset.id = item.id;

    const order = document.createElement('span');
    order.className = 'img-order';
    order.textContent = i + 1;

    const thumb = document.createElement('img');
    thumb.src = item.thumbUrl;
    thumb.alt = '';

    const meta = document.createElement('div');
    meta.className = 'img-meta';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const info = document.createElement('span');
    info.textContent = item.width + ' x ' + item.height + ' px, ' + formatBytes(item.size);
    meta.append(name, info);

    const tools = document.createElement('div');
    tools.className = 'img-tools';
    tools.append(
      makeIconButton(ICON_UP, 'Move up', 'up', i === 0),
      makeIconButton(ICON_DOWN, 'Move down', 'down', i === items.length - 1),
      makeIconButton(ICON_TRASH, 'Remove image', 'remove', false, 'danger')
    );

    li.append(order, thumb, meta, tools);
    imgEls.list.appendChild(li);
  });
}

function moveItem(from, to) {
  if (to < 0 || to >= imgState.items.length || from === to) return;
  const [moved] = imgState.items.splice(from, 1);
  imgState.items.splice(to, 0, moved);
  renderImageList();
}

imgEls.list.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const li = btn.closest('li');
  const index = imgState.items.findIndex((it) => it.id === Number(li.dataset.id));
  if (index < 0) return;

  const action = btn.dataset.action;
  if (action === 'up') moveItem(index, index - 1);
  if (action === 'down') moveItem(index, index + 1);
  if (action === 'remove') {
    URL.revokeObjectURL(imgState.items[index].thumbUrl);
    imgState.items.splice(index, 1);
    renderImageList();
  }
});

imgEls.list.addEventListener('dragstart', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  imgState.dragId = Number(li.dataset.id);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(imgState.dragId));
});

imgEls.list.addEventListener('dragover', (e) => {
  if (imgState.dragId === null) return;
  e.preventDefault();
  $$('.drop-target', imgEls.list).forEach((el) => el.classList.remove('drop-target'));
  const li = e.target.closest('li');
  if (li && Number(li.dataset.id) !== imgState.dragId) li.classList.add('drop-target');
});

imgEls.list.addEventListener('drop', (e) => {
  if (imgState.dragId === null) return;
  e.preventDefault();
  const li = e.target.closest('li');
  if (li) {
    const from = imgState.items.findIndex((it) => it.id === imgState.dragId);
    const to = imgState.items.findIndex((it) => it.id === Number(li.dataset.id));
    moveItem(from, to);
  }
});

imgEls.list.addEventListener('dragend', () => {
  imgState.dragId = null;
  $$('.dragging, .drop-target', imgEls.list).forEach((el) => el.classList.remove('dragging', 'drop-target'));
});

function clearImages() {
  imgState.items.forEach((it) => URL.revokeObjectURL(it.thumbUrl));
  imgState.items = [];
  imgEls.input.value = '';
  imgEls.progress.hidden = true;
  renderImageList();
}

const PAGE_SIZES_MM = { a4: [210, 297], letter: [215.9, 279.4] };
const PX_TO_MM_150DPI = 25.4 / 150;

async function createPdf() {
  if (!imgState.items.length || imgState.busy) return;
  if (!window.jspdf) {
    toast('PDF library failed to load. Check your internet connection and refresh.', 'error');
    return;
  }

  imgState.busy = true;
  imgEls.create.disabled = true;
  imgEls.create.textContent = 'Creating…';
  imgEls.progress.hidden = false;
  setProgress('img', 0, 'Building PDF…');

  try {
    const { jsPDF } = window.jspdf;
    const sizeMode = imgEls.size.value;
    const margin = Number(imgEls.margin.value);
    const items = imgState.items;
    let doc = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProgress('img', (i / items.length) * 100, 'Adding image ' + (i + 1) + ' of ' + items.length + '…');
      await nextFrame();

      let pageW, pageH, drawW, drawH;

      if (sizeMode === 'fit') {
        drawW = item.width * PX_TO_MM_150DPI;
        drawH = item.height * PX_TO_MM_150DPI;
        pageW = drawW + margin * 2;
        pageH = drawH + margin * 2;
      } else {
        const [w, h] = PAGE_SIZES_MM[sizeMode];
        const landscape = item.width > item.height;
        pageW = landscape ? h : w;
        pageH = landscape ? w : h;
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const ratio = Math.min(availW / item.width, availH / item.height);
        drawW = item.width * ratio;
        drawH = item.height * ratio;
      }

      const orientation = pageW > pageH ? 'l' : 'p';
      if (!doc) {
        doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation, compress: true });
      } else {
        doc.addPage([pageW, pageH], orientation);
      }

      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      doc.addImage(item.dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
    }

    setProgress('img', 100, 'Saving PDF…');
    const filename = (items.length === 1 ? baseName(items[0].name) : 'images') + '.pdf';
    doc.save(filename);
    toast('PDF created: ' + filename, 'success');
  } catch (err) {
    console.error(err);
    toast('Could not create the PDF. Try fewer or smaller images.', 'error');
    imgEls.progress.hidden = true;
  } finally {
    imgState.busy = false;
    imgEls.create.disabled = imgState.items.length === 0;
    imgEls.create.textContent = 'Create PDF';
  }
}

imgEls.input.addEventListener('change', (e) => {
  addImages(e.target.files).then(() => (imgEls.input.value = ''));
});
imgEls.clear.addEventListener('click', clearImages);
imgEls.create.addEventListener('click', createPdf);
setupDropzone(imgEls.drop, addImages);

/* Stop the browser from opening files dropped outside a dropzone */
['dragover', 'drop'].forEach((evt) =>
  window.addEventListener(evt, (e) => {
    if (!e.target.closest('.dropzone') && !e.target.closest('.img-list')) e.preventDefault();
  })
);

/* ==========================================================
   3) DOCX -> PDF
   ========================================================== */
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

/* ==========================================================
   4) PDF -> DOCX (text based PDFs)
   ========================================================== */
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

/* ==========================================================
   Shared helpers for Merge / Split / Compress
   ========================================================== */
function libsReady() {
  if (!window.PDFLib) {
    toast('PDF library failed to load. Check your internet and refresh.', 'error');
    return false;
  }
  return true;
}

async function openPdfLib(buffer) {
  try {
    return await PDFLib.PDFDocument.load(buffer);
  } catch (err) {
    console.error(err);
    return null;
  }
}

/* "1-3, 5, 8-10" -> zero-based page indexes, or null if invalid */
function parseRanges(text, total) {
  const out = [];
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a || b > total) return null;
    for (let p = a; p <= b; p++) if (!out.includes(p - 1)) out.push(p - 1);
  }
  return out;
}

/* ==========================================================
   5) MERGE PDF
   ========================================================== */
(function () {
  const mg = {
    items: [],
    uid: 0,
    busy: false,
    input: $('#mergeInput'),
    drop: $('#mergeDrop'),
    wrap: $('#mergeListWrap'),
    list: $('#mergeList'),
    count: $('#mergeCount'),
    clear: $('#mergeClear'),
    btn: $('#mergeBtn'),
    progress: $('#mergeProgress'),
  };

  async function addFiles(fileList) {
    if (!libsReady()) return;
    const files = [...fileList].filter(isPdfFile);
    if (!files.length) {
      toast('Please choose PDF files.', 'error');
      return;
    }
    const failed = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const doc = await openPdfLib(buffer);
      if (!doc) {
        failed.push(file.name);
        continue;
      }
      mg.items.push({ id: ++mg.uid, name: file.name, size: file.size, pages: doc.getPageCount(), buffer });
    }
    if (failed.length) {
      toast('Could not open (damaged or protected): ' + failed.slice(0, 2).join(', '), 'error');
    }
    render();
  }

  function render() {
    const n = mg.items.length;
    mg.wrap.hidden = n === 0;
    mg.btn.disabled = n < 2 || mg.busy;
    mg.count.textContent = n + (n === 1 ? ' file' : ' files');
    mg.list.innerHTML = '';

    mg.items.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'img-item no-drag';
      li.dataset.id = item.id;

      const order = document.createElement('span');
      order.className = 'img-order';
      order.textContent = i + 1;

      const badge = document.createElement('div');
      badge.className = 'file-badge';
      badge.textContent = 'PDF';

      const meta = document.createElement('div');
      meta.className = 'img-meta';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const info = document.createElement('span');
      info.textContent = item.pages + (item.pages === 1 ? ' page, ' : ' pages, ') + formatBytes(item.size);
      meta.append(name, info);

      const tools = document.createElement('div');
      tools.className = 'img-tools';
      tools.append(
        makeIconButton(ICON_UP, 'Move up', 'up', i === 0),
        makeIconButton(ICON_DOWN, 'Move down', 'down', i === n - 1),
        makeIconButton(ICON_TRASH, 'Remove file', 'remove', false, 'danger')
      );

      li.append(order, badge, meta, tools);
      mg.list.appendChild(li);
    });
  }

  mg.list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const i = mg.items.findIndex((it) => it.id === Number(btn.closest('li').dataset.id));
    if (i < 0) return;
    const a = btn.dataset.action;
    if (a === 'remove') mg.items.splice(i, 1);
    if (a === 'up' && i > 0) [mg.items[i - 1], mg.items[i]] = [mg.items[i], mg.items[i - 1]];
    if (a === 'down' && i < mg.items.length - 1) [mg.items[i + 1], mg.items[i]] = [mg.items[i], mg.items[i + 1]];
    render();
  });

  async function merge() {
    if (mg.items.length < 2 || mg.busy || !libsReady()) return;
    mg.busy = true;
    mg.btn.disabled = true;
    mg.btn.textContent = 'Merging…';
    mg.progress.hidden = false;
    setProgress('merge', 0, 'Starting…');

    try {
      const out = await PDFLib.PDFDocument.create();
      for (let i = 0; i < mg.items.length; i++) {
        setProgress('merge', (i / mg.items.length) * 100, 'Adding ' + mg.items[i].name + '…');
        await nextFrame();
        const src = await PDFLib.PDFDocument.load(mg.items[i].buffer);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      setProgress('merge', 100, 'Saving…');
      const bytes = await out.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
      toast('PDFs merged successfully.', 'success');
    } catch (err) {
      console.error(err);
      mg.progress.hidden = true;
      toast('Could not merge these files. Try again.', 'error');
    } finally {
      mg.busy = false;
      mg.btn.textContent = 'Merge PDFs';
      mg.btn.disabled = mg.items.length < 2;
    }
  }

  mg.input.addEventListener('change', (e) => addFiles(e.target.files).then(() => (mg.input.value = '')));
  mg.clear.addEventListener('click', () => {
    mg.items = [];
    mg.progress.hidden = true;
    render();
  });
  mg.btn.addEventListener('click', merge);
  setupDropzone(mg.drop, addFiles);
})();

/* ==========================================================
   6) SPLIT PDF
   ========================================================== */
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

/* ==========================================================
   7) COMPRESS PDF
   Renders each page as an optimized JPG and rebuilds the PDF.
   ========================================================== */
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