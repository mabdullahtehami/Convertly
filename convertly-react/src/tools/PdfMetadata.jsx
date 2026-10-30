/* ==========================================================
   Convertly React - PDF Metadata
   Port of js/pdf-metadata.js
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzFileArrow } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { baseName, downloadBlob, isPdfFile } from '../lib/helpers.js';
import { libsReady, openPdfLib } from '../lib/pdfLib.js';

const EMPTY = { title: '', author: '', subject: '', keywords: '' };

export default function PdfMetadata({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const docRef = useRef(null); // the loaded pdf-lib document (not UI state)

  const [file, setFile] = useState(null);
  const [fields, setFields] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  async function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen)) {
      toast('Please select a PDF file.', 'error');
      return;
    }
    if (!libsReady(toast)) return;
    const doc = await openPdfLib(await chosen.arrayBuffer()); // null when damaged or protected
    if (!doc) {
      toast('Could not open this PDF. It may be damaged or protected.', 'error');
      return;
    }
    docRef.current = doc;
    setFile(chosen);
    /* Show the values the PDF already has */
    setFields({
      title: doc.getTitle() || '',
      author: doc.getAuthor() || '',
      subject: doc.getSubject() || '',
      keywords: doc.getKeywords() || '',
    });
  }

  function reset() {
    docRef.current = null;
    setFile(null);
    setFields(EMPTY);
    if (inputRef.current) inputRef.current.value = '';
  }

  function setField(name) {
    return (e) => setFields((prev) => ({ ...prev, [name]: e.target.value }));
  }

  async function apply() {
    if (!docRef.current || busy) return;
    setBusy(true);

    try {
      const doc = docRef.current;
      doc.setTitle(fields.title.trim());
      doc.setAuthor(fields.author.trim());
      doc.setSubject(fields.subject.trim());
      doc.setKeywords(fields.keywords.split(',').map((s) => s.trim()).filter(Boolean));
      const bytes = await doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(file.name) + '-metadata.pdf');
      toast('PDF metadata updated.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not save the metadata. Try another file.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="metadata"
        accept="application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileArrow}
        title={
          <>
            Drop a PDF here or <u>browse</u>
          </>
        }
        sub="The values already inside the PDF are filled in for you."
      />

      <FileCard idPrefix="metadata" badge="PDF" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="metadataTitle">Title</label>
          <input type="text" id="metadataTitle" autoComplete="off" value={fields.title} onChange={setField('title')} />
        </div>
        <div className="field">
          <label htmlFor="metadataAuthor">Author</label>
          <input type="text" id="metadataAuthor" autoComplete="off" value={fields.author} onChange={setField('author')} />
        </div>
        <div className="field">
          <label htmlFor="metadataSubject">Subject</label>
          <input
            type="text"
            id="metadataSubject"
            autoComplete="off"
            value={fields.subject}
            onChange={setField('subject')}
          />
        </div>
        <div className="field">
          <label htmlFor="metadataKeywords">Keywords</label>
          <input
            type="text"
            id="metadataKeywords"
            placeholder="Comma separated"
            autoComplete="off"
            value={fields.keywords}
            onChange={setField('keywords')}
          />
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" id="metadataBtn" type="button" disabled={busy || !file} onClick={apply}>
          {busy ? 'Saving…' : 'Apply metadata'}
        </button>
      </div>
    </section>
  );
}
