/* ==========================================================
   Convertly React - home tool grid
   Port of js/home-grid.js (iLovePDF style home screen)
   The tool list itself lives in tools/registry.js.
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import { TOOL_ICONS } from '../lib/toolIcons.js';
import { TOOLS } from '../tools/registry.js';

const CATS = [
  ['all', 'All'],
  ['convert', 'Convert PDF'],
  ['organize', 'Organize PDF'],
  ['optimize', 'Optimize PDF'],
  ['image', 'Image'],
  ['audio', 'Audio'],
  ['video', 'Video'],
  ['tools', 'Utilities'],
];

export default function HomeGrid({ activeIndex, onOpen, onBack }) {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const firstRender = useRef(true);

  const toolOpen = activeIndex !== null;
  const current = toolOpen ? TOOLS[activeIndex] : null;

  /* Smooth scroll to the section when a tool opens / closes (like the original) */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (rootRef.current) rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeIndex]);

  const q = query.trim().toLowerCase();
  const matches = TOOLS.map((tool) => (cat === 'all' || tool.cat === cat) && (!q || (tool.title + ' ' + tool.desc).toLowerCase().includes(q)));
  const shown = matches.filter(Boolean).length;

  return (
    <section className="hg" aria-label="All tools" ref={rootRef}>
      <div hidden={toolOpen}>
        <div className="hg-toolbar">
          <div className="hg-chips" role="group" aria-label="Tool categories">
            {CATS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={cat === key ? 'hg-chip is-on' : 'hg-chip'}
                onClick={() => setCat(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="hg-search"
            placeholder="Search tools…"
            aria-label="Search tools"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="hg-grid">
          {TOOLS.map((tool, i) => {
            const ok = matches[i];
            return (
              <button
                key={tool.id}
                type="button"
                className="hg-card"
                hidden={!ok}
                style={{ '--c': tool.color, '--s': tool.color + '1f' }}
                onClick={() => onOpen(i)}
              >
                {tool.badge ? <span className="hg-new">NEW</span> : null}
                <span className="hg-icon">
                  {/* The shared map holds SVG markup strings, so it has to be
                      injected as HTML - as a child React would render it as
                      invisible text (fill: none) instead of paths. */}
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: TOOL_ICONS[tool.icon] || TOOL_ICONS.tool || '' }}
                  />
                </span>
                <h3 className="hg-title">{tool.title}</h3>
                <p className="hg-desc">{tool.desc}</p>
              </button>
            );
          })}
        </div>

        <p className="hg-empty" hidden={shown !== 0}>
          No tools found. Try another word.
        </p>
      </div>

      <div className="hg-bar" hidden={!toolOpen} style={current ? { '--c': current.color } : undefined}>
        <button type="button" className="hg-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          All tools
        </button>
        <div className="hg-current">
          <span className="hg-dot" />
          <span className="hg-name">{current ? current.title : ''}</span>
        </div>
      </div>
    </section>
  );
}
