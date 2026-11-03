/* ==========================================================
   Convertly - common.js
   Shared helpers + panels. MUST be loaded first.
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

/* Drop scripts, event handlers and JS URLs from generated HTML
   before it is written into the live DOM. */
function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,link,meta,style,form').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      const name = a.name.toLowerCase();
      const value = String(a.value || '').trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
        el.removeAttribute(a.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function setupDropzone(zone, onFiles) {
  ['dragenter', 'dragover'].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    })
  );
  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (!e.relatedTarget || !zone.contains(e.relatedTarget)) zone.classList.remove('is-over');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  });
}

/* Wire a file input: hand the handler a snapshot of the picked files,
   clear the value so the same file can be chosen again, and catch
   async failures instead of leaving unhandled rejections. */
function onFileInput(input, handler) {
  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    input.value = '';
    try {
      const out = handler(files);
      if (out && typeof out.catch === 'function') out.catch(fileError);
    } catch (err) {
      fileError(err);
    }
  });
}

function fileError(err) {
  console.error(err);
  toast('Could not read that file. It may be damaged, moved or locked.', 'error');
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

/* Shared helpers for Merge / Split / Compress */
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
   Panels - the home grid opens one panel at a time
   ========================================================== */
const allPanels = () => $$('[id^="panel-"]');

function hideAllPanels() {
  allPanels().forEach((panel) => (panel.hidden = true));
}

function openPanel(panel) {
  hideAllPanels();
  panel.hidden = false;
}

/* Register a new tool panel: it clones the type and look of the last one.
   Used by both helper modules (media-ui.js and tools-ui.js). */
function addPanel(id, label, html) {
  const panels = allPanels();
  const last = panels[panels.length - 1];
  const panel = document.createElement(last.tagName.toLowerCase());
  panel.className = last.className;
  panel.id = 'panel-' + id;
  panel.setAttribute('aria-label', label);
  panel.hidden = true;
  panel.innerHTML = html;
  last.after(panel);
  return panel;
}
