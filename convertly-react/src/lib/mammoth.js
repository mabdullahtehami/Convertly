/* ==========================================================
   Convertly React - mammoth (DOCX -> HTML) interop
   The npm package ships the browser bundle used by the CDN:
   node_modules/mammoth/mammoth.browser.min.js
   ========================================================== */
import mod from 'mammoth/mammoth.browser.min.js';

const mammoth =
  mod && typeof mod.convertToHtml === 'function'
    ? mod
    : mod && mod.default && typeof mod.default.convertToHtml === 'function'
      ? mod.default
      : typeof window !== 'undefined' ? window.mammoth : null;

export default mammoth;
