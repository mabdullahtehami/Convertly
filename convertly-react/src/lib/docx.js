/* ==========================================================
   Convertly React - docx (PDF -> DOCX) interop
   ========================================================== */
import * as ns from 'docx';

const docx = ns && ns.Document ? ns : (ns && ns.default && ns.default.Document ? ns.default : {});

export default docx;
