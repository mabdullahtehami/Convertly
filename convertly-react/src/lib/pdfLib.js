/* ==========================================================
   Convertly React - pdf-lib helpers
   Port of the PDFLib bits in js/common.js
   ========================================================== */
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export { PDFDocument, StandardFonts, rgb, degrees };

/* PDFDocument is statically imported, so this can never fail.
   Kept because the tool panels call it before opening a PDF. */
export function libsReady() {
  return true;
}

export async function openPdfLib(buffer) {
  try {
    return await PDFDocument.load(buffer);
  } catch (err) {
    console.error(err);
    return null;
  }
}
