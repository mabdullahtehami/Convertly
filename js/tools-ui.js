/* ==========================================================
   Convertly - tools-ui.js
   Shared helpers for the second batch of tools (13-24):
   new tab + panel + the small HTML pieces they all reuse.
   Load AFTER common.js and BEFORE the new tool files.
   ========================================================== */
'use strict';

const UI = (function () {
  /* ---------- 48x48 dropzone icons (same as index.html) ---------- */
  const ICON_PDF =
    '<path d="M12 6h17l9 9v27H12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M29 6v9h9" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M24 35V22m-5 5l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';

  const ICON_IMG =
    '<rect x="6" y="9" width="36" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<circle cx="16.5" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M8 35l10-9 7 6 6-5 11 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';

  const ICON_LINES =
    '<path d="M12 6h17l9 9v27H12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M29 6v9h9" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
    '<path d="M18 23h14M18 29h14M18 35h9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>';

  /* ---------- Add a new tab + panel to the page ----------
     Same registration as MT.addTool (media-ui.js), but the panel
     keeps the regular .panel markup used by the PDF tools. */
  function addTool(id, label, html) {
    const first = tabs[0];

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = first.className.replace(/\bis-active\b/g, '').trim();
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.tabIndex = -1;
    btn.dataset.target = id;
    btn.textContent = label;
    first.parentNode.appendChild(btn);

    /* Clone the type and look of the last existing panel */
    const panels = $$('[id^="panel-"]');
    const last = panels[panels.length - 1];
    const panel = document.createElement(last.tagName.toLowerCase());
    panel.className = last.className;
    panel.id = 'panel-' + id;
    panel.setAttribute('role', 'tabpanel');
    panel.hidden = true;
    panel.innerHTML = html;
    last.after(panel);

    /* Register with the tab system from common.js */
    tabs.push(btn);
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const i = tabs.indexOf(btn);
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      activateTab(next);
      next.focus();
    });
    return panel;
  }

  /* ---------- Small HTML pieces (same markup as index.html) ---------- */
  const dropHtml = (p, accept, icon, title, sub) =>
    '<label class="dropzone" id="' + p + 'Drop" for="' + p + 'Input">' +
    '<input type="file" id="' + p + 'Input" accept="' + accept + '" hidden>' +
    '<svg viewBox="0 0 48 48" class="dz-icon" aria-hidden="true">' + icon + '</svg>' +
    '<span class="dz-title">' + title + '</span>' +
    '<span class="dz-sub">' + sub + '</span></label>';

  const cardHtml = (p, badge) =>
    '<div class="file-card" id="' + p + 'FileCard" hidden>' +
    '<div class="file-badge">' + badge + '</div>' +
    '<div class="file-info"><strong id="' + p + 'Name"></strong><span id="' + p + 'Meta"></span></div>' +
    '<button class="btn btn-quiet" id="' + p + 'Remove" type="button">Remove</button></div>';

  const progressHtml = (p) =>
    '<div class="progress" id="' + p + 'Progress" hidden><div class="progress-bar">' +
    '<span id="' + p + 'Bar"></span></div><p id="' + p + 'ProgressText"></p></div>';

  /* ---------- Image helpers (used by the image tools) ---------- */
  /* Resolves with a loaded <img>; the object URL is revoked right
     away because the pixels are already decoded. */
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read image'));
      };
      img.src = url;
    });
  }

  /* PNG and WebP keep their transparency, everything else saves best as JPG */
  function imageOut(type) {
    if (type === 'image/png') return { mime: 'image/png', ext: 'png' };
    if (type === 'image/webp') return { mime: 'image/webp', ext: 'webp' };
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  return { addTool, dropHtml, cardHtml, progressHtml, loadImage, imageOut, ICON_PDF, ICON_IMG, ICON_LINES };
})();
