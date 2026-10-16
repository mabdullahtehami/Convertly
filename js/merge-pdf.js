/* ==========================================================
   Convertly - merge-pdf.js
   5) MERGE PDF
   ========================================================== */
'use strict';

(function () {
  const mg = {
    items: [],
    uid: 0,
    busy: false,
    input: $('#mergeInput'),
    drop: $('#mergeDrop'),
    wrap: $('#mergeListWrap'),
    list: $('#mergeList'),
    count: $('#mergeCount'),
    clear: $('#mergeClear'),
    btn: $('#mergeBtn'),
    progress: $('#mergeProgress'),
  };

  async function addFiles(fileList) {
    if (!libsReady()) return;
    const files = [...fileList].filter(isPdfFile);
    if (!files.length) {
      toast('Please choose PDF files.', 'error');
      return;
    }
    const failed = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const doc = await openPdfLib(buffer);
      if (!doc) {
        failed.push(file.name);
        continue;
      }
      mg.items.push({ id: ++mg.uid, name: file.name, size: file.size, pages: doc.getPageCount(), buffer });
    }
    if (failed.length) {
      toast('Could not open (damaged or protected): ' + failed.slice(0, 2).join(', '), 'error');
    }
    render();
  }

  function render() {
    const n = mg.items.length;
    mg.wrap.hidden = n === 0;
    mg.btn.disabled = n < 2 || mg.busy;
    mg.count.textContent = n + (n === 1 ? ' file' : ' files');
    mg.list.innerHTML = '';

    mg.items.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'img-item no-drag';
      li.dataset.id = item.id;

      const order = document.createElement('span');
      order.className = 'img-order';
      order.textContent = i + 1;

      const badge = document.createElement('div');
      badge.className = 'file-badge';
      badge.textContent = 'PDF';

      const meta = document.createElement('div');
      meta.className = 'img-meta';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const info = document.createElement('span');
      info.textContent = item.pages + (item.pages === 1 ? ' page, ' : ' pages, ') + formatBytes(item.size);
      meta.append(name, info);

      const tools = document.createElement('div');
      tools.className = 'img-tools';
      tools.append(
        makeIconButton(ICON_UP, 'Move up', 'up', i === 0),
        makeIconButton(ICON_DOWN, 'Move down', 'down', i === n - 1),
        makeIconButton(ICON_TRASH, 'Remove file', 'remove', false, 'danger')
      );

      li.append(order, badge, meta, tools);
      mg.list.appendChild(li);
    });
  }

  mg.list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const i = mg.items.findIndex((it) => it.id === Number(btn.closest('li').dataset.id));
    if (i < 0) return;
    const a = btn.dataset.action;
    if (a === 'remove') mg.items.splice(i, 1);
    if (a === 'up' && i > 0) [mg.items[i - 1], mg.items[i]] = [mg.items[i], mg.items[i - 1]];
    if (a === 'down' && i < mg.items.length - 1) [mg.items[i + 1], mg.items[i]] = [mg.items[i], mg.items[i + 1]];
    render();
  });

  async function merge() {
    if (mg.items.length < 2 || mg.busy || !libsReady()) return;
    mg.busy = true;
    mg.btn.disabled = true;
    mg.btn.textContent = 'Merging…';
    mg.progress.hidden = false;
    setProgress('merge', 0, 'Starting…');

    try {
      const out = await PDFLib.PDFDocument.create();
      for (let i = 0; i < mg.items.length; i++) {
        setProgress('merge', (i / mg.items.length) * 100, 'Adding ' + mg.items[i].name + '…');
        await nextFrame();
        const src = await PDFLib.PDFDocument.load(mg.items[i].buffer);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      setProgress('merge', 100, 'Saving…');
      const bytes = await out.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
      toast('PDFs merged successfully.', 'success');
    } catch (err) {
      console.error(err);
      mg.progress.hidden = true;
      toast('Could not merge these files. Try again.', 'error');
    } finally {
      mg.busy = false;
      mg.btn.textContent = 'Merge PDFs';
      mg.btn.disabled = mg.items.length < 2;
    }
  }

  mg.input.addEventListener('change', (e) => addFiles(e.target.files).then(() => (mg.input.value = '')));
  mg.clear.addEventListener('click', () => {
    mg.items = [];
    mg.progress.hidden = true;
    render();
  });
  mg.btn.addEventListener('click', merge);
  setupDropzone(mg.drop, addFiles);
})();
