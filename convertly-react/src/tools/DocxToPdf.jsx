/* ==========================================================
   Convertly React - DOCX -> PDF
   Port of js/docx-to-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileLines } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob } from '../lib/helpers.js';
import mammoth from '../lib/mammoth.js';
import html2pdf from '../lib/html2pdf.js';

export default function DocxToPdf({ id, hidden }) {
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
    if (!/\.docx$/i.test(chosen.name)) {
      toast('Please select a .docx Word document.', 'error');
      return;
    }
    if (chosen.size > 25 * 1024 * 1024) {
      toast('Please choose a DOCX file smaller than 25 MB.', 'error');
      return;
    }
    setFile(chosen);
    setBlob(null);
    setResultsShow(false);
  }

  async function convert() {
    if (!file || busy) return;
    if (!mammoth || typeof html2pdf !== 'function') {
      toast('A conversion library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 10, text: 'Reading Word document…' });
    setResultsShow(false);

    let container = null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

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

      setProgress({ show: true, percent: 35, text: 'Preparing PDF…' });

      const pdfBlob = await html2pdf()
        .set({
          margin: 10,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 1.5, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(container)
        .outputPdf('blob');

      if (!pdfBlob || !pdfBlob.size) throw new Error('The PDF output was empty.');

      setBlob(pdfBlob);
      setResultsShow(true);
      setProgress({ show: true, percent: 100, text: 'PDF ready to download.' });
      toast('DOCX to PDF conversion complete.', 'success');
    } catch (err) {
      console.error('DOCX to PDF error:', err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not convert this Word file. Try another DOCX file.', 'error');
    } finally {
      if (container) container.remove();
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="docx"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileLines}
        title={
          <>
            Drop a DOCX file here or <u>browse</u>
          </>
        }
        sub="Select a Microsoft Word document (.docx)."
      />

      <FileCard idPrefix="docx" badge="DOCX" file={file} onRemove={reset} />

      <div className="actions">
        <button
          className="btn btn-primary"
          id="docxConvert"
          type="button"
          disabled={busy || !file}
          onClick={convert}
        >
          {busy ? 'Converting…' : 'Convert to PDF'}
        </button>
      </div>

      <ProgressBar idPrefix="docx" show={progress.show} percent={progress.percent} text={progress.text} />

      <div className="results" id="docxResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2>Your PDF is ready</h2>
          <button
            className="btn btn-primary btn-sm"
            id="docxDownload"
            type="button"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '.pdf');
            }}
          >
            Download PDF
          </button>
        </div>
      </div>
    </section>
  );
}
