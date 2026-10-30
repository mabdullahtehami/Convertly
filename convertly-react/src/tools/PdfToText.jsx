/* ==========================================================
   Convertly React - PDF to Text
   Port of js/pdf-to-text.js (text based PDFs)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileLines } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, nextFrame, isPdfFile } from '../lib/helpers.js';
import { pdfjsLib } from '../lib/pdfjs.js';

export default function PdfToText({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Extracting…' });

  function choose(chosen) {
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please select a PDF file.', 'error');
      return;
    }
    setFile(chosen);
    setProgress((p) => ({ ...p, show: false }));
  }

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
    setProgress((p) => ({ ...p, show: false }));
  }

  async function convert() {
    if (!file || busy) return;
    if (!pdfjsLib) {
      toast('PDF library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 0, text: 'Reading PDF…' });

    let pdf = null;
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      pdf = await pdfjsLib.getDocument({ data }).promise;
      const total = pdf.numPages;
      const pages = [];

      for (let n = 1; n <= total; n++) {
        setProgress({
          show: true,
          percent: ((n - 1) / total) * 90,
          text: 'Reading page ' + n + ' of ' + total + '…',
        });
        await nextFrame(); // let the progress bar repaint between pages

        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        const lines = new Map(); // group the scattered words back into lines

        for (const item of content.items) {
          if (!item.str || !item.str.trim() || !item.transform) continue;
          const key = Math.round(item.transform[5] / 3) * 3; // same rounded Y = same line
          if (!lines.has(key)) lines.set(key, []);
          lines.get(key).push({ x: item.transform[4], text: item.str });
        }

        const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]); // top to bottom
        pages.push(
          sorted
            .map(([, words]) =>
              words.sort((a, b) => a.x - b.x).map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim()
            ) // left to right
            .filter(Boolean)
            .join('\n')
        );
        page.cleanup();
      }

      const text = pages.join('\n\n');
      if (!text.trim()) throw new Error('No selectable text was found.');

      setProgress({ show: true, percent: 100, text: 'Done.' });
      downloadBlob(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }), baseName(file.name) + '.txt');
      toast('Text extracted.', 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      if (err && err.message === 'No selectable text was found.') {
        toast('No selectable text was found. This PDF is probably a scan.', 'error');
      } else {
        toast('Could not read this PDF. It may be damaged or protected.', 'error');
      }
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="pdftotxt"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={(fileList) => {
          const chosen = fileList && fileList[0];
          if (inputRef.current) inputRef.current.value = '';
          choose(chosen);
        }}
        icon={DzFileLines}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="Text-based PDFs only. Scanned PDFs have no selectable text."
      />

      <FileCard idPrefix="pdftotxt" badge="PDF" file={file} onRemove={reset} />

      <div className="actions">
        <button className="btn btn-primary" id="pdftotxtBtn" type="button" disabled={busy || !file} onClick={convert}>
          {busy ? 'Extracting…' : 'Extract text'}
        </button>
      </div>

      <ProgressBar idPrefix="pdftotxt" show={progress.show} percent={progress.percent} text={progress.text} />
    </section>
  );
}
