/* ==========================================================
   Convertly React - .mt-progress (media tool progress bar)
   ids: <prefix>Progress / <prefix>Bar / <prefix>ProgressText
   ========================================================== */
export default function MtProgress({ idPrefix = '', show, percent = 0, text = '' }) {
  return (
    <div className="mt-progress" id={idPrefix ? idPrefix + 'Progress' : undefined} hidden={!show}>
      <div className="mt-track">
        <div className="mt-bar" id={idPrefix ? idPrefix + 'Bar' : undefined} style={{ width: percent + '%' }} />
      </div>
      <p id={idPrefix ? idPrefix + 'ProgressText' : undefined}>{text}</p>
    </div>
  );
}
