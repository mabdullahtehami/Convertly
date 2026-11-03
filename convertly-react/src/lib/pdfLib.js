/* ==========================================================
   Convertly React - pdf-lib helpers
   Port of the PDFLib bits in js/common.js
   ========================================================== */
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export { PDFDocument, StandardFonts, rgb, degrees };

/* Load a PDF, or return null when it is damaged / password protected. */
export async function openPdfLib(buffer) {
  try {
    return await PDFDocument.load(buffer);
  } catch (err) {
    console.error(err);
    return null;
  }
}
