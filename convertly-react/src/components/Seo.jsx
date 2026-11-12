/* ==========================================================
   Convertly React - per-page <head> manager
   Sets the title, meta description, canonical URL, Open Graph
   tags and optional FAQPage JSON-LD for the current route.
   A tiny custom component instead of a helmet library, so we
   keep one less dependency in step with React.
   ========================================================== */
import { useEffect } from 'react';

/* Placeholder domain - swap for the real one once the domain is bought. */
export const SITE_URL = 'https://YOURDOMAIN.com';

/* Create-or-update a <meta> tag in <head>. */
function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/* Create-or-update the canonical <link>. */
function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({ title, description, path = '/', jsonLd, noindex = false }) {
  /* JSON-LD is stringified once so the effect only re-runs when it changes. */
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const url = SITE_URL + (path === '/' ? '/' : path);

    document.title = title;

    /* Marker for scripts/prerender.mjs: "this route's head is done". */
    document.documentElement.setAttribute('data-seo-path', path);

    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(url);

    /* Open Graph / Twitter (used when the link is shared) */
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'Convertly');
    setMeta('name', 'twitter:card', 'summary');

    /* One JSON-LD script per page - removed again when navigating away. */
    const prev = document.getElementById('page-jsonld');
    if (prev) prev.remove();
    if (ld) {
      const script = document.createElement('script');
      script.id = 'page-jsonld';
      script.type = 'application/ld+json';
      script.textContent = ld;
      document.head.appendChild(script);
    }
  }, [title, description, path, ld, noindex]);

  return null;
}
