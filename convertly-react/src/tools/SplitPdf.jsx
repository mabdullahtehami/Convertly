/* ==========================================================
   Convertly React - Split PDF
   Port of js/split-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, nextFrame, isPdfFile, parseRanges } from '../lib/helpers.js';
import { PDFDocument, libsReady, openPdfLib } from '../lib/pdfLib.js';
import JSZip from 'jszip';

export default function SplitPdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const rangeRef = useRef(null);

  const [file, setFile] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [pages, setPages] = useState(0);
  const [mode, setMode] = useState('extract');
  const [range, setRange] = useState('');
  const [placeholder, setPlaceholder] = useState('Example: 1-3, 5, 8-10');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Splitting…' });

  async function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please choose a PDF file.', 'error');
      return;
    }
    if (!libsReady(toast)) return;
    const buf = await chosen.arrayBuffer();
    const doc = await openPdfLib(buf);
    if (!doc) {
      toast('This PDF is damaged or password protected.', 'error');
      return;
    }
    setFile(chosen);
    setBuffer(buf);
    setPages(doc.getPageCount());
    setPlaceholder('Example: 1-3, 5 (total ' + doc.getPageCount() + ' pages)');
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPages(0);
    if (inputRef.current) inputRef.current.value = '';
    setProgress((p) => ({ ...p, show: false }));
  }

  async function split() {
    if (!file || busy || !libsReady(toast)) return;
    let indices = null;

    if (mode === 'extract') {
      indices = parseRanges(range, pages);
      if (!indices) {
        toast('Enter valid pages between 1 and ' + pages + ', like 1-3, 5.', 'error');
        if (rangeRef.current) rangeRef.current.focus();
        return;
      }
    } else if (pages < 2) {
      toast('This PDF has only one page.', 'error');
      return;
    } else if (!JSZip) {
      toast('ZIP library failed to load. Refresh and try again.', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 0, text: 'Reading PDF…' });

    try {
      const src = await PDFDocument.load(buffer);
      const stem = baseName(file.name);

      if (mode === 'extract') {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, indices);
        copied.forEach((p) => out.addPage(p));
        setProgress({ show: true, percent: 100, text: 'Saving…' });
        const bytes = await out.save();
        downloadBlob(new Blob([bytes], { type: 'application/pdf' }), stem + '-extracted.pdf');
        toast('Pages extracted.', 'success');
      } else {
        const zip = new JSZip();
        const pad = String(pages).length;
        for (let i = 0; i < pages; i++) {
          setProgress({
            show: true,
            percent: (i / pages) * 100,
            text: 'Splitting page ' + (i + 1) + ' of ' + pages + '…',
          });
          await nextFrame();
          const out = await PDFDocument.create();
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          zip.file(stem + '-page-' + String(i + 1).padStart(pad, '0') + '.pdf', await out.save());
        }
        setProgress({ show: true, percent: 100, text: 'Creating ZIP…' });
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        downloadBlob(blob, stem + '-pages.zip');
        toast('PDF split into ' + pages + ' files.', 'success');
      }
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not split this PDF. Try another file.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="split"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileArrow}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="Pick pages to extract, or split every page into its own file."
      />

      <FileCard
        idPrefix="split"
        badge="PDF"
        file={file}
        meta={file ? pages + (pages === 1 ? ' page, ' : ' pages, ') + formatBytes(file.size) : ''}
        onRemove={reset}
      />

      <div className="options">
        <div className="field">
          <label htmlFor="splitMode">Split mode</label>
          <select id="splitMode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="extract">Extract selected pages into one PDF</option>
            <option value="each">Split every page into a separate PDF (ZIP)</option>
          </select>
        </div>
        <div className="field" id="splitRangeField" hidden={mode !== 'extract'}>
          <label htmlFor="splitRange">Pages</label>
          <input
            ref={rangeRef}
            type="text"
            id="splitRange"
            placeholder={placeholder}
            autoComplete="off"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" id="splitBtn" type="button" disabled={busy || !file} onClick={split}>
          {busy ? 'Splitting…' : 'Split PDF'}
        </button>
      </div>

      <ProgressBar idPrefix="split" show={progress.show} percent={progress.percent} text={progress.text} />
    </section>
  );
}
