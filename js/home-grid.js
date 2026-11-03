/* ==========================================================
   Convertly - home-grid.js
   Builds the iLovePDF-style grid of tool cards from the page's panels.
   Load this file LAST (after every tool file).
   Styles are in shared/css/home-grid.css (link it in index.html).
   ========================================================== */
'use strict';

(function () {
  const panels = $$('[id^="panel-"]');
  if (!panels.length) return;

  /* ---------- Icons: one map shared with the React version ---------- */
  const ICONS = window.TOOL_ICONS;

  /* Same order as the panels on the page */
  const TOOLS = [
    { title: 'PDF to JPG', desc: 'Turn every page of a PDF into a sharp JPG image.', cat: 'convert', color: '#d97706', icon: 'image' },
    { title: 'JPG to PDF', desc: 'Combine your images into one PDF in any order.', cat: 'convert', color: '#d97706', icon: 'toPdf' },
    { title: 'Word to PDF', desc: 'Convert DOCX documents into easy to share PDFs.', cat: 'convert', color: '#2563eb', icon: 'doc' },
    { title: 'PDF to Word', desc: 'Get the text of your PDF as an editable DOCX file.', cat: 'convert', color: '#2563eb', icon: 'doc' },
    { title: 'Merge PDF', desc: 'Join several PDFs into one, in the order you want.', cat: 'organize', color: '#ef4b2b', icon: 'merge' },
    { title: 'Split PDF', desc: 'Extract pages or split a PDF into separate files.', cat: 'organize', color: '#ef4b2b', icon: 'split' },
    { title: 'Compress PDF', desc: 'Reduce the file size while keeping good quality.', cat: 'optimize', color: '#16a34a', icon: 'compress' },
    { title: 'Video to MP3', desc: 'Pull the sound out of a video and save it as MP3.', cat: 'audio', color: '#7c3aed', icon: 'music' },
    { title: 'Audio Trimmer', desc: 'Cut the part you need from any audio file.', cat: 'audio', color: '#7c3aed', icon: 'scissors' },
    { title: 'Video Compressor', desc: 'Make big videos smaller and easier to share.', cat: 'video', color: '#db2777', icon: 'video' },
    { title: 'Video to Image', desc: 'Capture any frame of a video as JPG or PNG.', cat: 'video', color: '#db2777', icon: 'frame' },
    { title: 'Audio Recorder', desc: 'Record your voice and download it as MP3.', cat: 'audio', color: '#7c3aed', icon: 'mic' },
    { title: 'Rotate PDF', desc: 'Turn your PDF pages the way you need.', cat: 'organize', color: '#ef4b2b', icon: 'rotate', badge: true },
    { title: 'Watermark PDF', desc: 'Stamp a text watermark over every page.', cat: 'organize', color: '#ef4b2b', icon: 'drop', badge: true },
    { title: 'Page Numbers', desc: 'Add page numbers to any PDF in seconds.', cat: 'organize', color: '#ef4b2b', icon: 'hash', badge: true },
    { title: 'PDF Metadata', desc: 'Edit the title, author and keywords of a PDF.', cat: 'organize', color: '#ef4b2b', icon: 'info', badge: true },
    { title: 'PDF to Text', desc: 'Pull the plain text out of a PDF as a TXT file.', cat: 'convert', color: '#2563eb', icon: 'text', badge: true },
    { title: 'Image Compressor', desc: 'Reduce image size while keeping good quality.', cat: 'image', color: '#0891b2', icon: 'imgComp', badge: true },
    { title: 'Image Converter', desc: 'Convert images between JPG, PNG and WebP.', cat: 'image', color: '#0891b2', icon: 'swap', badge: true },
    { title: 'Image Resizer', desc: 'Change the width and height of any image.', cat: 'image', color: '#0891b2', icon: 'expand', badge: true },
    { title: 'Rotate Image', desc: 'Turn an image 90Â° or 180Â° in one click.', cat: 'image', color: '#0891b2', icon: 'rotate', badge: true },
    { title: 'Audio Converter', desc: 'Convert audio files to MP3 or WAV.', cat: 'audio', color: '#7c3aed', icon: 'swap', badge: true },
    { title: 'Screen Recorder', desc: 'Record your screen and save it as a video.', cat: 'video', color: '#db2777', icon: 'screen', badge: true },
    { title: 'QR Code Generator', desc: 'Create a QR code from any text or link.', cat: 'tools', color: '#64748b', icon: 'qr', badge: true },
    { title: 'Image & PDF OCR', desc: 'Read the text from scans and photos.', cat: 'tools', color: '#64748b', icon: 'scan', badge: true },
    { title: 'Edit PDF Text', desc: 'Change the text written inside any PDF.', cat: 'organize', color: '#ef4b2b', icon: 'pencil', badge: true },
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

  const info = panels.map((p, i) => TOOLS[i] || {
    title: 'Tool',
    desc: 'Open this tool.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'tool',
  });

  /* ---------- Build the page ---------- */
  const root = document.createElement('section');
  root.className = 'hg';
  root.setAttribute('aria-label', 'All tools');

  const home = document.createElement('div');
  home.innerHTML =
    '<div class="hg-toolbar">' +
      '<div class="hg-chips" role="group" aria-label="Tool categories">' +
        CATS.map((c, i) => '<button type="button" class="hg-chip' + (i === 0 ? ' is-on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>').join('') +
      '</div>' +
      '<input type="search" class="hg-search" placeholder="Search toolsâ€¦" aria-label="Search tools">' +
    '</div>' +
    '<div class="hg-grid"></div>' +
    '<p class="hg-empty" hidden>No tools found. Try another word.</p>';

  const grid = home.querySelector('.hg-grid');
  const empty = home.querySelector('.hg-empty');
  const search = home.querySelector('.hg-search');
  const chips = [...home.querySelectorAll('.hg-chip')];

  info.forEach((t, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'hg-card';
    card.dataset.index = i;
    card.dataset.cat = t.cat;
    card.dataset.text = (t.title + ' ' + t.desc).toLowerCase();
    card.style.setProperty('--c', t.color);
    card.style.setProperty('--s', t.color + '1f');
    card.innerHTML =
      (t.badge ? '<span class="hg-new">NEW</span>' : '') +
      '<span class="hg-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[t.icon] || ICONS.tool) + '</svg></span>' +
      '<h3 class="hg-title"></h3><p class="hg-desc"></p>';
    card.querySelector('.hg-title').textContent = t.title;
    card.querySelector('.hg-desc').textContent = t.desc;
    grid.appendChild(card);
  });

  const bar = document.createElement('div');
  bar.className = 'hg-bar';
  bar.hidden = true;
  bar.innerHTML =
    '<button type="button" class="hg-back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>All tools</button>' +
    '<div class="hg-current"><span class="hg-dot"></span><span class="hg-name"></span></div>';
  const backBtn = bar.querySelector('.hg-back');
  const curName = bar.querySelector('.hg-name');

  root.append(home, bar);

  /* Put the grid ahead of the first panel */
  panels[0].parentNode.insertBefore(root, panels[0]);

  /* ---------- Behaviour ---------- */
  function showHome() {
    hideAllPanels();
    bar.hidden = true;
    home.hidden = false;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openTool(i) {
    openPanel(panels[i]);
    home.hidden = true;
    bar.hidden = false;
    bar.style.setProperty('--c', info[i].color);
    curName.textContent = info[i].title;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function applyFilter() {
    const cat = (chips.find((c) => c.classList.contains('is-on')) || chips[0]).dataset.cat;
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    $$('.hg-card', grid).forEach((card) => {
      const ok = (cat === 'all' || card.dataset.cat === cat) && (!q || card.dataset.text.includes(q));
      card.hidden = !ok;
      if (ok) shown++;
    });
    empty.hidden = shown !== 0;
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.hg-card');
    if (card) openTool(Number(card.dataset.index));
  });

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.toggle('is-on', c === chip));
      applyFilter();
    })
  );
  search.addEventListener('input', applyFilter);
  backBtn.addEventListener('click', showHome);

  /* Start on the home grid */
  hideAllPanels();
})();
