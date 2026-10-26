/* ==========================================================
   Convertly React - Merge PDF
   Port of js/merge-pdf.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ReorderList from '../components/ReorderList.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, downloadBlob, nextFrame, isPdfFile } from '../lib/helpers.js';
import { PDFDocument, libsReady, openPdfLib } from '../lib/pdfLib.js';

export default function MergePdf({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const uidRef = useRef(0);

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: 'Merging…' });

  async function addFiles(fileList) {
    if (!libsReady(toast)) return;
    const files = [...fileList].filter(isPdfFile);
    if (!files.length) {
      toast('Please choose PDF files.', 'error');
      return;
    }
    const failed = [];
    const added = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const doc = await openPdfLib(buffer);
      if (!doc) {
        failed.push(file.name);
        continue;
      }
      added.push({
        id: ++uidRef.current,
        name: file.name,
        size: file.size,
        pages: doc.getPageCount(),
        buffer,
      });
    }
    if (failed.length) {
      toast('Could not open (damaged or protected): ' + failed.slice(0, 2).join(', '), 'error');
    }
    if (added.length) setItems((prev) => [...prev, ...added]);
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
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function merge() {
    if (items.length < 2 || busy || !libsReady(toast)) return;
    setBusy(true);
    setProgress({ show: true, percent: 0, text: 'Starting…' });

    try {
      const out = await PDFDocument.create();
      for (let i = 0; i < items.length; i++) {
        setProgress({
          show: true,
          percent: (i / items.length) * 100,
          text: 'Adding ' + items[i].name + '…',
        });
        await nextFrame();
        const src = await PDFDocument.load(items[i].buffer);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      setProgress({ show: true, percent: 100, text: 'Saving…' });
      const bytes = await out.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
      toast('PDFs merged successfully.', 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not merge these files. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const count = items.length;

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" aria-labelledby={'tab-' + id} hidden={hidden}>
      <Dropzone
        id="merge"
        accept="application/pdf,.pdf"
        multiple
        inputRef={inputRef}
        onFiles={(fileList) => {
          const files = [...fileList];
          if (inputRef.current) inputRef.current.value = '';
          addFiles(files);
        }}
        icon={DzFileArrow}
        title={
          <>
            Drop PDFs here or <u>browse</u>
          </>
        }
        sub="Select two or more PDF files to combine."
      />

      <div className="results" id="mergeListWrap" hidden={count === 0}>
        <div className="results-head">
          <h2 id="mergeCount">
            {count} {count === 1 ? 'file' : 'files'}
          </h2>
          <button
            className="btn btn-quiet btn-sm"
            id="mergeClear"
            type="button"
            onClick={() => {
              setItems([]);
              setProgress((p) => ({ ...p, show: false }));
            }}
          >
            Clear all
          </button>
        </div>
        <p className="hint">Use the arrows to set the order. The first file comes first in the merged PDF.</p>
        <ReorderList
          id="mergeList"
          items={items}
          onMove={moveItem}
          onRemove={removeItem}
          renderLead={() => <div className="file-badge">PDF</div>}
          renderMeta={(item) =>
            item.pages + (item.pages === 1 ? ' page, ' : ' pages, ') + formatBytes(item.size)
          }
        />
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="mergeBtn"
          type="button"
          disabled={count < 2 || busy}
          onClick={merge}
        >
          {busy ? 'Merging…' : 'Merge PDFs'}
        </button>
      </div>

      <ProgressBar idPrefix="merge" show={progress.show} percent={progress.percent} text={progress.text} />
    </section>
  );
}
