/* ==========================================================
   Convertly React - static pages
   About / Privacy / Contact / Terms (needed for AdSense
   review and linked from the footer) plus the 404 page.
   Each page sets its own title, description and canonical
   through the Seo component.
   ========================================================== */
import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

export function About() {
  return (
    <main className="shell tp-page">
      <Seo
        title="About Convertly - Free File Tools in Your Browser | Convertly"
        description="Convertly is a free suite of 27 PDF, image, audio and video tools that run entirely in your browser. No uploads, no accounts, no watermarks."
        path="/about"
      />

      <section className="hero">
        <h1>About Convertly</h1>
        <p>Free file tools that run in your browser - no uploads, no accounts, no watermarks.</p>
      </section>

      <section className="panel">
        <p>
          Convertly brings 27 everyday file tools together in one place: convert, merge, split, compress
          and annotate PDFs, convert and resize images, extract and convert audio, compress video, make
          QR codes, read scanned text with OCR and more. If you work with files, there is a good chance
          the tool you need is here.
        </p>
        <h2>Everything runs on your device</h2>
        <p>
          Unlike most online converters, Convertly does not send your files anywhere. The whole
          conversion happens inside your browser using modern web technology, which means your documents
          stay private by design - there is no server for them to be uploaded to, in the first place.
        </p>
        <h2>Free, with no strings attached</h2>
        <p>
          There is no sign-up, no daily limit and no watermark on your results. Open the tool you need,
          drop in a file, and download the result. That is the whole flow.
        </p>
        <h2>How it started</h2>
        <p>
          Convertly began as a small collection of scripts for personal use - a PDF merger here, an image
          resizer there - and grew into the full suite you see today. It is still built with the same
          goal: get the job done quickly, without asking for your email address.
        </p>
      </section>
    </main>
  );
}

export function Privacy() {
  return (
    <main className="shell tp-page">
      <Seo
        title="Privacy Policy - Convertly"
        description="Your files never leave your device. Read how Convertly handles data, cookies and advertising."
        path="/privacy"
      />

      <section className="hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: November 2026</p>
      </section>

      <section className="panel">
        <p>
          Your privacy matters. The short version: the files you process with Convertly stay on your
          device, and we do not sell or share personal information.
        </p>
        <h2>Files you process</h2>
        <p>
          All conversions, edits and recordings happen locally in your browser. Your PDFs, images, audio
          and video are never uploaded to our servers - in fact, there is no server that receives them.
        </p>
        <h2>Information we collect</h2>
        <p>
          We do not require an account and do not collect personal details. Our hosting provider may
          record standard technical information in server logs (such as IP address, browser type and the
          time of a request) purely for security and abuse prevention.
        </p>
        <h2>Cookies and advertising</h2>
        <p>
          Convertly itself does not set cookies. We may display advertising through Google AdSense.
          Google and its partners use cookies to serve ads based on your prior visits to this or other
          websites. Google's use of advertising cookies enables it and its partners to serve ads based
          on your visit to this site.
        </p>
        <p>
          You can opt out of personalised advertising by visiting Google's{' '}
          <a href="https://www.google.com/settings/ads">Ads Settings</a>, or opt out of a third-party
          vendor's use of cookies for personalised advertising at{' '}
          <a href="https://www.aboutads.info/choices/">aboutads.info</a>.
        </p>
        <h2>Third-party services</h2>
        <ul>
          <li>Google Fonts is loaded for the site's typography.</li>
          <li>
            The Prescription Reader sends the image you choose directly to the AI provider whose API key
            you enter - we never see or store it.
          </li>
        </ul>
        <h2>Children's privacy</h2>
        <p>
          Convertly is a general-purpose tool and is not directed at children under 13. We do not
          knowingly collect personal information from anyone.
        </p>
        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, the updated version will appear on this page. Questions? See the{' '}
          <Link to="/contact">contact page</Link>.
        </p>
      </section>
    </main>
  );
}

export function Contact() {
  return (
    <main className="shell tp-page">
      <Seo
        title="Contact Convertly - Get in Touch | Convertly"
        description="Questions, bug reports or feature requests for Convertly? Reach the team by email at contact@YOURDOMAIN.com."
        path="/contact"
      />

      <section className="hero">
        <h1>Contact Us</h1>
        <p>Questions, bug reports or feature requests - we read everything.</p>
      </section>

      <section className="panel">
        <p>
          The fastest way to reach us is email:{' '}
          <a href="mailto:contact@YOURDOMAIN.com">contact@YOURDOMAIN.com</a>
        </p>
        <h2>Reporting a problem</h2>
        <p>
          If a tool did not do what you expected, include the tool name, your browser and what you did
          step by step. That is usually enough to reproduce the issue.
        </p>
        <h2>Suggest a tool</h2>
        <p>
          Missing something? Tell us what you would like to convert, edit or create - feature requests
          shape the roadmap.
        </p>
        <h2>Response time</h2>
        <p>We aim to reply to every message within two business days.</p>
      </section>
    </main>
  );
}

export function Terms() {
  return (
    <main className="shell tp-page">
      <Seo
        title="Terms of Use - Convertly"
        description="The terms for using Convertly's free browser-based file tools, including acceptable use and disclaimers."
        path="/terms"
      />

      <section className="hero">
        <h1>Terms of Use</h1>
        <p>Last updated: November 2026</p>
      </section>

      <section className="panel">
        <p>
          By using Convertly you agree to these terms. If you do not agree, please do not use the site.
        </p>
        <h2>The service</h2>
        <p>
          Convertly provides free, browser-based file tools. The service is offered "as is" without
          warranty of any kind, express or implied.
        </p>
        <h2>Your files</h2>
        <p>
          Processing happens on your device, which means you are responsible for your own files. Keep
          backups of important documents - we cannot recover files we never received.
        </p>
        <h2>Acceptable use</h2>
        <p>
          You may use the tools for personal and commercial projects. You agree not to use Convertly for
          anything unlawful, to infringe the rights of others, or to attempt to disrupt the site.
        </p>
        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Convertly is not liable for any indirect, incidental
          or consequential damages arising from the use of, or inability to use, the service.
        </p>
        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the site after changes means you
          accept the revised terms. Questions? See the <Link to="/contact">contact page</Link>.
        </p>
      </section>
    </main>
  );
}

export default function NotFound() {
  return (
    <main className="shell tp-page">
      <Seo
        title="Page Not Found - Convertly"
        description="This page does not exist. Head back to the Convertly home page to find your tool."
        path="/404"
        noindex
      />

      <section className="hero">
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist - maybe the link is old.</p>
      </section>

      <section className="panel">
        <p>
          <Link to="/">Back to all tools</Link> and pick the converter you need. Every tool also has its
          own address, like <Link to="/tools/merge-pdf">/tools/merge-pdf</Link>.
        </p>
      </section>
    </main>
  );
}
