/* ==========================================================
   Convertly React - PDF -> DOCX (text based PDFs)
   Port of js/pdf-to-docx.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileLines } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, nextFrame, isPdfFile } from '../lib/helpers.js';
import { pdfjsLib } from '../lib/pdfjs.js';
import docx from '../lib/docx.js';

export default function PdfToDocx({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Preparing document…' });
  const [resultsShow, setResultsShow] = useState(false);

  function reset() {
    setFile(null);
    setBlob(null);
    if (inputRef.current) inputRef.current.value = '';
    setResultsShow(false);
    setProgress({ show: false, percent: 0, text: 'Preparing document…' });
  }

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please select a PDF file.', 'error');
      return;
    }
    if (chosen.size > 30 * 1024 * 1024) {
      toast('Please choose a PDF smaller than 30 MB.', 'error');
      return;
    }
    setFile(chosen);
    setBlob(null);
    setResultsShow(false);
  }

  async function convert() {
    if (!file || busy) return;
    if (!pdfjsLib || !docx || !docx.Document || !docx.Packer) {
      toast('A required library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 0, text: 'Reading PDF…' });
    setResultsShow(false);

    let pdf = null;
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      pdf = await pdfjsLib.getDocument({ data }).promise;

      const D = docx;
      const paragraphs = [];
      const total = pdf.numPages;

      for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
        setProgress({
          show: true,
          percent: Math.round(((pageNumber - 1) / total) * 80),
          text: 'Extracting text from page ' + pageNumber + ' of ' + total + '…',
        });
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

      setProgress({ show: true, percent: 85, text: 'Creating Word document…' });
      const documentFile = new D.Document({ sections: [{ children: paragraphs }] });
      const output = await D.Packer.toBlob(documentFile);

      setBlob(output);
      setResultsShow(true);
      setProgress({ show: true, percent: 100, text: 'Word document ready to download.' });
      toast('PDF text converted to DOCX.', 'success');
    } catch (err) {
      console.error('PDF to DOCX error:', err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not convert this PDF. It may be damaged, protected, or scanned.', 'error');
    } finally {
      if (pdf) pdf.destroy().catch(() => {});
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="wordPdf"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileLines}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="Text-based PDFs only. Scanned PDFs have no text to extract."
      />

      <FileCard idPrefix="wordPdf" badge="PDF" file={file} onRemove={reset} />

      <div className="actions">
        <button
          className="btn btn-primary"
          id="wordPdfConvert"
          type="button"
          disabled={busy || !file}
          onClick={convert}
        >
          {busy ? 'Converting…' : 'Convert to DOCX'}
        </button>
      </div>

      <ProgressBar idPrefix="wordPdf" show={progress.show} percent={progress.percent} text={progress.text} />

      <div className="results" id="wordPdfResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2>Your Word document is ready</h2>
          <button
            className="btn btn-primary btn-sm"
            id="wordPdfDownload"
            type="button"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '.docx');
            }}
          >
            Download DOCX
          </button>
        </div>
      </div>
    </section>
  );
}
