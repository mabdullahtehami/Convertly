/* ==========================================================
   Convertly - jpg-to-pdf.js
   2) JPG -> PDF
   ========================================================== */
'use strict';

const imgState = { items: [], uid: 0, dragId: null, busy: false };

const imgEls = {
  input: $('#imgInput'),
  drop: $('#imgDrop'),
  wrap: $('#imgListWrap'),
  list: $('#imgList'),
  count: $('#imgCount'),
  clear: $('#imgClear'),
  size: $('#pageSize'),
  margin: $('#pageMargin'),
  create: $('#pdfCreate'),
  progress: $('#imgProgress'),
};

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const thumbUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve({
        id: ++imgState.uid,
        name: file.name,
        size: file.size,
        width: canvas.width,
        height: canvas.height,
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        thumbUrl,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(thumbUrl);
      reject(new Error('Cannot read ' + file.name));
    };
    img.src = thumbUrl;
  });
}

async function addImages(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (!files.length) {
    toast('Please choose image files (JPG, PNG or WebP).', 'error');
    return;
  }
  const failed = [];
  for (const file of files) {
    try {
      imgState.items.push(await loadImageFile(file));
    } catch {
      failed.push(file.name);
    }
  }
  if (failed.length) {
    toast('Could not read: ' + failed.slice(0, 2).join(', ') + (failed.length > 2 ? '…' : ''), 'error');
  }
  renderImageList();
}

function renderImageList() {
  const items = imgState.items;
  imgEls.wrap.hidden = items.length === 0;
  imgEls.create.disabled = items.length === 0;
  imgEls.count.textContent = items.length + (items.length === 1 ? ' image' : ' images');
  imgEls.list.innerHTML = '';

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'img-item';
    li.draggable = true;
    li.dataset.id = item.id;

    const order = document.createElement('span');
    order.className = 'img-order';
    order.textContent = i + 1;

    const thumb = document.createElement('img');
    thumb.src = item.thumbUrl;
    thumb.alt = '';

    const meta = document.createElement('div');
    meta.className = 'img-meta';
    const name = document.createElement('strong');
    name.textContent = item.name;
    const info = document.createElement('span');
    info.textContent = item.width + ' x ' + item.height + ' px, ' + formatBytes(item.size);
    meta.append(name, info);

    const tools = document.createElement('div');
    tools.className = 'img-tools';
    tools.append(
      makeIconButton(ICON_UP, 'Move up', 'up', i === 0),
      makeIconButton(ICON_DOWN, 'Move down', 'down', i === items.length - 1),
      makeIconButton(ICON_TRASH, 'Remove image', 'remove', false, 'danger')
    );

    li.append(order, thumb, meta, tools);
    imgEls.list.appendChild(li);
  });
}

function moveItem(from, to) {
  if (to < 0 || to >= imgState.items.length || from === to) return;
  const [moved] = imgState.items.splice(from, 1);
  imgState.items.splice(to, 0, moved);
  renderImageList();
}

imgEls.list.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const li = btn.closest('li');
  const index = imgState.items.findIndex((it) => it.id === Number(li.dataset.id));
  if (index < 0) return;

  const action = btn.dataset.action;
  if (action === 'up') moveItem(index, index - 1);
  if (action === 'down') moveItem(index, index + 1);
  if (action === 'remove') {
    URL.revokeObjectURL(imgState.items[index].thumbUrl);
    imgState.items.splice(index, 1);
    renderImageList();
  }
});

imgEls.list.addEventListener('dragstart', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  imgState.dragId = Number(li.dataset.id);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(imgState.dragId));
});

imgEls.list.addEventListener('dragover', (e) => {
  if (imgState.dragId === null) return;
  e.preventDefault();
  $$('.drop-target', imgEls.list).forEach((el) => el.classList.remove('drop-target'));
  const li = e.target.closest('li');
  if (li && Number(li.dataset.id) !== imgState.dragId) li.classList.add('drop-target');
});

imgEls.list.addEventListener('drop', (e) => {
  if (imgState.dragId === null) return;
  e.preventDefault();
  const li = e.target.closest('li');
  if (li) {
    const from = imgState.items.findIndex((it) => it.id === imgState.dragId);
    const to = imgState.items.findIndex((it) => it.id === Number(li.dataset.id));
    moveItem(from, to);
  }
});

imgEls.list.addEventListener('dragend', () => {
  imgState.dragId = null;
  $$('.dragging, .drop-target', imgEls.list).forEach((el) => el.classList.remove('dragging', 'drop-target'));
});

function clearImages() {
  imgState.items.forEach((it) => URL.revokeObjectURL(it.thumbUrl));
  imgState.items = [];
  imgEls.input.value = '';
  imgEls.progress.hidden = true;
  renderImageList();
}

const PAGE_SIZES_MM = { a4: [210, 297], letter: [215.9, 279.4] };
const PX_TO_MM_150DPI = 25.4 / 150;

async function createPdf() {
  if (!imgState.items.length || imgState.busy) return;
  if (!window.jspdf) {
    toast('PDF library failed to load. Check your internet connection and refresh.', 'error');
    return;
  }

  imgState.busy = true;
  imgEls.create.disabled = true;
  imgEls.create.textContent = 'Creating…';
  imgEls.progress.hidden = false;
  setProgress('img', 0, 'Building PDF…');

  try {
    const { jsPDF } = window.jspdf;
    const sizeMode = imgEls.size.value;
    const margin = Number(imgEls.margin.value);
    const items = imgState.items;
    let doc = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProgress('img', (i / items.length) * 100, 'Adding image ' + (i + 1) + ' of ' + items.length + '…');
      await nextFrame();

      let pageW, pageH, drawW, drawH;

      if (sizeMode === 'fit') {
        drawW = item.width * PX_TO_MM_150DPI;
        drawH = item.height * PX_TO_MM_150DPI;
        pageW = drawW + margin * 2;
        pageH = drawH + margin * 2;
      } else {
        const [w, h] = PAGE_SIZES_MM[sizeMode];
        const landscape = item.width > item.height;
        pageW = landscape ? h : w;
        pageH = landscape ? w : h;
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const ratio = Math.min(availW / item.width, availH / item.height);
        drawW = item.width * ratio;
        drawH = item.height * ratio;
      }

      const orientation = pageW > pageH ? 'l' : 'p';
      if (!doc) {
        doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation, compress: true });
      } else {
        doc.addPage([pageW, pageH], orientation);
      }

      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      doc.addImage(item.dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
    }

    setProgress('img', 100, 'Saving PDF…');
    const filename = (items.length === 1 ? baseName(items[0].name) : 'images') + '.pdf';
    doc.save(filename);
    toast('PDF created: ' + filename, 'success');
  } catch (err) {
    console.error(err);
    toast('Could not create the PDF. Try fewer or smaller images.', 'error');
    imgEls.progress.hidden = true;
  } finally {
    imgState.busy = false;
    imgEls.create.disabled = imgState.items.length === 0;
    imgEls.create.textContent = 'Create PDF';
  }
}

imgEls.input.addEventListener('change', (e) => {
  addImages(e.target.files).then(() => (imgEls.input.value = ''));
});
imgEls.clear.addEventListener('click', clearImages);
imgEls.create.addEventListener('click', createPdf);
setupDropzone(imgEls.drop, addImages);

/* Stop the browser from opening files dropped outside a dropzone */
['dragover', 'drop'].forEach((evt) =>
  window.addEventListener(evt, (e) => {
    if (!e.target.closest('.dropzone') && !e.target.closest('.img-list')) e.preventDefault();
  })
);
