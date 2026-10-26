/* ==========================================================
   Convertly React - app shell
   (topbar, hero, tool grid + panels, footer)
   ========================================================== */
import { useEffect, useState } from 'react';
import HomeGrid from './components/HomeGrid.jsx';
import { BrandMark, PrivacyShield, TabArrow } from './lib/icons.jsx';

import PdfToJpg from './tools/PdfToJpg.jsx';
import JpgToPdf from './tools/JpgToPdf.jsx';
import DocxToPdf from './tools/DocxToPdf.jsx';
import PdfToDocx from './tools/PdfToDocx.jsx';
import MergePdf from './tools/MergePdf.jsx';
import SplitPdf from './tools/SplitPdf.jsx';
import CompressPdf from './tools/CompressPdf.jsx';
import VideoToMp3 from './tools/VideoToMp3.jsx';
import AudioTrimmer from './tools/AudioTrimmer.jsx';
import VideoCompressor from './tools/VideoCompressor.jsx';
import VideoFrame from './tools/VideoFrame.jsx';
import AudioRecorder from './tools/AudioRecorder.jsx';

/* Same order as the panels in index.html */
const PANELS = [
  { id: 'pdf2jpg', label: null, Component: PdfToJpg },
  { id: 'jpg2pdf', label: null, Component: JpgToPdf },
  { id: 'docx2pdf', label: null, Component: DocxToPdf },
  { id: 'pdf2docx', label: null, Component: PdfToDocx },
  { id: 'merge', label: null, Component: MergePdf },
  { id: 'split', label: null, Component: SplitPdf },
  { id: 'compress', label: null, Component: CompressPdf },
  { id: 'mp3', label: 'Video to MP3', Component: VideoToMp3 },
  { id: 'trim', label: 'Audio Trimmer', Component: AudioTrimmer },
  { id: 'vcomp', label: 'Video Compressor', Component: VideoCompressor },
  { id: 'vframe', label: 'Video to Image', Component: VideoFrame },
  { id: 'rec', label: 'Audio Recorder', Component: AudioRecorder },
];

/* The original tab bar: hidden by css/home-grid.css (.switch{display:none!important}),
   kept in the DOM so the tab/panel aria references stay valid. */
const TABS = [
  { id: 'pdf2jpg', chips: [{ cls: 'chip chip-pdf', text: 'PDF' }, { cls: 'chip chip-jpg', text: 'JPG' }] },
  { id: 'jpg2pdf', chips: [{ cls: 'chip chip-jpg', text: 'JPG' }, { cls: 'chip chip-pdf', text: 'PDF' }] },
  { id: 'docx2pdf', chips: [{ cls: 'chip', text: 'DOCX' }, { cls: 'chip chip-pdf', text: 'PDF' }] },
  { id: 'pdf2docx', chips: [{ cls: 'chip chip-pdf', text: 'PDF' }, { cls: 'chip', text: 'DOCX' }] },
  { id: 'merge', chips: [{ cls: 'chip chip-pdf', text: 'Merge PDF' }] },
  { id: 'split', chips: [{ cls: 'chip chip-pdf', text: 'Split PDF' }] },
  { id: 'compress', chips: [{ cls: 'chip chip-pdf', text: 'Compress PDF' }] },
];

export default function App() {
  const [activeIndex, setActiveIndex] = useState(null);

  /* Stop the browser from opening files dropped outside a dropzone
     (ported from js/jpg-to-pdf.js) */
  useEffect(() => {
    const guard = (e) => {
      if (!e.target.closest('.dropzone') && !e.target.closest('.img-list')) e.preventDefault();
    };
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', guard);
    return () => {
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', guard);
    };
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>Convertly</span>
        </div>
        <p className="privacy">
          <PrivacyShield />
          Your files stay on your device
        </p>
      </header>

      <main className="shell">
        <section className="hero">
          <h1>Every file tool you need, in one place</h1>
          <p>Convert, merge, split and compress PDFs, and work with audio and video. No upload, no sign-up.</p>
        </section>

        <div className="switch" role="tablist" aria-label="Choose a tool" hidden>
          {TABS.map((tab, tabIndex) => (
            <button
              key={tab.id}
              className="switch-btn"
              role="tab"
              id={'tab-' + tab.id}
              aria-selected="false"
              aria-controls={'panel-' + tab.id}
              data-target={tab.id}
              type="button"
              tabIndex={tabIndex === 0 ? 0 : -1}
            >
              <span className={tab.chips[0].cls}>{tab.chips[0].text}</span>
              <TabArrow />
              {tab.chips[1] ? <span className={tab.chips[1].cls}>{tab.chips[1].text}</span> : null}
            </button>
          ))}
        </div>

        <HomeGrid activeIndex={activeIndex} onOpen={setActiveIndex} onBack={() => setActiveIndex(null)} />

        {PANELS.map(({ id, Component }, i) => (
          <Component key={id} id={id} hidden={activeIndex !== i} />
        ))}
      </main>

      <footer className="foot">
        <p>Convertly runs entirely in your browser. Nothing is uploaded to any server.</p>
      </footer>
    </>
  );
}
