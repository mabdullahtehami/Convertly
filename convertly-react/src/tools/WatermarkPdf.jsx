/* ==========================================================
   Convertly React - Watermark PDF
   Port of js/watermark-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, isPdfFile } from '../lib/helpers.js';
import { PDFDocument, StandardFonts, rgb, libsReady } from '../lib/pdfLib.js';

export default function WatermarkPdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState('0.3');
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

  async function addWatermark() {
    const words = text.trim();
    if (!words) {
      toast('Please enter the watermark text.', 'error');
      return;
    }
    if (!file || busy || !libsReady(toast)) return;
    setBusy(true);

    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const grey = rgb(0.45, 0.45, 0.45); // neutral grey reads on light and dark pages
      const alpha = Number(opacity);

      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        let size = Math.min(48, Math.round(width / 14)); // default watermark size
        const firstWidth = font.widthOfTextAtSize(words, size);
        if (firstWidth > width - 48) size = Math.floor((size * (width - 48)) / firstWidth); // shrink long text
        const textWidth = font.widthOfTextAtSize(words, size); // measure again after resizing
        page.drawText(words, {
          x: (width - textWidth) / 2, // centred horizontally
          y: (height - size) / 2, // centred vertically
          size,
          font,
          color: grey,
          opacity: alpha,
        });
      });

      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(file.name) + '-watermarked.pdf');
      toast('Watermark added.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not add the watermark. The PDF may be damaged or protected.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="watermark"
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
        sub="The text is stamped across every page."
      />

      <FileCard idPrefix="watermark" badge="PDF" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="watermarkText">Watermark text</label>
          <input
            type="text"
            id="watermarkText"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="watermarkOpacity">Opacity</label>
          <select id="watermarkOpacity" value={opacity} onChange={(e) => setOpacity(e.target.value)}>
            <option value="0.15">Light</option>
            <option value="0.3">Normal</option>
            <option value="0.5">Strong</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="watermarkBtn"
          type="button"
          disabled={busy || !file}
          onClick={addWatermark}
        >
          {busy ? 'Adding watermark…' : 'Add watermark'}
        </button>
      </div>
    </section>
  );
}
