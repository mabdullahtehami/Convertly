/* ==========================================================
   Convertly React - pdf.js setup (worker)
   Port of the GlobalWorkerOptions line in js/common.js
   ========================================================== */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export { pdfjsLib };
