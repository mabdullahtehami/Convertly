/* ==========================================================
   Convertly React - home tool grid
   Port of js/home-grid.js (iLovePDF style home screen)
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import { TOOL_ICONS } from '../lib/toolIcons.js';

/* Same order as the tools / panels on the page */
const TOOLS = [
  {
    id: 'pdf2jpg',
    title: 'PDF to JPG',
    desc: 'Turn every page of a PDF into a sharp JPG image.',
    cat: 'convert',
    color: '#d97706',
    icon: 'image',
  },
  {
    id: 'jpg2pdf',
    title: 'JPG to PDF',
    desc: 'Combine your images into one PDF in any order.',
    cat: 'convert',
    color: '#d97706',
    icon: 'toPdf',
  },
  {
    id: 'docx2pdf',
    title: 'Word to PDF',
    desc: 'Convert DOCX documents into easy to share PDFs.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
  },
  {
    id: 'pdf2docx',
    title: 'PDF to Word',
    desc: 'Get the text of your PDF as an editable DOCX file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
  },
  {
    id: 'merge',
    title: 'Merge PDF',
    desc: 'Join several PDFs into one, in the order you want.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'merge',
  },
  {
    id: 'split',
    title: 'Split PDF',
    desc: 'Extract pages or split a PDF into separate files.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'split',
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    desc: 'Reduce the file size while keeping good quality.',
    cat: 'optimize',
    color: '#16a34a',
    icon: 'compress',
  },
  {
    id: 'mp3',
    title: 'Video to MP3',
    desc: 'Pull the sound out of a video and save it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'music',
  },
  {
    id: 'trim',
    title: 'Audio Trimmer',
    desc: 'Cut the part you need from any audio file.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'scissors',
  },
  {
    id: 'vcomp',
    title: 'Video Compressor',
    desc: 'Make big videos smaller and easier to share.',
    cat: 'video',
    color: '#db2777',
    icon: 'video',
  },
  {
    id: 'vframe',
    title: 'Video to Image',
    desc: 'Capture any frame of a video as JPG or PNG.',
    cat: 'video',
    color: '#db2777',
    icon: 'frame',
  },
  {
    id: 'rec',
    title: 'Audio Recorder',
    desc: 'Record your voice and download it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'mic',
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    desc: 'Turn your PDF pages the way you need.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'rotate',
    badge: true,
  },
  {
    id: 'watermark',
    title: 'Watermark PDF',
    desc: 'Stamp a text watermark over every page.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'drop',
    badge: true,
  },
  {
    id: 'pagenums',
    title: 'Page Numbers',
    desc: 'Add page numbers to any PDF in seconds.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'hash',
    badge: true,
  },
  {
    id: 'metadata',
    title: 'PDF Metadata',
    desc: 'Edit the title, author and keywords of a PDF.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'info',
    badge: true,
  },
  {
    id: 'pdftotxt',
    title: 'PDF to Text',
    desc: 'Pull the plain text out of a PDF as a TXT file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'text',
    badge: true,
  },
  {
    id: 'imgcomp',
    title: 'Image Compressor',
    desc: 'Reduce image size while keeping good quality.',
    cat: 'image',
    color: '#0891b2',
    icon: 'imgComp',
    badge: true,
  },
  {
    id: 'imgconv',
    title: 'Image Converter',
    desc: 'Convert images between JPG, PNG and WebP.',
    cat: 'image',
    color: '#0891b2',
    icon: 'swap',
    badge: true,
  },
  {
    id: 'imgsize',
    title: 'Image Resizer',
    desc: 'Change the width and height of any image.',
    cat: 'image',
    color: '#0891b2',
    icon: 'expand',
    badge: true,
  },
  {
    id: 'imgrot',
    title: 'Rotate Image',
    desc: 'Turn an image 90° or 180° in one click.',
    cat: 'image',
    color: '#0891b2',
    icon: 'rotate',
    badge: true,
  },
  {
    id: 'audioconv',
    title: 'Audio Converter',
    desc: 'Convert audio files to MP3 or WAV.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'swap',
    badge: true,
  },
  {
    id: 'screen',
    title: 'Screen Recorder',
    desc: 'Record your screen and save it as a video.',
    cat: 'video',
    color: '#db2777',
    icon: 'screen',
    badge: true,
  },
  {
    id: 'qr',
    title: 'QR Code Generator',
    desc: 'Create a QR code from any text or link.',
    cat: 'tools',
    color: '#64748b',
    icon: 'qr',
    badge: true,
  },
  {
    id: 'ocr',
    title: 'Image & PDF OCR',
    desc: 'Read the text from scans and photos.',
    cat: 'tools',
    color: '#64748b',
    icon: 'scan',
    badge: true,
  },
  {
    id: 'pdfedit',
    title: 'Edit PDF Text',
    desc: 'Change the text written inside any PDF.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'pencil',
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
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {TOOL_ICONS[tool.icon] || TOOL_ICONS.tool}
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
