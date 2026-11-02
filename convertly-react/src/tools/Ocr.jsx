/* ==========================================================
   Convertly React - Image & PDF OCR
   Port of js/ocr.js (Tesseract.js, English)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileLines } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { baseName, downloadBlob, isPdfFile } from '../lib/helpers.js';
import { createWorker } from 'tesseract.js';
import workerUrl from 'tesseract.js/dist/worker.min.js?url';
import { pdfjsLib } from '../lib/pdfjs.js';

export default function Ocr({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Scanning…' });
  const [resultsShow, setResultsShow] = useState(false);
  const [summary, setSummary] = useState('Text found');
  const [text, setText] = useState('');

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen) && !chosen.type.startsWith('image/')) {
      toast('Please select an image or a PDF file.', 'error');
      return;
    }
    setFile(chosen);
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
    setText('');
    setSummary('Text found');
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  async function convert() {
    if (!file || busy) return;

    setBusy(true);
    setResultsShow(false);
    setProgress({ show: true, percent: 0, text: 'Preparing the OCR engine…' });

    let worker = null;
    let done = 0;
    let total = 1;
    try {
      worker = await createWorker('eng', 1, {
        workerPath: workerUrl,
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress({
              show: true,
              percent: ((done + m.progress) / total) * 100,
              text: total > 1 ? 'Scanning page ' + (done + 1) + ' of ' + total + '…' : 'Scanning the image…',
            });
          } else {
            setProgress({ show: true, percent: (done / total) * 100, text: 'Preparing the OCR engine…' });
          }
        },
      });

      /* PDF pages are rendered and recognised ONE at a time (2x scale),
         so a big scan never holds every page canvas in memory. */
      const found = [];
      if (isPdfFile(file)) {
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        try {
          total = pdf.numPages;
          for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            page.cleanup();
            const { data: ocr } = await worker.recognize(canvas);
            found.push(ocr.text.trim());
            done++;
            canvas.width = canvas.height = 0; // give the memory back
          }
        } finally {
          pdf.destroy().catch(() => {});
        }
      } else {
        const { data } = await worker.recognize(file);
        found.push(data.text.trim());
        done = 1;
      }

      const result = found.join('\n\n').trim();
      if (!result) {
        toast('No text was found. Try a clearer photo or scan.', 'error');
        setProgress((p) => ({ ...p, show: false }));
        return;
      }

      setText(result);
      setSummary(total > 1 ? 'Text found in ' + total + ' pages' : 'Text found');
      setResultsShow(true);
      setProgress({ show: true, percent: 100, text: 'Done.' });
      toast('Text extracted.', 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not read this file. Try a JPG, PNG or an unprotected PDF.', 'error');
    } finally {
      if (worker) await worker.terminate().catch(() => {});
      setBusy(false);
    }
  }

  function download() {
    if (text) downloadBlob(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }), baseName(file.name) + '.txt');
  }

  return (
    <section className="panel" id={'panel-' + id} hidden={hidden}>
      <Dropzone
        id="ocr"
        accept="image/*,application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileLines}
        title={
          <>
            Drop an image or PDF here or <u>browse</u>
          </>
        }
        sub="Text from scans, photos and screenshots. Nothing leaves your browser."
      />

      <FileCard idPrefix="ocr" badge={file && isPdfFile(file) ? 'PDF' : 'IMG'} file={file} onRemove={reset} />

      <div className="actions">
        <button className="btn btn-primary" id="ocrBtn" type="button" disabled={busy || !file} onClick={convert}>
          {busy ? 'Scanning…' : 'Scan for text'}
        </button>
      </div>

      <ProgressBar idPrefix="ocr" show={progress.show} percent={progress.percent} text={progress.text} />

      <div className="results" id="ocrResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2 id="ocrSummary">{summary}</h2>
          <button className="btn btn-primary btn-sm" id="ocrDownload" type="button" onClick={download}>
            Download TXT
          </button>
        </div>
        <textarea rows="10" readOnly value={text} />
      </div>
    </section>
  );
}
