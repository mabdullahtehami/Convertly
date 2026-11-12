/* ==========================================================
   Convertly React - tool page template
   One URL per tool (/tools/<slug>): back bar, H1 + intro,
   the tool itself, "How to use", FAQ (also emitted as
   FAQPage JSON-LD) and links to related tools.
   The tool's own logic is untouched - it is rendered with
   id + hidden=false exactly like the old show/hide shell did.
   ========================================================== */
import { Link, useParams } from 'react-router-dom';
import { Suspense } from 'react';
import Seo from '../components/Seo.jsx';
import ToolCard from '../components/ToolCard.jsx';
import NotFound from './StaticPages.jsx';
import { TOOLS } from '../tools/registry.js';

/* Same category first, then fill up with the rest of the tools. */
function relatedFor(tool) {
  const same = TOOLS.filter((t) => t.cat === tool.cat && t.id !== tool.id);
  const others = TOOLS.filter((t) => t.cat !== tool.cat);
  return [...same, ...others].slice(0, 5);
}

export default function ToolPage() {
  const { slug } = useParams();
  const tool = TOOLS.find((t) => t.slug === slug);

  if (!tool) return <NotFound />;

  const { Component } = tool;

  /* FAQ structured data so Google can show the Q&As as rich results. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main className="shell">
      <Seo title={tool.seoTitle} description={tool.metaDescription} path={`/tools/${tool.slug}`} jsonLd={jsonLd} />

      {/* Back bar - reuses the home grid's .hg-bar styles */}
      <div className="hg-bar" style={{ '--c': tool.color }}>
        <Link className="hg-back" to="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          All tools
        </Link>
        <div className="hg-current">
          <span className="hg-dot" />
          <span className="hg-name">{tool.title}</span>
        </div>
      </div>

      <section className="hero">
        <h1>{tool.title}</h1>
        <p>{tool.intro}</p>
      </section>

      {/* The tool itself - never modified, only placed on its own page.
          Suspense because the tool is a lazy-loaded chunk. */}
      <Suspense fallback={null}>
        <Component id={tool.id} hidden={false} />
      </Suspense>

      <section className="panel tp-sec">
        <h2>How to use {tool.title}</h2>
        <ol className="tp-steps">
          {tool.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="panel tp-sec">
        <h2>Frequently asked questions</h2>
        {tool.faqs.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <section className="tp-sec">
        <h2>Related tools</h2>
        <div className="hg-grid">
          {relatedFor(tool).map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      </section>
    </main>
  );
}
