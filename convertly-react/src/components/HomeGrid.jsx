/* ==========================================================
   Convertly React - home tool grid
   Port of js/home-grid.js (iLovePDF style home screen)
   The tool list itself lives in tools/registry.js; each card
   links to the tool's own page (/tools/<slug>).
   ========================================================== */
import { useState } from 'react';
import ToolCard from './ToolCard.jsx';
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

export default function HomeGrid() {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = TOOLS.map((tool) => (cat === 'all' || tool.cat === cat) && (!q || (tool.title + ' ' + tool.desc).toLowerCase().includes(q)));
  const shown = matches.filter(Boolean).length;

  return (
    <section className="hg" aria-label="All tools">
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
        {TOOLS.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} hidden={!matches[i]} />
        ))}
      </div>

      <p className="hg-empty" hidden={shown !== 0}>
        No tools found. Try another word.
      </p>
    </section>
  );
}
