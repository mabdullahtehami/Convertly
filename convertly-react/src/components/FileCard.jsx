/* ==========================================================
   Convertly React - .file-card (PDF / DOCX chosen file row)
   ids: <prefix>FileCard / <prefix>Name / <prefix>Meta / <prefix>Remove
   ========================================================== */
import { formatBytes } from '../lib/helpers.js';

export default function FileCard({ idPrefix = '', badge, file, meta, onRemove }) {
  return (
    <div className="file-card" id={idPrefix ? idPrefix + 'FileCard' : undefined} hidden={!file}>
      <div className="file-badge">{badge}</div>
      <div className="file-info">
        <strong id={idPrefix ? idPrefix + 'Name' : undefined}>{file ? file.name : ''}</strong>
        <span id={idPrefix ? idPrefix + 'Meta' : undefined}>{file ? meta || formatBytes(file.size) : ''}</span>
      </div>
      <button
        className="btn btn-quiet"
        id={idPrefix ? idPrefix + 'Remove' : undefined}
        type="button"
        onClick={onRemove}
      >
        Remove
      </button>
    </div>
  );
}
