/* ==========================================================
   Convertly React - Edit PDF Text
   Port of js/pdf-editor.js
   pdf.js renders the page and puts editable inputs over every
   line of text; pdf-lib writes only the changed lines back.
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileLines } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { baseName, downloadBlob, formatBytes, isPdfFile } from '../lib/helpers.js';
import { pdfjsLib } from '../lib/pdfjs.js';
import { PDFDocument, StandardFonts, rgb } from '../lib/pdfLib.js';

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

const lineKey = (p, i) => 'p' + p + 'i' + i;

export default function PdfEditor({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);

  const docRef = useRef(null); // pdf.js document
  const fileRef = useRef(null);
  const pageRef = useRef(1);
  const totalRef = useRef(0);
  const rendering = useRef(false);
  const resizeTimer = useRef(null);

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [total, setTotal] = useState(0);
  const [scale, setScale] = useState(1);
  const [lines, setLines] = useState([]); // editable lines of the page on screen
  const [edits, setEdits] = useState({}); // key -> line copy + new text (survives page changes)
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });

  /* ---------- Render one page + its editable overlay ---------- */
  async function renderPage(n) {
    const doc = docRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!doc || !stage || !canvas || rendering.current) return;
    rendering.current = true;
    try {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const avail = Math.max(320, stage.clientWidth - 24);
      const nextScale = Math.min(2, Math.max(0.5, avail / base.width));
      const viewport = page.getViewport({ scale: nextScale });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      pageRef.current = n;
      setPageNo(n);
      setScale(nextScale);

      let pixels = null;
      try {
        pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error(err); // no pixel access: white background, black ink
      }

      const content = await page.getTextContent();
      setLines(buildLines(content.items, viewport, pixels));
      page.cleanup();
    } finally {
      rendering.current = false;
    }
  }

  /* ---------- Open / navigate ---------- */
  async function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please choose a PDF file.', 'error');
      return;
    }
    clearDoc();
    try {
      const data = new Uint8Array(await chosen.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      fileRef.current = chosen;
      docRef.current = doc;
      totalRef.current = doc.numPages;
      pageRef.current = 1;
      setEdits({});
      setPageNo(1);
      setTotal(doc.numPages);
      setMeta(doc.numPages + (doc.numPages === 1 ? ' page, ' : ' pages, ') + formatBytes(chosen.size));
      setFile(chosen); // the effect below paints page 1
    } catch (err) {
      console.error(err);
      clearDoc();
      toast('This PDF is damaged or password protected.', 'error');
    }
  }

  async function goto(n) {
    if (!docRef.current || rendering.current || n < 1 || n > totalRef.current || n === pageRef.current) return;
    setLines([]);
    try {
      await renderPage(n);
    } catch (err) {
      console.error(err);
      toast('Could not render that page.', 'error');
    }
  }

  function clearDoc() {
    if (docRef.current) {
      docRef.current.destroy().catch(() => {});
      docRef.current = null;
    }
    fileRef.current = null;
    totalRef.current = 0;
    pageRef.current = 1;
    setLines([]);
    setEdits({});
    setPageNo(1);
    setTotal(0);
    setFile(null);
    setMeta('');
    setProgress((p) => ({ ...p, show: false }));
    const canvas = canvasRef.current;
    if (canvas) canvas.width = canvas.height = 0;
  }

  function reset() {
    clearDoc();
    if (inputRef.current) inputRef.current.value = '';
  }

  /* ---------- Save ---------- */
  async function save() {
    if (!file || saving) return;
    const keys = Object.keys(edits);
    if (!keys.length) {
      toast('Nothing to change yet - click a line and edit it first.', 'error');
      return;
    }

    setSaving(true);
    setProgress({ show: true, percent: 20, text: 'Re-writing the edited lines…' });

    try {
      const bytes = new Uint8Array(await file.arrayBuffer()); // fresh copy: pdf.js may have detached the first one
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);

      const byPage = {};
      keys.forEach((k) => {
        const e = edits[k];
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
            color: rgb(bg[0], bg[1], bg[2]),
          });
          const text = sanitizeWinAnsi(e.text);
          if (!text.trim()) continue; // blank line = just the white-out
          let size = e.size;
          const maxW = e.rect.w - e.size * 0.15;
          const tw = font.widthOfTextAtSize(text, size);
          if (tw > maxW) size = Math.max(4, size * (maxW / tw)); // shrink to fit the original width
          const fg = e.fg.map((c) => c / 255);
          page.drawText(text, { x: e.x0, y: e.y, size, font, color: rgb(fg[0], fg[1], fg[2]) });
        }
      }

      setProgress({ show: true, percent: 100, text: 'Done.' });
      const out = await doc.save();
      downloadBlob(new Blob([out], { type: 'application/pdf' }), baseName(file.name) + '-edited.pdf');
      toast('PDF saved with ' + keys.length + (keys.length === 1 ? ' edit.' : ' edits.'), 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not save this PDF. It may be damaged or password protected.', 'error');
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Wiring ---------- */
  // Paint page 1 as soon as a document is opened (the panel must be visible first).
  useEffect(() => {
    if (!file) return;
    renderPage(1).catch((err) => {
      console.error(err);
      toast('Could not render that page.', 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Keep the overlay sized to the panel when the window changes.
  useEffect(() => {
    function onResize() {
      if (!docRef.current) return;
      clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(() => {
        renderPage(pageRef.current).catch(() => {});
      }, 250);
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer.current);
      if (docRef.current) {
        docRef.current.destroy().catch(() => {});
        docRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function editLine(i, value) {
    const line = lines[i];
    const k = lineKey(pageNo, i);
    setEdits((prev) => {
      const next = { ...prev };
      if (value === line.text) delete next[k];
      else next[k] = Object.assign({}, line, { page: pageNo, text: value });
      return next;
    });
  }

  return (
    <section className="panel" id={'panel-' + id} hidden={hidden}>
      <Dropzone
        id="pe"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileLines}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="Click any line of text to change it, then save."
      />

      <FileCard idPrefix="pe" badge="PDF" file={file} meta={meta} onRemove={reset} />

      <div className="pe-view" hidden={!file}>
        <div className="pe-pages">
          <button className="btn btn-quiet" type="button" aria-label="Previous page" disabled={pageNo <= 1} onClick={() => goto(pageNo - 1)}>
            &lsaquo;
          </button>
          <span>
            Page {pageNo} of {total || 1}
          </span>
          <button className="btn btn-quiet" type="button" aria-label="Next page" disabled={pageNo >= total} onClick={() => goto(pageNo + 1)}>
            &rsaquo;
          </button>
        </div>

        <div className="pe-stage" ref={stageRef}>
          <div className="pe-page">
            <canvas ref={canvasRef} />
            <div className="pe-overlay">
              {lines.map((line, i) => {
                const k = lineKey(pageNo, i);
                const saved = edits[k];
                return (
                  <input
                    key={k}
                    type="text"
                    className={saved ? 'pe-item is-changed' : 'pe-item'}
                    value={saved ? saved.text : line.text}
                    aria-label={'Edit line: ' + line.text}
                    style={{
                      left: line.box.x + 'px',
                      top: line.box.y + 'px',
                      width: Math.max(24, line.box.w) + 'px',
                      height: Math.max(16, line.box.h) + 'px',
                      fontSize: line.size * scale + 'px',
                      background: 'rgb(' + line.bg.join(',') + ')',
                    }}
                    onChange={(e) => editLine(i, e.target.value)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <p className="pe-hint">Click a line to edit it. Lines you change are re-written into the saved PDF.</p>
      </div>

      <div className="actions">
        <button className="btn btn-primary" id="peSave" type="button" disabled={!file || saving} onClick={save}>
          {saving ? 'Saving…' : 'Save PDF'}
        </button>
        <button className="btn btn-quiet" type="button" hidden={!file} onClick={reset}>
          Start over
        </button>
      </div>

      <ProgressBar idPrefix="pe" show={progress.show} percent={progress.percent} text={progress.text} />
    </section>
  );
}
