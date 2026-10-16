/* ==========================================================
   Convertly - media-ui.js
   Shared helpers for the audio / video tools.
   Load AFTER common.js and BEFORE the other media files.
   Styles are in css/media-tools.css (link it in index.html).
   ========================================================== */
'use strict';

const MT = (function () {
  

  /* ---------- Add a new tab + panel to the page ---------- */
  function addTool(id, label, html) {
    const first = tabs[0];

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = first ? first.className.replace(/\bis-active\b/g, '').trim() : 'switch-btn';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.tabIndex = -1;
    btn.dataset.target = id;
    btn.textContent = label;
    if (first && first.parentNode) first.parentNode.appendChild(btn);
    else document.body.appendChild(btn);

    const panels = $$('[id^="panel-"]');
    const last = panels[panels.length - 1];
    const panel = document.createElement(last ? last.tagName.toLowerCase() : 'section');
    if (last) panel.className = last.className;
    panel.id = 'panel-' + id;
    panel.setAttribute('role', 'tabpanel');
    panel.hidden = true;
    panel.innerHTML = '<div class="mt">' + html + '</div>';
    if (last) last.after(panel);
    else document.body.appendChild(panel);

    /* Register with the existing tab system from common.js */
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

  /* ---------- Small HTML pieces ---------- */
  const dropHtml = (p, accept, text) =>
    '<div class="mt-drop" id="' + p + 'Drop"><p>' + text + '</p>' +
    '<label class="mt-btn">Choose file<input type="file" id="' + p + 'Input" accept="' + accept + '" hidden></label></div>';

  const cardHtml = (p) =>
    '<div class="mt-card" id="' + p + 'Card" hidden><div><strong id="' + p + 'Name"></strong>' +
    '<span id="' + p + 'Meta"></span></div>' +
    '<button type="button" class="mt-x" id="' + p + 'Remove" aria-label="Remove file">&times;</button></div>';

  const progressHtml = (p) =>
    '<div class="mt-progress" id="' + p + 'Progress" hidden><div class="mt-track">' +
    '<div class="mt-bar" id="' + p + 'Bar"></div></div><p id="' + p + 'ProgressText"></p></div>';

  function formatTime(sec) {
    sec = Math.max(0, sec || 0);
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return m + ':' + s;
  }

  /* ---------- Audio helpers ---------- */
  async function decodeAudio(blob) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Audio processing is not supported in this browser.');
    const ctx = new AC();
    try {
      return await ctx.decodeAudioData(await blob.arrayBuffer());
    } finally {
      if (ctx.close) ctx.close().catch(() => {});
    }
  }

  function toInt16(float32, from, to) {
    const out = new Int16Array(to - from);
    for (let i = 0; i < out.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[from + i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  async function encodeMp3(buffer, kbps, startSec, endSec, onProgress) {
    if (!window.lamejs) throw new Error('MP3 library failed to load.');
    const channels = Math.min(buffer.numberOfChannels, 2);
    const rate = buffer.sampleRate;
    const from = Math.max(0, Math.floor(startSec * rate));
    const to = Math.min(buffer.length, Math.floor(endSec * rate));
    if (to <= from) throw new Error('Nothing to convert.');

    const encoder = new lamejs.Mp3Encoder(channels, rate, kbps);
    const left = toInt16(buffer.getChannelData(0), from, to);
    const right = channels === 2 ? toInt16(buffer.getChannelData(1), from, to) : null;
    const BLOCK = 1152;
    const chunks = [];

    for (let i = 0; i < left.length; i += BLOCK) {
      const l = left.subarray(i, i + BLOCK);
      const out = right ? encoder.encodeBuffer(l, right.subarray(i, i + BLOCK)) : encoder.encodeBuffer(l);
      if (out.length) chunks.push(new Int8Array(out));
      if ((i / BLOCK) % 200 === 0) {
        if (onProgress) onProgress(i / left.length);
        await nextFrame();
      }
    }
    const end = encoder.flush();
    if (end.length) chunks.push(new Int8Array(end));
    return new Blob(chunks, { type: 'audio/mpeg' });
  }

  function encodeWav(buffer, startSec, endSec) {
    const channels = Math.min(buffer.numberOfChannels, 2);
    const rate = buffer.sampleRate;
    const from = Math.max(0, Math.floor(startSec * rate));
    const to = Math.min(buffer.length, Math.floor(endSec * rate));
    const n = to - from;
    if (n <= 0) throw new Error('Nothing to convert.');

    const dataSize = n * channels * 2;
    const view = new DataView(new ArrayBuffer(44 + dataSize));
    const text = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    text(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    text(36, 'data');
    view.setUint32(40, dataSize, true);

    const data = [];
    for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));
    let offset = 44;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < channels; c++) {
        const s = Math.max(-1, Math.min(1, data[c][from + i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([view], { type: 'audio/wav' });
  }

  return { addTool, dropHtml, cardHtml, progressHtml, formatTime, decodeAudio, encodeMp3, encodeWav };
})();
