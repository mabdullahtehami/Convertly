/* ==========================================================
   Convertly React - tool card
   The grid card on the home page and the "related tools" cards
   on a tool page are the same link, so they share this piece.
   ========================================================== */
import { Link } from 'react-router-dom';
import { TOOL_ICONS } from '../lib/toolIcons.js';

export default function ToolCard({ tool, hidden }) {
  return (
    <Link
      className="hg-card"
      to={`/tools/${tool.slug}`}
      hidden={hidden}
      style={{ '--c': tool.color, '--s': tool.color + '1f' }}
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
    </Link>
  );
}
