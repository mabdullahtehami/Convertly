/* ==========================================================
   Convertly - pdf-editor.js
   Tool: Edit PDF Text (click a line of text, type a replacement)
   pdf.js reads the lines and draws them as editable inputs over
   the rendered page; pdf-lib writes only the changed lines back.
   ========================================================== */
'use strict';

(function () {
  UI.addTool('pdfedit', 'Edit PDF Text', `
    ${UI.dropHtml('pe', 'application/pdf,.pdf', UI.ICON_LINES, 'Drop a PDF here or <u>browse</u>', 'Click any line of text to change it, then save.')}
    ${UI.cardHtml('pe', 'PDF')}
    <div class="pe-view" id="peView" hidden>
      <div class="pe-pages">
        <button class="btn btn-quiet" id="pePrev" type="button" aria-label="Previous page">&lsaquo;</button>
        <span id="pePageInfo">Page 1 of 1</span>
        <button class="btn btn-quiet" id="peNext" type="button" aria-label="Next page">&rsaquo;</button>
      </div>
      <div class="pe-stage" id="peStage">
        <div class="pe-page">
          <canvas id="peCanvas"></canvas>
          <div class="pe-overlay" id="peOverlay"></div>
        </div>
      </div>
      <p class="pe-hint">Click a line to edit it. Lines you change are re-written into the saved PDF.</p>
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="peSave" type="button" disabled>Save PDF</button>
      <button class="btn btn-quiet" id="peReset" type="button" hidden>Start over</button>
    </div>
    ${UI.progressHtml('pe')}
  `);

  const el = {
    input: $('#peInput'),
    card: $('#peFileCard'),
    name: $('#peName'),
    meta: $('#peMeta'),
    remove: $('#peRemove'),
    view: $('#peView'),
    stage: $('#peStage'),
    drop: $('#peDrop'),
    canvas: $('#peCanvas'),
    overlay: $('#peOverlay'),
    prev: $('#pePrev'),
    next: $('#peNext'),
    pageInfo: $('#pePageInfo'),
    save: $('#peSave'),
    reset: $('#peReset'),
    progress: $('#peProgress'),
  };

  const state = {
    file: null,
    doc: null, // pdf.js document
    page: 1,
    total: 0,
    scale: 1,
    lines: [], // editable lines of the page on screen
    edits: {}, // key -> line copy + new text (survives page changes)
    busy: false,
  };

  const lineKey = (p, i) => 'p' + p + 'i' + i;

  /* ---------- Colour helpers (one pixel read per render) ---------- */
  function sampleBg(data, box) {
    if (!data) return [255, 255, 255];
    const w = data.width;
    const h = data.height;
    const x0 = Math.max(0, Math.round(box.x) - 3);
    const x1 = Math.min(w - 1, Math.round(box.x + box.w) + 3);
    const y0 = Math.max(0, Math.round(box.y) - 3);
    const y1 = Math.min(h - 1, Math.round(box.y + box.h) + 3);
    if (x1 <= x0 || y1 <= y0) return [255, 255, 255];

    const buckets = new Map();
    const push = (x, y) => {
      const i = (y * w + x) * 4;
      if (data.data[i + 3] < 200) return;
      const k = ((data.data[i] >> 3) << 10) | ((data.data[i + 1] >> 3) << 5) | (data.data[i + 2] >> 3);
      const b = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      b.n++;
      b.r += data.data[i];
      b.g += data.data[i + 1];
      b.b += data.data[i + 2];
      buckets.set(k, b);
    };
    for (let x = x0; x <= x1; x++) {
      push(x, y0);
      push(x, y1);
    }
    for (let y = y0; y <= y1; y++) {
      push(x0, y);
      push(x1, y);
    }
    let best = null;
    buckets.forEach((b) => {
      if (!best || b.n > best.n) best = b;
    });
    if (!best) return [255, 255, 255];
    return [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)];
  }

  /* The colour furthest from the background inside the box is the ink */
  function sampleInk(data, box, bg) {
    if (!data) return [17, 17, 17];
    const w = data.width;
    const h = data.height;
    const x0 = Math.max(0, Math.round(box.x));
    const x1 = Math.min(w - 1, Math.round(box.x + box.w));
    const y0 = Math.max(0, Math.round(box.y));
    const y1 = Math.min(h - 1, Math.round(box.y + box.h));
    let best = null;
    let bestD = 0;
    for (let y = y0; y <= y1; y += 2) {
      for (let x = x0; x <= x1; x += 2) {
        const i = (y * w + x) * 4;
        if (data.data[i + 3] < 200) continue;
        const dr = data.data[i] - bg[0];
        const dg = data.data[i + 1] - bg[1];
        const db = data.data[i + 2] - bg[2];
        const d = dr * dr + dg * dg + db * db;
        if (d > bestD) {
          bestD = d;
          best = [data.data[i], data.data[i + 1], data.data[i + 2]];
        }
      }
    }
    return bestD > 40 * 40 ? best : [17, 17, 17];
  }

  /* ---------- Text layer -> editable lines (PDF units) ---------- */
  function buildLines(items, viewport, pixels) {
    const rows = [];
    for (const it of items) {
      if (!it.str || !it.str.trim()) continue;
      const t = it.transform;
      if (Math.abs(t[1]) > 0.01 || Math.abs(t[2]) > 0.01) continue; // rotated / skewed text stays untouched
      const size = Math.abs(t[3]) || Math.abs(t[0]);
      if (!size) continue;
      const w = it.width || it.str.length * size * 0.5;
      rows.push({ str: it.str, x: t[4], y: t[5], size, w });
    }
    rows.sort((a, b) => b.y - a.y || a.x - b.x);

    const groups = [];
    for (const r of rows) {
      let line = groups.find((l) => Math.abs(l.y - r.y) <= Math.max(l.size, r.size) * 0.5);
      if (!line) {
        line = { y: r.y, size: r.size, items: [] };
        groups.push(line);
      }
      line.items.push(r);
      if (r.size > line.size) line.size = r.size;
    }

    return groups.map((line) => {
      line.items.sort((a, b) => a.x - b.x);
      let text = '';
      let prev = null;
      for (const it of line.items) {
        if (prev && it.x - (prev.x + prev.w) > prev.size * 0.25) text += ' ';
        text += it.str;
        prev = it;
      }
      const x0 = Math.min(...line.items.map((i) => i.x));
      const x1 = Math.max(...line.items.map((i) => i.x + i.w));
      const main = line.items.reduce((a, b) => (b.w > a.w ? b : a)); // widest fragment owns the baseline

      /* white-out rectangle in PDF units */
      const pad = line.size * 0.15;
      const rect = {
        x: x0 - pad,
        y: main.y - line.size * 0.3 - pad,
        w: x1 - x0 + pad * 2,
        h: line.size * 1.4 + pad * 2,
      };

      /* overlay box in screen pixels */
      const a = viewport.convertToViewportPoint(x0, main.y + line.size * 0.85);
      const b = viewport.convertToViewportPoint(x1, main.y - line.size * 0.35);
      const box = {
        x: Math.min(a[0], b[0]),
        y: Math.min(a[1], b[1]),
        w: Math.abs(b[0] - a[0]),
        h: Math.abs(b[1] - a[1]),
      };

      const bg = sampleBg(pixels, box);
      return {
        text,
        x0,
        y: main.y,
        size: line.size,
        rect,
        box,
        bg,
        fg: sampleInk(pixels, box, bg),
      };
    });
  }

  /* ---------- WinAnsi (Helvetica) can only hold these code points ---------- */
  const CP1252_HIGH = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
    0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
    0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
    0x017e: 0x9e, 0x0178: 0x9f,
  };

  function sanitizeWinAnsi(str) {
    let out = '';
    for (const ch of str) {
      const cp = ch.codePointAt(0);
      if ((cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255)) out += ch;
      else if (CP1252_HIGH[cp] !== undefined) out += String.fromCharCode(CP1252_HIGH[cp]);
      else out += '?';
    }
    return out;
  }

  /* ---------- Render one page + its editable overlay ---------- */
  async function renderPage(n) {
    const page = await state.doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const avail = Math.max(320, el.stage.clientWidth - 24);
    const scale = Math.min(2, Math.max(0.5, avail / base.width));
    const viewport = page.getViewport({ scale });

    const canvas = el.canvas;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    state.page = n;
    state.scale = scale;
    el.pageInfo.textContent = 'Page ' + n + ' of ' + state.total;
    el.prev.disabled = n <= 1;
    el.next.disabled = n >= state.total;

    let pixels = null;
    try {
      pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error(err); // no pixel access: white background, black ink
    }

    const content = await page.getTextContent();
    state.lines = buildLines(content.items, viewport, pixels);
    drawOverlay(n);
    page.cleanup();
  }

  function drawOverlay(pageNo) {
    el.overlay.innerHTML = '';
    state.lines.forEach((line, i) => {
      const k = lineKey(pageNo, i);
      const saved = state.edits[k];
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'pe-item' + (saved ? ' is-changed' : '');
      input.value = saved ? saved.text : line.text;
      input.setAttribute('aria-label', 'Edit line: ' + line.text);
      input.style.left = line.box.x + 'px';
      input.style.top = line.box.y + 'px';
      input.style.width = Math.max(24, line.box.w) + 'px';
      input.style.height = Math.max(16, line.box.h) + 'px';
      input.style.fontSize = line.size * state.scale + 'px';
      input.style.background = 'rgb(' + line.bg.join(',') + ')';
      input.addEventListener('input', () => {
        if (input.value === line.text) {
          delete state.edits[k];
          input.classList.remove('is-changed');
        } else {
          state.edits[k] = Object.assign({}, line, { page: pageNo, text: input.value });
          input.classList.add('is-changed');
        }
      });
      el.overlay.appendChild(input);
    });
  }

  /* ---------- Open / navigate / save ---------- */
  async function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      toast('Please choose a PDF file.', 'error');
      return;
    }
    if (!libsReady()) return;
    if (!window.pdfjsLib) {
      toast('PDF library failed to load. Check your internet and refresh.', 'error');
      return;
    }
    clearDoc();
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      state.file = file;
      state.doc = doc;
      state.total = doc.numPages;
      state.page = 1;
      state.edits = {};
      el.name.textContent = file.name;
      el.meta.textContent = doc.numPages + (doc.numPages === 1 ? ' page, ' : ' pages, ') + formatBytes(file.size);
      el.card.hidden = false;
      el.view.hidden = false;
      el.reset.hidden = false;
      el.save.disabled = false;
      await renderPage(1);
    } catch (err) {
      console.error(err);
      clearDoc();
      toast('This PDF is damaged or password protected.', 'error');
    }
  }

  async function goto(n, force) {
    if (!state.doc || state.busy || n < 1 || n > state.total || (!force && n === state.page)) return;
    el.overlay.innerHTML = '';
    try {
      await renderPage(n);
    } catch (err) {
      console.error(err);
      toast('Could not render that page.', 'error');
    }
  }

  function clearDoc() {
    if (state.doc) {
      state.doc.destroy().catch(() => {});
      state.doc = null;
    }
    state.file = null;
    state.total = 0;
    state.page = 1;
    state.lines = [];
    state.edits = {};
    el.overlay.innerHTML = '';
    el.canvas.width = el.canvas.height = 0;
    el.view.hidden = true;
    el.card.hidden = true;
    el.save.disabled = true;
    el.reset.hidden = true;
    el.progress.hidden = true;
  }

  function reset() {
    clearDoc();
    el.input.value = '';
  }

  async function save() {
    if (!state.file || state.busy) return;
    const keys = Object.keys(state.edits);
    if (!keys.length) {
      toast('Nothing to change yet - click a line and edit it first.', 'error');
      return;
    }
    if (!libsReady()) return;

    state.busy = true;
    el.save.disabled = true;
    el.save.textContent = 'Saving…';
    el.progress.hidden = false;
    setProgress('pe', 20, 'Re-writing the edited lines…');

    try {
      const bytes = new Uint8Array(await state.file.arrayBuffer()); // fresh copy: pdf.js may have detached the first one
      const doc = await PDFLib.PDFDocument.load(bytes);
      const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);

      const byPage = {};
      keys.forEach((k) => {
        const e = state.edits[k];
        (byPage[e.page] = byPage[e.page] || []).push(e);
      });

      for (const p of Object.keys(byPage)) {
        const page = doc.getPage(Number(p));
        if (!page) continue;
        for (const e of byPage[p]) {
          const bg = e.bg.map((c) => c / 255);
          page.drawRectangle({
            x: e.rect.x,
            y: e.rect.y,
            width: e.rect.w,
            height: e.rect.h,
            color: PDFLib.rgb(bg[0], bg[1], bg[2]),
          });
          const text = sanitizeWinAnsi(e.text);
          if (!text.trim()) continue; // blank line = just the white-out
          let size = e.size;
          const maxW = e.rect.w - e.size * 0.15;
          const tw = font.widthOfTextAtSize(text, size);
          if (tw > maxW) size = Math.max(4, size * (maxW / tw)); // shrink to fit the original width
          const fg = e.fg.map((c) => c / 255);
          page.drawText(text, { x: e.x0, y: e.y, size, font, color: PDFLib.rgb(fg[0], fg[1], fg[2]) });
        }
      }

      setProgress('pe', 100, 'Done.');
      const out = await doc.save();
      downloadBlob(new Blob([out], { type: 'application/pdf' }), baseName(state.file.name) + '-edited.pdf');
      toast('PDF saved with ' + keys.length + (keys.length === 1 ? ' edit.' : ' edits.'), 'success');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      toast('Could not save this PDF. It may be damaged or password protected.', 'error');
    } finally {
      state.busy = false;
      el.save.disabled = false;
      el.save.textContent = 'Save PDF';
    }
  }

  /* ---------- Wiring ---------- */
  onFileInput(el.input, choose);
  setupDropzone(el.drop, choose);
  el.remove.addEventListener('click', reset);
  el.reset.addEventListener('click', reset);
  el.save.addEventListener('click', save);
  el.prev.addEventListener('click', () => goto(state.page - 1));
  el.next.addEventListener('click', () => goto(state.page + 1));

  let resizeTimer;
  window.addEventListener('resize', () => {
    if (!state.doc) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goto(state.page, true), 250);
  });
})();
