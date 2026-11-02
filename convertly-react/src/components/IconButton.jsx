/* ==========================================================
   Convertly React - .icon-btn (small square action button)
   ========================================================== */
export default function IconButton({ label, disabled, extraClass = '', onClick, children }) {
  return (
    <button
      type="button"
      className={('icon-btn ' + extraClass).trim()}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
