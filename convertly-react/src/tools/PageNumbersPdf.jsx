/* ==========================================================
   Convertly React - Page Numbers
   Port of js/page-numbers-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { baseName, downloadBlob, isPdfFile } from '../lib/helpers.js';
import { PDFDocument, StandardFonts, rgb, libsReady } from '../lib/pdfLib.js';

export default function PageNumbersPdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pos, setPos] = useState('bc');
  const [start, setStart] = useState('1');
  const [busy, setBusy] = useState(false);

  function choose(fileList) {
    const chosen = fileList && fileList[0];
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

  async function addNumbers() {
    if (!file || busy || !libsReady(toast)) return;
    setBusy(true);

    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      let n = Number(start);
      if (!Number.isFinite(n) || n < 0) n = 1;

      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const label = String(n++);
        const labelWidth = font.widthOfTextAtSize(label, 10);
        const x = pos.includes('c') ? (width - labelWidth) / 2 : width - 24 - labelWidth;
        const y = pos[0] === 't' ? height - 24 : 24; // 't…' = top row, 'b…' = bottom row
        page.drawText(label, { x, y, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
      });

      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(file.name) + '-numbered.pdf');
      toast('Page numbers added.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not add page numbers. The PDF may be damaged or protected.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="pagenums"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileArrow}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="A small number is drawn on every page."
      />

      <FileCard idPrefix="pagenums" badge="PDF" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="pagenumsPos">Position</label>
          <select id="pagenumsPos" value={pos} onChange={(e) => setPos(e.target.value)}>
            <option value="bc">Bottom center</option>
            <option value="br">Bottom right</option>
            <option value="tc">Top center</option>
            <option value="tr">Top right</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pagenumsStart">Start at</label>
          <input
            type="number"
            id="pagenumsStart"
            min="0"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="pagenumsBtn"
          type="button"
          disabled={busy || !file}
          onClick={addNumbers}
        >
          {busy ? 'Adding numbers…' : 'Add page numbers'}
        </button>
      </div>
    </section>
  );
}
