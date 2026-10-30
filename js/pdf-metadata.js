/* ==========================================================
   Convertly - pdf-metadata.js
   Tool: PDF Metadata (edit title, author, subject, keywords)
   ========================================================== */
'use strict';

(function () {
  UI.addTool('metadata', 'PDF Metadata', `
    ${UI.dropHtml('metadata', 'application/pdf,.pdf', UI.ICON_PDF, 'Drop a PDF here or <u>browse</u>', 'The values already inside the PDF are filled in for you.')}
    ${UI.cardHtml('metadata', 'PDF')}
    <div class="options">
      <div class="field">
        <label for="metadataTitle">Title</label>
        <input type="text" id="metadataTitle" autocomplete="off" />
      </div>
      <div class="field">
        <label for="metadataAuthor">Author</label>
        <input type="text" id="metadataAuthor" autocomplete="off" />
      </div>
      <div class="field">
        <label for="metadataSubject">Subject</label>
        <input type="text" id="metadataSubject" autocomplete="off" />
      </div>
      <div class="field">
        <label for="metadataKeywords">Keywords</label>
        <input type="text" id="metadataKeywords" placeholder="Comma separated" autocomplete="off" />
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="metadataBtn" type="button" disabled>Apply metadata</button></div>
  `);

  const el = {
    input: $('#metadataInput'),
    drop: $('#metadataDrop'),
    card: $('#metadataFileCard'),
    name: $('#metadataName'),
    meta: $('#metadataMeta'),
    remove: $('#metadataRemove'),
    title: $('#metadataTitle'),
    author: $('#metadataAuthor'),
    subject: $('#metadataSubject'),
    keywords: $('#metadataKeywords'),
    btn: $('#metadataBtn'),
  };
  const state = { file: null, doc: null, busy: false };

  async function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      toast('Please select a PDF file.', 'error');
      return;
    }
    if (!libsReady()) return;
    const doc = await openPdfLib(await file.arrayBuffer()); // null when damaged or protected
    if (!doc) {
      toast('Could not open this PDF. It may be damaged or protected.', 'error');
      return;
    }
    state.file = file;
    state.doc = doc;
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.hidden = false;
    el.btn.disabled = false;
    /* Show the values the PDF already has */
    el.title.value = doc.getTitle() || '';
    el.author.value = doc.getAuthor() || '';
    el.subject.value = doc.getSubject() || '';
    el.keywords.value = doc.getKeywords() || '';
  }

  function reset() {
    state.file = state.doc = null;
    el.input.value = '';
    el.card.hidden = true;
    el.btn.disabled = true;
    el.title.value = el.author.value = el.subject.value = el.keywords.value = '';
  }

  async function apply() {
    if (!state.doc || state.busy) return;
    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Saving…';

    try {
      state.doc.setTitle(el.title.value.trim());
      state.doc.setAuthor(el.author.value.trim());
      state.doc.setSubject(el.subject.value.trim());
      state.doc.setKeywords(el.keywords.value.split(',').map((s) => s.trim()).filter(Boolean));
      const bytes = await state.doc.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), baseName(state.file.name) + '-metadata.pdf');
      toast('PDF metadata updated.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not save the metadata. Try another file.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Apply metadata';
      el.btn.disabled = !state.doc;
    }
  }

  el.input.addEventListener('change', (e) => choose(e.target.files));
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', apply);
  setupDropzone(el.drop, choose);
})();
