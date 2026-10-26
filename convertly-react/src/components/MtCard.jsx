/* ==========================================================
   Convertly React - .mt-card (media tool chosen file row)
   ids: <prefix>Card / <prefix>Name / <prefix>Meta / <prefix>Remove
   ========================================================== */
export default function MtCard({ idPrefix = '', file, meta, onRemove }) {
  return (
    <div className="mt-card" id={idPrefix ? idPrefix + 'Card' : undefined} hidden={!file}>
      <div>
        <strong id={idPrefix ? idPrefix + 'Name' : undefined}>{file ? file.name : ''}</strong>
        <span id={idPrefix ? idPrefix + 'Meta' : undefined}>{meta || ''}</span>
      </div>
      <button
        type="button"
        className="mt-x"
        id={idPrefix ? idPrefix + 'Remove' : undefined}
        aria-label="Remove file"
        onClick={onRemove}
      >
        &times;
      </button>
    </div>
  );
}
