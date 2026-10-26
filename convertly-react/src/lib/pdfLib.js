/* ==========================================================
   Convertly React - pdf-lib helpers
   Port of the PDFLib bits in js/common.js
   ========================================================== */
import { PDFDocument } from 'pdf-lib';

export { PDFDocument };

export function libsReady(toast) {
  if (!PDFDocument) {
    toast('PDF library failed to load. Check your internet and refresh.', 'error');
    return false;
  }
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
