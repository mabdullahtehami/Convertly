/* ==========================================================
   Convertly React - .progress (PDF tool progress bar)
   ids: <prefix>Progress / <prefix>Bar / <prefix>ProgressText
   ========================================================== */
export default function ProgressBar({ idPrefix = '', show, percent = 0, text = '' }) {
  return (
    <div className="progress" id={idPrefix ? idPrefix + 'Progress' : undefined} hidden={!show}>
      <div className="progress-bar">
        <span id={idPrefix ? idPrefix + 'Bar' : undefined} style={{ width: percent + '%' }} />
      </div>
      <p id={idPrefix ? idPrefix + 'ProgressText' : undefined}>{text}</p>
    </div>
  );
}
