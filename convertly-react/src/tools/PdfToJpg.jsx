/* ==========================================================
   Convertly React - PDF -> JPG
   Port of js/pdf-to-jpg.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import IconButton from '../components/IconButton.jsx';
import { DzFileArrow, ICON_DOWNLOAD } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import {
  formatBytes,
  baseName,
  downloadBlob,
  canvasToBlob,
  nextFrame,
  isPdfFile,
} from '../lib/helpers.js';
import { pdfjsLib } from '../lib/pdfjs.js';
import JSZip from 'jszip';

export default function PdfToJpg({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dpi, setDpi] = useState('150');
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Preparing…' });
  const [results, setResults] = useState([]);
  const [resultsShow, setResultsShow] = useState(false);
  const [resultsTitle, setResultsTitle] = useState('Your images');
  const [zipHidden, setZipHidden] = useState(false);
  const [zipText, setZipText] = useState('Download all as ZIP');
  const [zipDisabled, setZipDisabled] = useState(false);

  function clearResults() {
    /* Functional update: always revokes the CURRENT results,
       even when called from inside a running conversion. */
    setResults((prev) => {
      prev.forEach((r) => URL.revokeObjectURL(r.url));
      return [];
    });
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  function setPdfFile(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('That file is not a PDF. Please choose a .pdf file.', 'error');
      return;
    }
    clearResults();
    setFile(chosen);
    setResultsTitle('Your images');
    setZipHidden(false);
  }

  function removePdfFile() {
    clearResults();
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function convertPdfToJpg() {
    if (!file || busy) return;
    if (!pdfjsLib) {
      toast('PDF library failed to load. Check your internet connection and refresh.', 'error');
      return;
    }

    setBusy(true);
    clearResults();
    setProgress({ show: true, percent: 0, text: 'Reading PDF…' });

    const dpiValue = Number(dpi);
    const qualityValue = quality / 100;
    const MAX_SIDE = 9000;

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const total = pdf.numPages;
      const pad = String(total).length;
      const stem = baseName(file.name);

      setResultsShow(true);
      setResultsTitle('Your images');

      for (let n = 1; n <= total; n++) {
        setProgress({
          show: true,
          percent: ((n - 1) / total) * 100,
          text: 'Converting page ' + n + ' of ' + total + '…',
        });
        await nextFrame();

        const page = await pdf.getPage(n);
        let scale = dpiValue / 72;
        const base = page.getViewport({ scale: 1 });
        const longest = Math.max(base.width, base.height) * scale;
        if (longest > MAX_SIDE) scale *= MAX_SIDE / longest;

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await canvasToBlob(canvas, 'image/jpeg', qualityValue);

        const result = {
          name: stem + '-page-' + String(n).padStart(pad, '0') + '.jpg',
          blob,
          url: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height,
          pageNo: n,
        };
        setResults((prev) => [...prev, result]);

        canvas.width = canvas.height = 0;
        page.cleanup();
      }

      setProgress({
        show: true,
        percent: 100,
        text: 'Done. ' + total + (total === 1 ? ' page' : ' pages') + ' converted.',
      });
      setResultsTitle(total + (total === 1 ? ' image ready' : ' images ready'));
      setZipHidden(total === 1);
      toast('Conversion complete.', 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      if (err && err.name === 'PasswordException') {
        toast('This PDF is password protected. Remove the password and try again.', 'error');
      } else if (err && err.name === 'InvalidPDFException') {
        toast('This file is not a valid PDF or is damaged.', 'error');
      } else {
        toast('Something went wrong while converting. Please try another file.', 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdfZip() {
    if (!results.length) return;
    if (!JSZip) {
      toast('ZIP library failed to load. Download pages one by one instead.', 'error');
      return;
    }
    setZipDisabled(true);
    setZipText('Preparing ZIP…');
    try {
      const zip = new JSZip();
      results.forEach((r) => zip.file(r.name, r.blob));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      downloadBlob(blob, baseName(file.name) + '-images.zip');
    } catch (err) {
      console.error(err);
      toast('Could not create the ZIP file.', 'error');
    } finally {
      setZipDisabled(false);
      setZipText('Download all as ZIP');
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="pdf"
        accept="application/pdf,.pdf"
        onFiles={setPdfFile}
        icon={DzFileArrow}
        inputRef={inputRef}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="One PDF at a time. Every page becomes a JPG."
      />

      <FileCard idPrefix="pdf" badge="PDF" file={file} onRemove={removePdfFile} />

      <div className="options">
        <div className="field">
          <label htmlFor="pdfDpi">Image resolution</label>
          <select id="pdfDpi" value={dpi} onChange={(e) => setDpi(e.target.value)}>
            <option value="100">Standard (100 DPI)</option>
            <option value="150">High (150 DPI)</option>
            <option value="200">Very high (200 DPI)</option>
            <option value="300">Print quality (300 DPI)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pdfQuality">
            JPG quality <output id="pdfQualityOut">{quality}%</output>
          </label>
          <input
            type="range"
            id="pdfQuality"
            min="50"
            max="100"
            step="5"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="pdfConvert"
          type="button"
          disabled={busy || !file}
          onClick={convertPdfToJpg}
        >
          {busy ? 'Converting…' : 'Convert to JPG'}
        </button>
      </div>

      <ProgressBar idPrefix="pdf" show={progress.show} percent={progress.percent} text={progress.text} />

      <div className="results" id="pdfResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2 id="pdfResultsTitle">{resultsTitle}</h2>
          <button
            className="btn btn-primary btn-sm"
            id="pdfZip"
            type="button"
            hidden={zipHidden}
            disabled={zipDisabled}
            onClick={downloadPdfZip}
          >
            {zipText}
          </button>
        </div>
        <div className="grid" id="pdfGrid">
          {results.map((result) => (
            <div className="thumb" key={result.name}>
              <div className="thumb-img">
                <img src={result.url} alt={'Page ' + result.pageNo} loading="lazy" />
              </div>
              <div className="thumb-body">
                <div className="thumb-title">
                  <strong>Page {result.pageNo}</strong>
                  <span>
                    {result.width} x {result.height} px, {formatBytes(result.blob.size)}
                  </span>
                </div>
                <IconButton
                  label={'Download page ' + result.pageNo}
                  action="download"
                  disabled={false}
                  onClick={() => downloadBlob(result.blob, result.name)}
                >
                  {ICON_DOWNLOAD}
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
