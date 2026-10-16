/* ==========================================================
   Convertly - home-grid.js
   Turns the tab bar into an iLovePDF-style grid of tool cards.
   Load this file LAST (after every tool file).
   Styles are in css/home-grid.css (link it in index.html).
   ========================================================== */
'use strict';

(function () {
  if (typeof tabs === 'undefined' || !tabs.length) return;

  /* ---------- Icons (24x24 line icons) ---------- */
  const ICONS = {
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 9"/>',
    toPdf: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 15h6M13 12l3 3-3 3"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    merge: '<path d="M5 4v4a4 4 0 0 0 4 4h6M19 4v4a4 4 0 0 1-4 4"/><path d="M12 12v8M9 17l3 3 3-3"/>',
    split: '<path d="M12 3v7M9 6l3-3 3 3"/><path d="M12 10c0 4-6 5-6 10M12 10c0 4 6 5 6 10"/>',
    compress: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    frame: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  };

  /* Same order as the tabs on the page */
  const TOOLS = [
    { title: 'PDF to JPG', desc: 'Turn every page of a PDF into a sharp JPG image.', cat: 'convert', color: '#d97706', icon: 'image' },
    { title: 'JPG to PDF', desc: 'Combine your images into one PDF in any order.', cat: 'convert', color: '#d97706', icon: 'toPdf' },
    { title: 'Word to PDF', desc: 'Convert DOCX documents into easy to share PDFs.', cat: 'convert', color: '#2563eb', icon: 'doc' },
    { title: 'PDF to Word', desc: 'Get the text of your PDF as an editable DOCX file.', cat: 'convert', color: '#2563eb', icon: 'doc' },
    { title: 'Merge PDF', desc: 'Join several PDFs into one, in the order you want.', cat: 'organize', color: '#ef4b2b', icon: 'merge' },
    { title: 'Split PDF', desc: 'Extract pages or split a PDF into separate files.', cat: 'organize', color: '#ef4b2b', icon: 'split' },
    { title: 'Compress PDF', desc: 'Reduce the file size while keeping good quality.', cat: 'optimize', color: '#16a34a', icon: 'compress' },
    { title: 'Video to MP3', desc: 'Pull the sound out of a video and save it as MP3.', cat: 'audio', color: '#7c3aed', icon: 'music', badge: true },
    { title: 'Audio Trimmer', desc: 'Cut the part you need from any audio file.', cat: 'audio', color: '#7c3aed', icon: 'scissors', badge: true },
    { title: 'Video Compressor', desc: 'Make big videos smaller and easier to share.', cat: 'video', color: '#db2777', icon: 'video', badge: true },
    { title: 'Video to Image', desc: 'Capture any frame of a video as JPG or PNG.', cat: 'video', color: '#db2777', icon: 'frame', badge: true },
    { title: 'Audio Recorder', desc: 'Record your voice and download it as MP3.', cat: 'audio', color: '#7c3aed', icon: 'mic', badge: true },
  ];

  const CATS = [
    ['all', 'All'],
    ['convert', 'Convert PDF'],
    ['organize', 'Organize PDF'],
    ['optimize', 'Optimize PDF'],
    ['audio', 'Audio'],
    ['video', 'Video'],
  ];

  const info = tabs.map((t, i) => TOOLS[i] || {
    title: t.textContent.trim() || 'Tool',
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
      '<input type="search" class="hg-search" placeholder="Search tools…" aria-label="Search tools">' +
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

  /* Put the grid where the tab bar was, and hide the old tab bar */
  const tabBar = tabs[0].parentNode;
  const barHoldsPanels = !!tabBar.querySelector('[id^="panel-"]');
  const anchor = barHoldsPanels ? tabs[0] : tabBar;
  anchor.parentNode.insertBefore(root, anchor);
  if (barHoldsPanels) tabs.forEach((t) => (t.style.display = 'none'));
  else tabBar.style.display = 'none';

  /* ---------- Behaviour ---------- */
  function hideAllPanels() {
    tabs.forEach((t) => {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
      const panel = $('#panel-' + t.dataset.target);
      if (panel) panel.hidden = true;
    });
  }

  function showHome() {
    hideAllPanels();
    bar.hidden = true;
    home.hidden = false;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openTool(i) {
    activateTab(tabs[i]);
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

  /* Heading text: only changed when it is plain text */
  const h1 = $('h1');
  if (h1 && !h1.children.length) h1.textContent = 'Every file tool you need, in one place';
  const sub = h1 && h1.nextElementSibling;
  if (sub && sub.tagName === 'P' && !sub.children.length) {
    sub.textContent = 'Convert, merge, split and compress PDFs, and work with audio and video. No upload, no sign-up.';
  }

  /* Start on the home grid */
  hideAllPanels();
})();
