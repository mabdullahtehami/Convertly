/* ==========================================================
   Convertly React - home page (hero + tool grid)
   ========================================================== */
import Seo from '../components/Seo.jsx';
import HomeGrid from '../components/HomeGrid.jsx';

/* Same wording as index.html so the first paint and the
   hydrated page agree on the title / description. */
const HOME_TITLE = 'Convertly | PDF Tools: Convert, Merge, Split and Compress';
const HOME_DESC =
  'Convert PDF to JPG, JPG to PDF, DOCX to PDF, PDF to DOCX. Merge, split and compress PDFs, convert and resize images, record audio and screen, make QR codes and more. Everything runs in your browser.';

export default function Home() {
  return (
    <main className="shell">
      <Seo title={HOME_TITLE} description={HOME_DESC} path="/" />

      <section className="hero">
        <h1>Every file tool you need, in one place</h1>
        <p>Convert, merge, split and compress PDFs, and work with images, audio and video. No upload, no sign-up.</p>
      </section>

      <HomeGrid />
    </main>
  );
}
