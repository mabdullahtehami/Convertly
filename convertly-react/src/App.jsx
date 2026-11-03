/* ==========================================================
   Convertly React - app shell
   (topbar, hero, tool grid + panels, footer)
   The 26 tools come from tools/registry.js - one list, so the
   grid card and the panel it opens can never drift apart.
   ========================================================== */
import { useEffect, useState } from 'react';
import HomeGrid from './components/HomeGrid.jsx';
import { BrandMark, PrivacyShield } from './lib/icons.jsx';
import { TOOLS } from './tools/registry.js';

export default function App() {
  const [activeIndex, setActiveIndex] = useState(null);

  /* Stop the browser from opening files dropped outside a dropzone
     (ported from js/jpg-to-pdf.js) */
  useEffect(() => {
    const guard = (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target || !target.closest('.dropzone, .mt-drop, .img-list')) e.preventDefault();
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
          <p>Convert, merge, split and compress PDFs, and work with images, audio and video. No upload, no sign-up.</p>
        </section>

        <HomeGrid activeIndex={activeIndex} onOpen={setActiveIndex} onBack={() => setActiveIndex(null)} />

        {TOOLS.map(({ id, Component }, i) => (
          <Component key={id} id={id} hidden={activeIndex !== i} />
        ))}
      </main>

      <footer className="foot">
        <p>Convertly runs entirely in your browser. Nothing is uploaded to any server.</p>
      </footer>
    </>
  );
}
