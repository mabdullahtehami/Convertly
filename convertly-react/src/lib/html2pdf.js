/* ==========================================================
   Convertly React - html2pdf.js interop (DOCX -> PDF)
   ========================================================== */
import mod from 'html2pdf.js';

const html2pdf =
  typeof mod === 'function'
    ? mod
    : mod && typeof mod.default === 'function'
      ? mod.default
      : typeof window !== 'undefined' ? window.html2pdf : null;

export default html2pdf;
