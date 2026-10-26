/* ==========================================================
   Convertly React - Compress PDF
   Port of js/compress-pdf.js (page -> optimized JPG -> new PDF)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, canvasToBlob, nextFrame, isPdfFile } from '../lib/helpers.js';
import { pdfjsLib } from '../lib/pdfjs.js';
import { PDFDocument, libsReady } from '../lib/pdfLib.js';

const LEVELS = {
  low: { dpi: 150, quality: 0.85 },
  medium: { dpi: 110, quality: 0.7 },
  high: { dpi: 72, quality: 0.5 },
};

export default function CompressPdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [blob, setBlob] = useState(null);
  const [level, setLevel] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Compressing…' });
  const [resultsShow, setResultsShow] = useState(false);
  const [summary, setSummary] = useState('Your PDF is ready');

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please choose a PDF file.', 'error');
      return;
    }
    setFile(chosen);
    setBlob(null);
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  function reset() {
    setFile(null);
    setBlob(null);
    if (inputRef.current) inputRef.current.value = '';
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  async function compress() {
    if (!file || busy || !libsReady(toast)) return;
    if (!pdfjsLib) {
      toast('PDF library failed to load. Check your internet connection and refresh.', 'error');
      return;
    }

    setBusy(true);
    setResultsShow(false);
    setProgress({ show: true, percent: 0, text: 'Reading PDF…' });

    const { dpi, quality } = LEVELS[level];
    let pdf = null;

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      pdf = await pdfjsLib.getDocument({ data }).promise;
      const total = pdf.numPages;
      const out = await PDFDocument.create();

      for (let n = 1; n <= total; n++) {
        setProgress({
          show: true,
          percent: ((n - 1) / total) * 100,
          text: 'Compressing page ' + n + ' of ' + total + '…',
        });
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

      setProgress({ show: true, percent: 100, text: 'Saving…' });
      const bytes = await out.save();
      const output = new Blob([bytes], { type: 'application/pdf' });

      const before = file.size;
      const after = output.size;
      if (after < before) {
        const saved = Math.round((1 - after / before) * 100);
        setSummary(formatBytes(before) + ' to ' + formatBytes(after) + ' (' + saved + '% smaller)');
        toast('PDF compressed.', 'success');
      } else {
        setSummary('No size reduction. Try a higher compression level.');
        toast('This PDF is already small. Try a higher compression level.', 'error');
      }
      setBlob(output);
      setResultsShow(true);
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      if (err && err.name === 'PasswordException') {
        toast('This PDF is password protected. Remove the password and try again.', 'error');
      } else {
        toast('Could not compress this PDF. Try another file.', 'error');
      }
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="compress"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileArrow}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="Make a large PDF smaller for email or upload."
      />

      <FileCard idPrefix="compress" badge="PDF" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="compressLevel">Compression level</label>
          <select id="compressLevel" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="low">Low (best quality)</option>
            <option value="medium">Medium (recommended)</option>
            <option value="high">High (smallest file)</option>
          </select>
        </div>
      </div>

      <p className="hint note">
        Compression turns each page into an optimized image, so text in the result can no longer be selected.
      </p>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="compressBtn"
          type="button"
          disabled={busy || !file}
          onClick={compress}
        >
          {busy ? 'Compressing…' : 'Compress PDF'}
        </button>
      </div>

      <ProgressBar idPrefix="compress" show={progress.show} percent={progress.percent} text={progress.text} />

      <div className="results" id="compressResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2 id="compressSummary">{summary}</h2>
          <button
            className="btn btn-primary btn-sm"
            id="compressDownload"
            type="button"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '-compressed.pdf');
            }}
          >
            Download PDF
          </button>
        </div>
      </div>
    </section>
  );
}
