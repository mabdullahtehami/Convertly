/* ==========================================================
   Convertly React - SVG icons (JSX, camelCased attributes)
   Same paths / attributes as the original markup.
   ========================================================== */

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M9 12h11l-3-3M23 20H12l3 3"
        stroke="#fff"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PrivacyShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Small arrow used inside the tab buttons */
export const TabArrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 12h14m-5-5l5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------- 48x48 dropzone icons ---------- */

export const DzFileArrow = () => (
  <svg viewBox="0 0 48 48" className="dz-icon" aria-hidden="true">
    <path d="M12 6h17l9 9v27H12z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M29 6v9h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <path
      d="M24 35V22m-5 5l5-5 5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DzImage = () => (
  <svg viewBox="0 0 48 48" className="dz-icon" aria-hidden="true">
    <rect x="6" y="9" width="36" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <circle cx="16.5" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path
      d="M8 35l10-9 7 6 6-5 11 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const DzFileLines = () => (
  <svg viewBox="0 0 48 48" className="dz-icon" aria-hidden="true">
    <path d="M12 6h17l9 9v27H12z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M29 6v9h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <path
      d="M18 23h14M18 29h14M18 35h9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

/* ---------- 24x24 icon buttons ---------- */

export const ICON_DOWNLOAD = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 4v11m-5-5l5 5 5-5M5 20h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ICON_UP = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M6 14l6-6 6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ICON_DOWN = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M6 10l6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ICON_TRASH = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 7h14M10 7V5h4v2m-7 0l1 12h8l1-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
