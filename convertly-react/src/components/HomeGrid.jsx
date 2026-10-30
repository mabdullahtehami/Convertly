/* ==========================================================
   Convertly React - home tool grid
   Port of js/home-grid.js (iLovePDF style home screen)
   ========================================================== */
import { useEffect, useRef, useState } from 'react';

/* ---------- Icons (24x24 line icons, filled by home-grid.css) ---------- */
const ICONS = {
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-8 9" />
    </>
  ),
  toPdf: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 15h6M13 12l3 3-3 3" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  merge: (
    <>
      <path d="M5 4v4a4 4 0 0 0 4 4h6M19 4v4a4 4 0 0 1-4 4" />
      <path d="M12 12v8M9 17l3 3 3-3" />
    </>
  ),
  split: (
    <>
      <path d="M12 3v7M9 6l3-3 3 3" />
      <path d="M12 10c0 4-6 5-6 10M12 10c0 4 6 5 6 10" />
    </>
  ),
  compress: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </>
  ),
  frame: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  rotate: (
    <>
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </>
  ),
  drop: <path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" />,
  hash: <path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  text: <path d="M4 7h16M4 12h16M4 17h10" />,
  imgComp: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.4" />
      <path d="M15 8v6m-2-2l2 2 2-2" />
    </>
  ),
  swap: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  screen: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <circle cx="12" cy="10.5" r="2.5" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="19" y="14" width="2" height="2" />
      <rect x="14" y="19" width="2" height="2" />
      <rect x="18" y="18" width="3" height="3" />
    </>
  ),
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />,
};

/* Same order as the tools / panels on the page */
export const TOOLS = [
  {
    title: 'PDF to JPG',
    desc: 'Turn every page of a PDF into a sharp JPG image.',
    cat: 'convert',
    color: '#d97706',
    icon: 'image',
  },
  {
    title: 'JPG to PDF',
    desc: 'Combine your images into one PDF in any order.',
    cat: 'convert',
    color: '#d97706',
    icon: 'toPdf',
  },
  {
    title: 'Word to PDF',
    desc: 'Convert DOCX documents into easy to share PDFs.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
  },
  {
    title: 'PDF to Word',
    desc: 'Get the text of your PDF as an editable DOCX file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
  },
  {
    title: 'Merge PDF',
    desc: 'Join several PDFs into one, in the order you want.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'merge',
  },
  {
    title: 'Split PDF',
    desc: 'Extract pages or split a PDF into separate files.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'split',
  },
  {
    title: 'Compress PDF',
    desc: 'Reduce the file size while keeping good quality.',
    cat: 'optimize',
    color: '#16a34a',
    icon: 'compress',
  },
  {
    title: 'Video to MP3',
    desc: 'Pull the sound out of a video and save it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'music',
  },
  {
    title: 'Audio Trimmer',
    desc: 'Cut the part you need from any audio file.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'scissors',
  },
  {
    title: 'Video Compressor',
    desc: 'Make big videos smaller and easier to share.',
    cat: 'video',
    color: '#db2777',
    icon: 'video',
  },
  {
    title: 'Video to Image',
    desc: 'Capture any frame of a video as JPG or PNG.',
    cat: 'video',
    color: '#db2777',
    icon: 'frame',
  },
  {
    title: 'Audio Recorder',
    desc: 'Record your voice and download it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'mic',
  },
  {
    title: 'Rotate PDF',
    desc: 'Turn your PDF pages the way you need.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'rotate',
    badge: true,
  },
  {
    title: 'Watermark PDF',
    desc: 'Stamp a text watermark over every page.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'drop',
    badge: true,
  },
  {
    title: 'Page Numbers',
    desc: 'Add page numbers to any PDF in seconds.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'hash',
    badge: true,
  },
  {
    title: 'PDF Metadata',
    desc: 'Edit the title, author and keywords of a PDF.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'info',
    badge: true,
  },
  {
    title: 'PDF to Text',
    desc: 'Pull the plain text out of a PDF as a TXT file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'text',
    badge: true,
  },
  {
    title: 'Image Compressor',
    desc: 'Reduce image size while keeping good quality.',
    cat: 'image',
    color: '#0891b2',
    icon: 'imgComp',
    badge: true,
  },
  {
    title: 'Image Converter',
    desc: 'Convert images between JPG, PNG and WebP.',
    cat: 'image',
    color: '#0891b2',
    icon: 'swap',
    badge: true,
  },
  {
    title: 'Image Resizer',
    desc: 'Change the width and height of any image.',
    cat: 'image',
    color: '#0891b2',
    icon: 'expand',
    badge: true,
  },
  {
    title: 'Rotate Image',
    desc: 'Turn an image 90° or 180° in one click.',
    cat: 'image',
    color: '#0891b2',
    icon: 'rotate',
    badge: true,
  },
  {
    title: 'Audio Converter',
    desc: 'Convert audio files to MP3 or WAV.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'swap',
    badge: true,
  },
  {
    title: 'Screen Recorder',
    desc: 'Record your screen and save it as a video.',
    cat: 'video',
    color: '#db2777',
    icon: 'screen',
    badge: true,
  },
  {
    title: 'QR Code Generator',
    desc: 'Create a QR code from any text or link.',
    cat: 'tools',
    color: '#64748b',
    icon: 'qr',
    badge: true,
  },
];

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
                data-cat={key}
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
            const text = (tool.title + ' ' + tool.desc).toLowerCase();
            const ok = matches[i];
            return (
              <button
                key={tool.title}
                type="button"
                className="hg-card"
                data-index={i}
                data-cat={tool.cat}
                data-text={text}
                hidden={!ok}
                style={{ '--c': tool.color, '--s': tool.color + '1f' }}
                onClick={() => onOpen(i)}
              >
                {tool.badge ? <span className="hg-new">NEW</span> : null}
                <span className="hg-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {ICONS[tool.icon] || ICONS.tool}
                  </svg>
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
