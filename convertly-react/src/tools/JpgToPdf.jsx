/* ==========================================================
   Convertly React - JPG -> PDF
   Port of js/jpg-to-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ReorderList from '../components/ReorderList.jsx';
import { DzImage } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, nextFrame } from '../lib/helpers.js';
import { jsPDF } from 'jspdf';

const PAGE_SIZES_MM = { a4: [210, 297], letter: [215.9, 279.4] };
const PX_TO_MM_150DPI = 25.4 / 150;

export default function JpgToPdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const uidRef = useRef(0);

  const [items, setItems] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [pageMargin, setPageMargin] = useState('10');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Building PDF…' });

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const thumbUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({
          id: ++uidRef.current,
          name: file.name,
          size: file.size,
          width: canvas.width,
          height: canvas.height,
          dataUrl: canvas.toDataURL('image/jpeg', 0.95),
          thumbUrl,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(thumbUrl);
        reject(new Error('Cannot read ' + file.name));
      };
      img.src = thumbUrl;
    });
  }

  async function addImages(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      toast('Please choose image files (JPG, PNG or WebP).', 'error');
      return;
    }
    const failed = [];
    const loaded = [];
    for (const file of files) {
      try {
        loaded.push(await loadImageFile(file));
      } catch {
        failed.push(file.name);
      }
    }
    if (failed.length) {
      toast('Could not read: ' + failed.slice(0, 2).join(', ') + (failed.length > 2 ? '…' : ''), 'error');
    }
    if (loaded.length) setItems((prev) => [...prev, ...loaded]);
  }

  function moveItem(from, to) {
    setItems((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function removeItem(index) {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].thumbUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearImages() {
    items.forEach((it) => URL.revokeObjectURL(it.thumbUrl));
    setItems([]);
    if (inputRef.current) inputRef.current.value = '';
    setProgress((p) => ({ ...p, show: false }));
  }

  async function createPdf() {
    if (!items.length || busy) return;
    if (!jsPDF) {
      toast('PDF library failed to load. Check your internet connection and refresh.', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 0, text: 'Building PDF…' });

    try {
      const sizeMode = pageSize;
      const margin = Number(pageMargin);
      let doc = null;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress({
          show: true,
          percent: (i / items.length) * 100,
          text: 'Adding image ' + (i + 1) + ' of ' + items.length + '…',
        });
        await nextFrame();

        let pageW, pageH, drawW, drawH;

        if (sizeMode === 'fit') {
          drawW = item.width * PX_TO_MM_150DPI;
          drawH = item.height * PX_TO_MM_150DPI;
          pageW = drawW + margin * 2;
          pageH = drawH + margin * 2;
        } else {
          const [w, h] = PAGE_SIZES_MM[sizeMode];
          const landscape = item.width > item.height;
          pageW = landscape ? h : w;
          pageH = landscape ? w : h;
          const availW = pageW - margin * 2;
          const availH = pageH - margin * 2;
          const ratio = Math.min(availW / item.width, availH / item.height);
          drawW = item.width * ratio;
          drawH = item.height * ratio;
        }

        const orientation = pageW > pageH ? 'l' : 'p';
        if (!doc) {
          doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation, compress: true });
        } else {
          doc.addPage([pageW, pageH], orientation);
        }

        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        doc.addImage(item.dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
      }

      setProgress({ show: true, percent: 100, text: 'Saving PDF…' });
      const filename = (items.length === 1 ? baseName(items[0].name) : 'images') + '.pdf';
      doc.save(filename);
      toast('PDF created: ' + filename, 'success');
    } catch (err) {
      console.error(err);
      toast('Could not create the PDF. Try fewer or smaller images.', 'error');
      setProgress((p) => ({ ...p, show: false }));
    } finally {
      setBusy(false);
    }
  }

  const count = items.length;

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="img"
        accept="image/*"
        multiple
        inputRef={inputRef}
        onFiles={addImages}
        icon={DzImage}
        title={
          <>
            Drop images here or <u>browse</u>
          </>
        }
        sub="JPG, PNG or WebP. Select as many as you need."
      />

      <div className="results" id="imgListWrap" hidden={count === 0}>
        <div className="results-head">
          <h2 id="imgCount">
            {count} {count === 1 ? 'image' : 'images'}
          </h2>
          <button className="btn btn-quiet btn-sm" id="imgClear" type="button" onClick={clearImages}>
            Clear all
          </button>
        </div>
        <p className="hint">Drag to reorder, or use the arrows. Page order follows this list.</p>
        <ReorderList
          id="imgList"
          items={items}
          draggable
          onMove={moveItem}
          onRemove={removeItem}
          renderLead={(item) => <img src={item.thumbUrl} alt="" />}
          renderMeta={(item) => item.width + ' x ' + item.height + ' px, ' + formatBytes(item.size)}
        />
      </div>

      <div className="options">
        <div className="field">
          <label htmlFor="pageSize">Page size</label>
          <select id="pageSize" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
            <option value="fit">Same as image</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pageMargin">Margin</label>
          <select id="pageMargin" value={pageMargin} onChange={(e) => setPageMargin(e.target.value)}>
            <option value="0">None</option>
            <option value="10">Small</option>
            <option value="20">Medium</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="pdfCreate"
          type="button"
          disabled={busy || count === 0}
          onClick={createPdf}
        >
          {busy ? 'Creating…' : 'Create PDF'}
        </button>
      </div>

      <ProgressBar idPrefix="img" show={progress.show} percent={progress.percent} text={progress.text} />
    </section>
  );
}
