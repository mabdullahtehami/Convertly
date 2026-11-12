/* ==========================================================
   Convertly React - app shell
   Topbar + routed pages + footer. Every tool lives at its own
   URL (/tools/<slug>) so each one can be indexed separately;
   the tool list still comes from tools/registry.js.
   ========================================================== */
import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { BrandMark, PrivacyShield } from './lib/icons.jsx';
import Home from './pages/Home.jsx';
import ToolPage from './pages/ToolPage.jsx';
import { About, Privacy, Contact, Terms } from './pages/StaticPages.jsx';
import NotFound from './pages/StaticPages.jsx';

export default function App() {
  const { pathname } = useLocation();

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

  /* New page = start at the top (the browser keeps the old scroll
     position otherwise when only the route changes). */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">
          <BrandMark />
          <span>Convertly</span>
        </Link>
        <p className="privacy">
          <PrivacyShield />
          Your files stay on your device
        </p>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/:slug" element={<ToolPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <footer className="foot">
        <p>Convertly runs entirely in your browser. Nothing is uploaded to any server.</p>
        <nav className="foot-links" aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </footer>
    </>
  );
}
