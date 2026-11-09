/* ==========================================================
   Convertly - prescription-reader.js
   Tool: Handwritten Prescription Reader
   Sends the prescription photo to an AI vision model
   (Google Gemini by default) and returns the doctor, patient
   and medicines as structured fields.
   ========================================================== */
'use strict';

(function () {
  const SETTINGS_KEY = 'convertly.rx.settings';
  const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';
  const MAX_SIDE = 2000; /* longest edge sent to the AI */
  const MIN_WIDTH = 1000; /* tiny photos get upscaled first */
  const MAX_PDF_PAGES = 4;

  const PROVIDERS = {
    gemini: { label: 'Google Gemini (free)', model: 'gemini-3.6-flash' },
    openai: { label: 'OpenAI', model: 'gpt-4o-mini' },
    openrouter: { label: 'OpenRouter', model: 'google/gemini-3.8-flash' },
    custom: { label: 'Custom (OpenAI-compatible)', model: '' },
  };
  const BASE_URLS = {
    openai: 'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
  };
  const DEFAULT_MODELS = Object.values(PROVIDERS).map((p) => p.model).filter(Boolean);

  const providerOptions = Object.keys(PROVIDERS)
    .map((id) => '<option value="' + id + '">' + PROVIDERS[id].label + '</option>')
    .join('');

  UI.addTool('rx', 'Handwritten Prescription Reader', `
    ${UI.dropHtml('rx', 'image/*,application/pdf,.pdf', UI.ICON_LINES,
      "Drop a prescription photo here or <u>browse</u>",
      "Doctor's handwriting — photo or scan, JPG / PNG / PDF.")}
    ${UI.cardHtml('rx', 'IMG')}
    <div class="options">
      <div class="field">
        <label for="rxProvider">AI provider</label>
        <select id="rxProvider">${providerOptions}</select>
      </div>
      <div class="field">
        <label for="rxKey">API key</label>
        <input type="password" id="rxKey" placeholder="Paste your API key" autocomplete="off" spellcheck="false">
      </div>
      <div class="field">
        <label for="rxModel">Model</label>
        <input type="text" id="rxModel" placeholder="model name" autocomplete="off" spellcheck="false" list="rxModelList">
        <datalist id="rxModelList"></datalist>
      </div>
      <div class="field" id="rxBaseField" hidden>
        <label for="rxBase">Base URL (OpenAI-compatible)</label>
        <input type="text" id="rxBase" placeholder="https://api.example.com/v1" autocomplete="off" spellcheck="false">
      </div>
    </div>
    <p class="hint" id="rxKeyHint"></p>
    <div class="actions">
      <button class="btn btn-primary" id="rxBtn" type="button" disabled>Read prescription</button>
    </div>
    ${UI.progressHtml('rx')}
    <div class="results" id="rxResults" hidden>
      <div class="results-head">
        <h2 id="rxSummary">Prescription read</h2>
        <div class="rx-btns">
          <button class="btn btn-quiet btn-sm" id="rxCopy" type="button">Copy text</button>
          <button class="btn btn-quiet btn-sm" id="rxJson" type="button">Download JSON</button>
          <button class="btn btn-primary btn-sm" id="rxDownload" type="button">Download TXT</button>
        </div>
      </div>
      <div id="rxBody"></div>
    </div>
    <p class="hint note">AI-assisted transcription — always confirm medicines and doses with the doctor or pharmacist.</p>
  `);

  const el = {
    input: $('#rxInput'),
    drop: $('#rxDrop'),
    card: $('#rxFileCard'),
    name: $('#rxName'),
    meta: $('#rxMeta'),
    remove: $('#rxRemove'),
    provider: $('#rxProvider'),
    key: $('#rxKey'),
    model: $('#rxModel'),
    modelList: $('#rxModelList'),
    baseField: $('#rxBaseField'),
    base: $('#rxBase'),
    keyHint: $('#rxKeyHint'),
    btn: $('#rxBtn'),
    progress: $('#rxProgress'),
    results: $('#rxResults'),
    summary: $('#rxSummary'),
    body: $('#rxBody'),
    copy: $('#rxCopy'),
    json: $('#rxJson'),
    download: $('#rxDownload'),
  };

  const state = { file: null, busy: false, data: null, text: '' };

  /* ==========================================================
     Prompt - the quality of the whole tool lives here
     ========================================================== */
  const PROMPT = `You are an expert medical transcriptionist reading a doctor's handwritten prescription.

Read the attached prescription image(s) carefully, exactly like a pharmacist would.
Doctor handwriting can be messy, cursive, fast and heavily abbreviated - use medical
context (drug names, doses, frequencies, diagnoses) to work out ambiguous letters.

Rules:
1. Transcribe only what is actually written. Never invent medicines or details that are not on the paper.
2. If a word or dose cannot be read with confidence, write "?" in that field and list the word in "uncertain".
3. Keep abbreviations as written (Tab., Cap., Inj., Syp., OD, BD, TDS, QDS, HS, PRN) but state the plain meaning in "frequency", e.g. "BD - twice daily".
4. Medicine names must be standard English spelling (e.g. paracetamol, amoxicillin, omeprazole). The rest may be English or Roman Urdu - transcribe whichever language is used.
5. Include date, patient name/age/sex, and doctor name/qualification/clinic when they are present.
6. Give every medicine its own entry with strength, dose ("1 tablet"), frequency, duration ("5 days") and extra instructions ("after meals").

Return ONLY one valid JSON object, no markdown fences, with exactly this schema:
{
  "doctor": { "name": "", "qualification": "", "clinic": "", "phone": "" },
  "patient": { "name": "", "age": "", "gender": "", "date": "" },
  "diagnosis": ["complaint or diagnosis line"],
  "medicines": [
    { "name": "", "strength": "", "dose": "", "frequency": "", "duration": "", "instructions": "" }
  ],
  "advice": ["advice line"],
  "tests": ["test line"],
  "transcription": "full verbatim text of the prescription",
  "uncertain": ["word you could not read clearly"],
  "confidence": 0
}
"confidence" is your overall readability score from 0 to 100.`;

  /* ==========================================================
     Settings - saved only in this browser (localStorage)
     ========================================================== */
  function syncProviderHint() {
    const id = el.provider.value;
    el.baseField.hidden = id !== 'custom';
    el.keyHint.innerHTML =
      id === 'gemini'
        ? 'Free key: <a href="' + GEMINI_KEY_URL + '" target="_blank" rel="noopener">aistudio.google.com/apikey</a> · saved only in this browser.'
        : 'Saved only in this browser. The image is sent only to the provider you pick.';
  }

  function loadSettings() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (e) {
      saved = {};
    }
    el.provider.value = PROVIDERS[saved.provider] ? saved.provider : 'gemini';
    el.key.value = typeof saved.apiKey === 'string' ? saved.apiKey : '';
    el.model.value = typeof saved.model === 'string' ? saved.model : '';
    el.base.value = typeof saved.baseUrl === 'string' ? saved.baseUrl : '';
    if (!el.model.value) el.model.value = PROVIDERS[el.provider.value].model;
    syncProviderHint();
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          provider: el.provider.value,
          apiKey: el.key.value.trim(),
          model: el.model.value.trim(),
          baseUrl: el.base.value.trim(),
        })
      );
    } catch (e) {
      /* private mode / storage full - settings just do not persist */
    }
  }

  function onProviderChange() {
    const model = el.model.value.trim();
    if (!model || DEFAULT_MODELS.indexOf(model) !== -1) {
      el.model.value = PROVIDERS[el.provider.value].model;
    }
    syncProviderHint();
    saveSettings();
    refreshModels();
  }

  /* ==========================================================
     File in
     ========================================================== */
  function choose(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    if (!isPdfFile(file) && !file.type.startsWith('image/')) {
      toast('Please select an image or a PDF file.', 'error');
      return;
    }
    state.file = file;
    state.data = null;
    state.text = '';
    el.name.textContent = file.name;
    el.meta.textContent = formatBytes(file.size);
    el.card.querySelector('.file-badge').textContent = isPdfFile(file) ? 'PDF' : 'IMG';
    el.card.hidden = false;
    el.results.hidden = true;
    el.progress.hidden = true;
    el.btn.disabled = false;
  }

  function reset() {
    state.file = null;
    state.data = null;
    state.text = '';
    el.input.value = '';
    el.card.hidden = true;
    el.results.hidden = true;
    el.progress.hidden = true;
    el.btn.disabled = true;
  }

  /* ==========================================================
     Image prep - normalise every input to a JPEG the AI can read
     ========================================================== */
  function canvasPart(canvas) {
    const url = canvas.toDataURL('image/jpeg', 0.92);
    return { mime: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) };
  }

  async function fileToParts(file) {
    const parts = [];

    if (isPdfFile(file)) {
      if (!window.pdfjsLib) {
        throw new Error('PDF library failed to load. Check your internet and refresh.');
      }
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      try {
        const total = Math.min(pdf.numPages, MAX_PDF_PAGES);
        for (let n = 1; n <= total; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          page.cleanup();
          parts.push(canvasPart(canvas));
          canvas.width = canvas.height = 0; /* give the memory back */
        }
      } finally {
        pdf.destroy().catch(() => {});
      }
      return parts;
    }

    const img = await UI.loadImage(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    let scale = 1;
    if (Math.max(w, h) > MAX_SIDE) scale = MAX_SIDE / Math.max(w, h);
    else if (w < MIN_WIDTH) scale = Math.min(2, MIN_WIDTH / w);
    if (Math.max(w, h) * scale > MAX_SIDE) scale = MAX_SIDE / Math.max(w, h);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    parts.push(canvasPart(canvas));
    canvas.width = canvas.height = 0;
    return parts;
  }

  /* ==========================================================
     AI calls
     ========================================================== */
  async function post(url, options) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 120000);
    try {
      return await fetch(url, Object.assign({}, options, { signal: ctl.signal }));
    } catch (err) {
      if (err && err.name === 'AbortError') throw new Error('The AI took too long to answer. Try again.');
      throw new Error('Could not reach the AI service. Check your internet connection.');
    } finally {
      clearTimeout(timer);
    }
  }

  async function httpError(res) {
    let detail = '';
    try {
      const body = await res.json();
      detail = (body && body.error && body.error.message) || (body && body.message) || '';
    } catch (e) {
      /* body was not JSON - use the status only */
    }
    const friendly = {
      400: 'The request was rejected - check the model name and key.',
      401: 'The API key was not accepted. Copy it again.',
      403: 'This key does not have access to that model.',
      404: 'Model not found - check the model name.',
      429: 'Rate limit reached. Wait a minute and try again.',
    }[res.status];
    const base = friendly || 'The AI service replied with error ' + res.status + '.';
    const err = new Error(detail ? base + ' (' + detail + ')' : base);
    err.status = res.status;
    return err;
  }

  /* Ask the key which models it can really use, so the tool keeps working
     when Google retires a version (gemini-2.5-flash -> deprecated, etc). */
  async function listGeminiModels(apiKey) {
    const res = await post(
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=' + encodeURIComponent(apiKey),
      { method: 'GET' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const names = (Array.isArray(json.models) ? json.models : [])
      .filter(
        (m) =>
          m &&
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.indexOf('generateContent') !== -1
      )
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
    return names.length ? names : null;
  }

  const MODEL_NOISE =
    /preview|experimental|lite|image|tts|live|transcribe|nano|banana|omni|embedding|research|antigravity|robotics|computer|lyria|audio/i;
  const MODEL_VER = (n) => {
    const m = n.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
    return m ? [+m[1], +m[2], +(m[3] || 0)] : [0, 0, 0];
  };

  function pickGeminiModel(names, tried) {
    const all = names.slice().sort(
      (a, b) =>
        MODEL_VER(b)[0] - MODEL_VER(a)[0] ||
        MODEL_VER(b)[1] - MODEL_VER(a)[1] ||
        MODEL_VER(b)[2] - MODEL_VER(a)[2]
    );
    const fresh = (n) => tried.indexOf(n) === -1;
    const flash = all.filter((n) => /flash/i.test(n) && !MODEL_NOISE.test(n));
    const preferred = flash.find((n) => n === PROVIDERS.gemini.model && fresh(n));
    if (preferred) return preferred;
    const alt = flash.find(fresh);
    if (alt) return alt;
    const any = all.filter((n) => !/image|tts|live|transcribe|nano|banana|omni|audio/i.test(n));
    return any.find(fresh) || null;
  }

  /* Retriable: model retired (404), or temporarily overloaded (5xx / timeout). */
  function retriableGemini(err) {
    const s = err && err.status;
    const m = (err && err.message) || '';
    return (
      s === 404 ||
      s === 500 ||
      s === 503 ||
      s === 504 ||
      (s === 403 && /model/i.test(m) && !/api key/i.test(m)) ||
      /too long|timed out/i.test(m)
    );
  }

  /* Model gone or busy? Ask the key what it has, switch, retry. */
  async function callGeminiAuto(cfg, parts, onModelChange) {
    const tried = [];
    let lastErr = null;
    for (let i = 0; i < 3; i++) {
      tried.push(cfg.model);
      try {
        return await callGemini(cfg, parts);
      } catch (err) {
        lastErr = err;
        if (!retriableGemini(err)) throw err;
        let names = null;
        try {
          names = await listGeminiModels(cfg.apiKey);
        } catch (e) {
          /* offline - the raw error below says it all */
        }
        const picked = names ? pickGeminiModel(names, tried) : null;
        if (!picked) throw err;
        cfg.model = picked;
        if (onModelChange) onModelChange(picked);
      }
    }
    throw lastErr;
  }

  async function callGemini(cfg, parts) {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(cfg.model) +
      ':generateContent?key=' +
      encodeURIComponent(cfg.apiKey);
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: PROMPT }].concat(
            parts.map((p) => ({ inline_data: { mime_type: p.mime, data: p.data } }))
          ),
        },
      ],
      generationConfig: { temperature: 0.15, responseMimeType: 'application/json' },
    };
    const res = await post(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await httpError(res);

    const json = await res.json();
    const cand = json.candidates && json.candidates[0];
    const text =
      cand && cand.content && cand.content.parts
        ? cand.content.parts.map((p) => p.text || '').join('').trim()
        : '';
    if (!text) {
      const reason = json.promptFeedback && json.promptFeedback.blockReason;
      throw new Error(reason ? 'The request was blocked: ' + reason + '.' : 'The AI returned no text. Try another photo.');
    }
    return text;
  }

  async function callOpenAI(cfg, parts) {
    if (cfg.provider === 'custom' && !cfg.baseUrl) {
      throw new Error('Enter the base URL for your custom provider.');
    }
    const content = [{ type: 'text', text: PROMPT }].concat(
      parts.map((p) => ({ type: 'image_url', image_url: { url: 'data:' + p.mime + ';base64,' + p.data } }))
    );
    const body = { model: cfg.model, messages: [{ role: 'user', content }], temperature: 0.15 };
    if (cfg.provider !== 'custom') body.response_format = { type: 'json_object' };

    const base = cfg.provider === 'custom' ? cfg.baseUrl : BASE_URLS[cfg.provider];
    const res = await post(base.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await httpError(res);

    const json = await res.json();
    const text = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
    if (!text || !text.trim()) throw new Error('The AI returned no text. Try another photo.');
    return text.trim();
  }

  /* ==========================================================
     Answer -> plain data
     ========================================================== */
  const str = (v) => (v == null ? '' : String(v)).trim();
  const arr = (v) =>
    (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]).map(str).filter(Boolean);

  function parseAnswer(raw) {
    let t = String(raw).trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a === -1 || b === -1 || b <= a) throw new Error('Could not understand the AI answer. Try again.');
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch (e) {
      throw new Error('Could not understand the AI answer. Try again.');
    }
  }

  function normalize(raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    const doctor = d.doctor && typeof d.doctor === 'object' ? d.doctor : {};
    const patient = d.patient && typeof d.patient === 'object' ? d.patient : {};
    const meds = Array.isArray(d.medicines) ? d.medicines : [];
    const conf = d.confidence == null || d.confidence === '' ? null : Number(d.confidence);
    return {
      doctor: {
        name: str(doctor.name),
        qualification: str(doctor.qualification),
        clinic: str(doctor.clinic),
        phone: str(doctor.phone),
      },
      patient: {
        name: str(patient.name),
        age: str(patient.age),
        gender: str(patient.gender),
        date: str(patient.date),
      },
      diagnosis: arr(d.diagnosis),
      medicines: meds
        .filter((m) => m && typeof m === 'object')
        .map((m) => ({
          name: str(m.name),
          strength: str(m.strength),
          dose: str(m.dose),
          frequency: str(m.frequency),
          duration: str(m.duration),
          instructions: str(m.instructions),
        }))
        .filter((m) => m.name),
      advice: arr(d.advice),
      tests: arr(d.tests),
      transcription: str(d.transcription),
      uncertain: arr(d.uncertain),
      /* models answer confidence either 0-100 or 0-1 */
      confidence: Number.isFinite(conf) ? Math.max(0, Math.min(100, Math.round(conf <= 1 ? conf * 100 : conf))) : null,
    };
  }

  /* ==========================================================
     Results
     ========================================================== */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function infoCard(title, pairs) {
    const rows = pairs.filter((p) => p[1]);
    const inner = rows.length
      ? '<dl>' +
        rows.map((p) => '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>').join('') +
        '</dl>'
      : '<p class="rx-none">Not written on the prescription.</p>';
    return '<div class="rx-card"><h3>' + esc(title) + '</h3>' + inner + '</div>';
  }

  function listCard(title, items) {
    return (
      '<div class="rx-card"><h3>' +
      esc(title) +
      '</h3><ul>' +
      items.map((i) => '<li>' + esc(i) + '</li>').join('') +
      '</ul></div>'
    );
  }

  function render(data) {
    let html = '<div class="rx-grid">' +
      infoCard('Patient', [
        ['Name', data.patient.name],
        ['Age', data.patient.age],
        ['Gender', data.patient.gender],
        ['Date', data.patient.date],
      ]) +
      infoCard('Doctor', [
        ['Name', data.doctor.name],
        ['Qualification', data.doctor.qualification],
        ['Clinic', data.doctor.clinic],
        ['Phone', data.doctor.phone],
      ]) +
      '</div>';

    if (data.diagnosis.length) html += listCard('Diagnosis / Complaints', data.diagnosis);

    html += '<div class="rx-card"><h3>Medicines <span class="rx-count">' + data.medicines.length + '</span></h3>';
    if (!data.medicines.length) html += '<p class="rx-none">No medicines could be read on this prescription.</p>';
    html += data.medicines
      .map((m) => {
        const bits = [];
        if (m.dose) bits.push(['Dose', m.dose]);
        if (m.frequency) bits.push(['When', m.frequency]);
        if (m.duration) bits.push(['For', m.duration]);
        if (m.instructions) bits.push(['Note', m.instructions]);
        return (
          '<div class="rx-med"><div class="rx-med-name">' +
          esc(m.name) +
          (m.strength ? '<span>' + esc(m.strength) + '</span>' : '') +
          '</div>' +
          (bits.length
            ? '<div class="rx-med-meta">' +
              bits.map((b) => '<span><b>' + b[0] + ':</b> ' + esc(b[1]) + '</span>').join('') +
              '</div>'
            : '') +
          '</div>'
        );
      })
      .join('');
    html += '</div>';

    if (data.advice.length || data.tests.length) {
      html += '<div class="rx-grid">';
      if (data.advice.length) html += listCard('Advice', data.advice);
      if (data.tests.length) html += listCard('Tests', data.tests);
      html += '</div>';
    }

    if (data.uncertain.length) {
      html +=
        '<div class="rx-card rx-warn"><h3>Could not read clearly</h3><div class="rx-chips">' +
        data.uncertain.map((u) => '<span class="rx-chip">' + esc(u) + '</span>').join('') +
        '</div></div>';
    }

    if (data.transcription) {
      html +=
        '<div class="rx-card"><h3>Full transcription</h3><textarea rows="8" readonly>' +
        esc(data.transcription) +
        '</textarea></div>';
    }

    el.body.innerHTML = html;

    const conf = data.confidence;
    el.summary.innerHTML =
      'Prescription read' +
      (conf == null
        ? ''
        : ' <span class="rx-conf ' +
          (conf >= 75 ? 'good' : conf >= 45 ? 'mid' : 'low') +
          '">' +
          conf +
          '% readable</span>');
  }

  function plainText(d) {
    const L = ['PRESCRIPTION'];
    const who = [d.patient.name, d.patient.age ? 'Age ' + d.patient.age : '', d.patient.gender]
      .filter(Boolean)
      .join(', ');
    if (who) L.push('Patient: ' + who);
    if (d.patient.date) L.push('Date: ' + d.patient.date);
    const dr = [d.doctor.name, d.doctor.qualification].filter(Boolean).join(', ');
    if (dr) L.push('Doctor: ' + dr);
    if (d.doctor.clinic) L.push('Clinic: ' + d.doctor.clinic);
    if (d.diagnosis.length) L.push('', 'Diagnosis / Complaints:', d.diagnosis.map((x) => '- ' + x).join('\n'));
    L.push('', 'Medicines:');
    if (!d.medicines.length) L.push('- none read');
    d.medicines.forEach((m, i) => {
      const head = i + 1 + '. ' + m.name + (m.strength ? ' ' + m.strength : '');
      const bits = [m.dose, m.frequency, m.duration, m.instructions].filter(Boolean);
      L.push(head + (bits.length ? '\n   ' + bits.join(' · ') : ''));
    });
    if (d.advice.length) L.push('', 'Advice:', d.advice.map((x) => '- ' + x).join('\n'));
    if (d.tests.length) L.push('', 'Tests:', d.tests.map((x) => '- ' + x).join('\n'));
    if (d.uncertain.length) L.push('', 'Unclear words: ' + d.uncertain.join(', '));
    if (d.transcription) L.push('', 'Transcription:', d.transcription);
    return L.join('\n');
  }

  /* ==========================================================
     Main flow
     ========================================================== */
  function readCfg() {
    return {
      provider: el.provider.value,
      apiKey: el.key.value.trim(),
      model: el.model.value.trim(),
      baseUrl: el.base.value.trim(),
    };
  }

  async function convert() {
    if (!state.file || state.busy) return;
    const cfg = readCfg();
    if (!cfg.apiKey) {
      toast('Paste your API key first - get a free one at aistudio.google.com.', 'error');
      el.key.focus();
      return;
    }
    if (!cfg.model) {
      toast('Enter the model name.', 'error');
      el.model.focus();
      return;
    }

    state.busy = true;
    el.btn.disabled = true;
    el.btn.textContent = 'Reading…';
    el.results.hidden = true;
    el.progress.hidden = false;
    setProgress('rx', 12, 'Preparing the prescription image…');

    try {
      const parts = await fileToParts(state.file);
      setProgress('rx', 45, 'Reading the handwriting with AI…');
      const raw =
        cfg.provider === 'gemini'
          ? await callGeminiAuto(cfg, parts, (m) => {
              el.model.value = m;
              saveSettings();
              setProgress('rx', 50, 'Model updated to ' + m + ' — reading the handwriting…');
            })
          : await callOpenAI(cfg, parts);
      setProgress('rx', 85, 'Organizing the results…');

      const data = normalize(parseAnswer(raw));
      if (!data.transcription && !data.medicines.length && !data.patient.name && !data.doctor.name) {
        throw new Error('Nothing readable was found on this image. Try a clearer photo.');
      }
      state.data = data;
      state.text = plainText(data);
      render(data);
      el.results.hidden = false;
      setProgress('rx', 100, 'Done.');
      toast('Prescription read.', 'success');
    } catch (err) {
      console.error(err);
      el.progress.hidden = true;
      toast(err && err.message ? err.message : 'Could not read this prescription.', 'error');
    } finally {
      state.busy = false;
      el.btn.textContent = 'Read prescription';
      el.btn.disabled = !state.file;
    }
  }

  /* ==========================================================
     Wire it up
     ========================================================== */
  onFileInput(el.input, choose);
  setupDropzone(el.drop, choose);
  el.remove.addEventListener('click', reset);
  el.btn.addEventListener('click', convert);
  el.provider.addEventListener('change', onProviderChange);
  el.model.addEventListener('input', saveSettings);
  el.base.addEventListener('input', saveSettings);

  /* Fill the Model dropdown with what this key can really use. */
  let modelsFor = '';
  let modelTimer;
  async function refreshModels() {
    const key = el.key.value.trim();
    if (el.provider.value !== 'gemini' || !key || key === modelsFor) return;
    let names = null;
    try {
      names = await listGeminiModels(key);
    } catch (e) {
      return; /* helper only - silent when offline */
    }
    if (!names || el.key.value.trim() !== key) return;
    modelsFor = key;
    el.modelList.innerHTML = names.map((n) => '<option value="' + n + '"></option>').join('');
  }

  el.key.addEventListener('input', () => {
    saveSettings();
    clearTimeout(modelTimer);
    modelTimer = setTimeout(refreshModels, 800);
  });

  el.download.addEventListener('click', () => {
    if (state.text) {
      downloadBlob(new Blob(['\uFEFF' + state.text], { type: 'text/plain;charset=utf-8' }), baseName(state.file.name) + '.txt');
    }
  });
  el.json.addEventListener('click', () => {
    if (state.data) {
      downloadBlob(new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' }), baseName(state.file.name) + '.json');
    }
  });
  el.copy.addEventListener('click', async () => {
    if (!state.text) return;
    try {
      await navigator.clipboard.writeText(state.text);
      toast('Copied to clipboard.', 'success');
    } catch (e) {
      toast('Could not copy. Select the text and copy manually.', 'error');
    }
  });

  loadSettings();
  refreshModels();
})();
