/* ==========================================================
   Convertly React - Rotate PDF
   Port of js/rotate-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, isPdfFile } from '../lib/helpers.js';
import { PDFDocument, degrees, libsReady } from '../lib/pdfLib.js';

export default function RotatePdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState('90');
  const [busy, setBusy] = useState(false);

  function choose(chosen) {
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please select a PDF file.', 'error');
      return;
    }
    setFile(chosen);
  }

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function rotate() {
    if (!file || busy || !libsReady(toast)) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const deg = Number(angle);
      doc.getPages().forEach((page) => {
        const next = (page.getRotation().angle + deg + 360) % 360; // keep it between 0 and 359
        page.setRotation(degrees(next));
      });
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(file.name) + '-rotated.pdf');
      toast('PDF rotated.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not rotate this PDF. It may be damaged or protected.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="rotate"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={(fileList) => {
          const chosen = fileList && fileList[0];
          if (inputRef.current) inputRef.current.value = '';
          choose(chosen);
        }}
        icon={DzFileArrow}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="Every page is turned by the same angle."
      />

      <FileCard idPrefix="rotate" badge="PDF" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="rotateAngle">Rotation</label>
          <select id="rotateAngle" value={angle} onChange={(e) => setAngle(e.target.value)}>
            <option value="90">90° clockwise</option>
            <option value="180">180°</option>
            <option value="-90">90° counter-clockwise</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" id="rotateBtn" type="button" disabled={busy || !file} onClick={rotate}>
          {busy ? 'Rotating…' : 'Rotate PDF'}
        </button>
      </div>
    </section>
  );
}
