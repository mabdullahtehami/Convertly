/* ==========================================================
   Convertly React - prescription vision helpers
   The prompt, the image prep and the AI calls behind the
   Handwritten Prescription Reader (port of js/prescription-reader.js).
   ========================================================== */
import { isPdfFile, loadImage } from './helpers.js';
import { pdfjsLib } from './pdfjs.js';

export const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';

const MAX_SIDE = 2000; /* longest edge sent to the AI */
const MIN_WIDTH = 1000; /* tiny photos get upscaled first */
const MAX_PDF_PAGES = 4;

export const PROVIDERS = {
  /* gemini-3.5-flash is the one every free AI Studio key can call -
     the pre-flight check below still corrects it if a key disagrees. */
  gemini: { label: 'Google Gemini (free)', model: 'gemini-3.5-flash' },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini' },
  openrouter: { label: 'OpenRouter', model: 'google/gemini-3.8-flash' },
  custom: { label: 'Custom (OpenAI-compatible)', model: '' },
};

const BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

/* ==========================================================
   Prompt - the quality of the whole tool lives here
   ========================================================== */
/* The quality of the whole tool lives in this prompt. */
const PROMPT = `You are an expert medical transcriptionist reading a doctor's handwritten prescription.
Read the attached prescription image(s) exactly like a pharmacist checking the paper before dispensing.

Reading order:
- Printed letterhead first (doctor name, qualifications, clinic, phone), then the handwritten body:
  date, patient line (name, age/sex), the Rx symbol, complaints/diagnosis, medicine lines,
  advice/tests, then the signature.
- Read every line. Messy, cursive, fast handwriting with heavy abbreviation is normal - use medical
  context (drug names, doses, frequencies, diagnoses) to work out ambiguous letters.

Rules:
1. Transcribe only what is actually written. Never invent medicines or details that are not on the paper.
2. One written medicine line = one entry in "medicines", kept in top-to-bottom order. Never merge two
   lines into one medicine and never split one line into two.
3. If a word or dose cannot be read with confidence, write "?" in that field and add the word to "uncertain".
4. Keep abbreviations exactly as written (Tab., Cap., Inj., Syp., Dr., OD, BD, TDS, QDS, HS, PRN, STAT,
   SOS, s.o.s, u.s.f.) but expand the meaning in "frequency", e.g. "BD - twice daily",
   "TDS - three times daily", "HS - at bedtime", "PRN - as needed", "STAT - immediately",
   "SOS - if required", "OD - once daily".
5. Medicine names must be standard English spelling (e.g. paracetamol, amoxicillin, omeprazole).
   Strength exactly as written ("500 mg", "0.25 mg", "10 ml"). The rest may be English or Roman Urdu -
   transcribe whichever language is used; for "instructions" add the English meaning in parentheses,
   e.g. "khana khany k baad (after meals)".
6. Include the date, patient name/age/sex (split "30/M" into age "30", gender "Male"), and doctor
   name/qualification/clinic/phone when they are present.
7. Give every medicine its own entry with strength, dose ("1 tablet"), frequency, duration
   ("5 days") and extra instructions ("after meals").
8. Lines you truly cannot decipher still belong in the transcription text - never silently drop them.

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

/* Structured output: the API validates the shape for us, so the answer
   always parses. Falls back to plain JSON mode on models that
   do not support responseSchema (see callGemini). */
const STR = { type: 'STRING' };
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    doctor: {
      type: 'OBJECT',
      properties: { name: STR, qualification: STR, clinic: STR, phone: STR },
      required: ['name', 'qualification', 'clinic', 'phone'],
    },
    patient: {
      type: 'OBJECT',
      properties: { name: STR, age: STR, gender: STR, date: STR },
      required: ['name', 'age', 'gender', 'date'],
    },
    diagnosis: { type: 'ARRAY', items: STR },
    medicines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: STR, strength: STR, dose: STR, frequency: STR, duration: STR, instructions: STR },
        required: ['name', 'strength', 'dose', 'frequency', 'duration', 'instructions'],
      },
    },
    advice: { type: 'ARRAY', items: STR },
    tests: { type: 'ARRAY', items: STR },
    transcription: STR,
    uncertain: { type: 'ARRAY', items: STR },
    confidence: { type: 'NUMBER' },
  },
  required: ['doctor', 'patient', 'diagnosis', 'medicines', 'advice', 'tests', 'transcription', 'uncertain', 'confidence'],
};

/* ==========================================================
   Image prep - normalise every input to a JPEG the AI can read
   ========================================================== */
function canvasPart(canvas) {
  const url = canvas.toDataURL('image/jpeg', 0.95);
  return { mime: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) };
}

/* Faded phone photos and light scans keep the handwriting inside a
   narrow grey band - stretch that band back so the AI sees real
   contrast. Never blocks the read if the canvas says no. */
function enhance(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  let samples = 0;
  for (let i = 0; i < d.length; i += 16) {
    const lum = Math.min(255, ((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000) | 0);
    hist[lum]++;
    samples++;
  }
  /* bins holding at least 0.05% of the pixels = real content, not noise */
  const minCount = Math.max(1, Math.ceil(samples * 0.0005));
  let lo = 0;
  let hi = 255;
  for (let v = 0; v < 256; v++) {
    if (hist[v] >= minCount) {
      lo = v;
      break;
    }
  }
  for (let v = 255; v >= 0; v--) {
    if (hist[v] >= minCount) {
      hi = v;
      break;
    }
  }
  const range = hi - lo;
  const lut = new Uint8Array(256);
  if (range > 0 && range < 160) {
    const gain = 255 / range; /* flat input -> stretch to full black..white */
    for (let v = 0; v < 256; v++) {
      const x = (v - lo) * gain;
      lut[v] = x < 0 ? 0 : x > 255 ? 255 : x;
    }
  } else {
    for (let v = 0; v < 256; v++) {
      const x = (v - 128) * 1.07 + 128; /* healthy input -> a touch of contrast */
      lut[v] = x < 0 ? 0 : x > 255 ? 255 : x;
    }
  }
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]];
    d[i + 1] = lut[d[i + 1]];
    d[i + 2] = lut[d[i + 2]];
  }
  ctx.putImageData(img, 0, 0);
}

function safeEnhance(canvas) {
  try {
    enhance(canvas);
  } catch (e) {
    /* enhancement is a bonus - the read must go on without it */
  }
}

export async function fileToParts(file) {
  const parts = [];

  if (isPdfFile(file)) {
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
        safeEnhance(canvas);
        parts.push(canvasPart(canvas));
        canvas.width = canvas.height = 0; /* give the memory back */
      }
    } finally {
      pdf.destroy().catch(() => {});
    }
    return parts;
  }

  const img = await loadImage(file);
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
  safeEnhance(canvas);
  parts.push(canvasPart(canvas));
  canvas.width = canvas.height = 0;
  return parts;
}

/* ==========================================================
   AI calls
   ========================================================== */
const LIST_TIMEOUT = 15000; /* model list - keep it snappy */
const ATTEMPT_TIMEOUT = 70000; /* one generateContent call */
const DEADLINE = 135000; /* whole read, all retries together */

let activeCtl = null;
let rxCancelled = false;

/* The Read button turns into Cancel while a request is in flight. */
export function cancelRx() {
  rxCancelled = true;
  if (activeCtl) activeCtl.abort();
}
export function resetRxCancel() {
  rxCancelled = false;
}

function rxError(kind) {
  const msg =
    kind === 'cancelled'
      ? 'Cancelled.'
      : kind === 'timeout'
        ? 'The AI took too long to answer. Try again.'
        : 'Could not reach the AI service. Check your internet connection.';
  const e = new Error(msg);
  e.kind = kind;
  return e;
}

async function post(url, options, timeoutMs) {
  const ctl = new AbortController();
  activeCtl = ctl;
  const timer = setTimeout(() => ctl.abort(), timeoutMs || ATTEMPT_TIMEOUT);
  try {
    return await fetch(url, Object.assign({}, options, { signal: ctl.signal }));
  } catch (err) {
    if (rxCancelled) throw rxError('cancelled');
    if (err && err.name === 'AbortError') throw rxError('timeout');
    throw rxError('net');
  } finally {
    clearTimeout(timer);
    if (activeCtl === ctl) activeCtl = null;
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
export async function listGeminiModels(apiKey) {
  const res = await post(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=' + encodeURIComponent(apiKey),
    { method: 'GET' },
    LIST_TIMEOUT
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

/* Cached for 5 minutes so a read never pays for the same list twice. */
let listCache = { key: '', names: null, at: 0 };
async function fetchGeminiList(apiKey) {
  const now = Date.now();
  if (listCache.key === apiKey && listCache.names && now - listCache.at < 300000) return listCache.names;
  const names = await listGeminiModels(apiKey);
  if (names) listCache = { key: apiKey, names: names, at: now };
  return names;
}

/* Pre-flight: confirm the model exists on this key BEFORE the photo is
   sent, so nothing changes half-way through a request. */
export async function resolveGeminiModel(cfg, onStatus) {
  let names = null;
  try {
    names = await fetchGeminiList(cfg.apiKey);
  } catch (e) {
    if (e && e.kind === 'cancelled') throw e;
    return cfg.model; /* offline - the call itself will decide */
  }
  if (!names || names.indexOf(cfg.model) !== -1) return cfg.model;
  const picked = pickGeminiModel(names, []);
  if (picked && picked !== cfg.model) {
    cfg.model = picked;
    if (onStatus) onStatus(picked);
  }
  return cfg.model;
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

/* What to do when a Gemini call fails:
   switch  - model retired or not accessible on this key -> pick another
   retry   - transient (5xx / timeout / network) -> try the same one again
   fatal   - key, quota or request problem -> tell the user right away */
function classifyGemini(err) {
  if (err && err.kind === 'cancelled') return 'fatal';
  if (err && (err.kind === 'timeout' || err.kind === 'net')) return 'retry';
  const s = err && err.status;
  if (s === 404) return 'switch';
  if (s === 403 && /model/i.test((err && err.message) || '')) return 'switch';
  if (s === 500 || s === 503 || s === 504) return 'retry';
  return 'fatal';
}

/* Model gone or busy? Ask the key what it has, switch, retry - but a
   timeout is NOT a model problem, so it never triggers a model hunt,
   and everything is capped by one hard deadline so the progress bar
   can never hang for minutes. */
async function callGeminiAuto(cfg, parts, onStatus) {
  const budget = Date.now() + DEADLINE;
  const tried = [];
  let retriedSame = 0;
  let lastErr = null;
  for (;;) {
    if (rxCancelled) throw rxError('cancelled');
    const left = budget - Date.now();
    if (left < 20000) break;
    tried.push(cfg.model);
    /* first attempt only - after a switch/retry the status above already
       explains what is happening, so it must not be overwritten */
    if (tried.length === 1 && onStatus) onStatus('Reading with ' + cfg.model + '…');
    try {
      return await callGemini(cfg, parts, Math.min(ATTEMPT_TIMEOUT, left));
    } catch (err) {
      lastErr = err;
      if (err && err.kind === 'cancelled') throw err;
      const how = classifyGemini(err);
      if (how === 'switch' && tried.length < 3) {
        let names = null;
        try {
          names = await fetchGeminiList(cfg.apiKey);
        } catch (e) {
          if (e && e.kind === 'cancelled') throw e;
          /* offline - the original error below says it all */
        }
        const picked = names ? pickGeminiModel(names, tried) : null;
        if (!picked) throw err;
        cfg.model = picked;
        if (onStatus) onStatus('Model updated to ' + picked + ' - your key can use it. Reading…');
        continue;
      }
      if (how === 'retry' && retriedSame < 1 && tried.length < 3) {
        retriedSame++;
        if (onStatus) onStatus('The AI was slow - trying again with ' + cfg.model + '…');
        continue;
      }
      throw err;
    }
  }
  throw lastErr || rxError('timeout');
}

async function callGemini(cfg, parts, timeoutMs) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(cfg.model) +
    ':generateContent?key=' +
    encodeURIComponent(cfg.apiKey);
  const contents = [
    {
      role: 'user',
      parts: [{ text: PROMPT }].concat(
        parts.map((p) => ({ inline_data: { mime_type: p.mime, data: p.data } }))
      ),
    },
  ];
  const buildBody = (withSchema) => {
    const generationConfig = { temperature: 0.15, responseMimeType: 'application/json' };
    if (withSchema) generationConfig.responseSchema = RESPONSE_SCHEMA;
    return { contents: contents, generationConfig: generationConfig };
  };
  const send = (withSchema) =>
    post(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(withSchema)),
      },
      timeoutMs
    );

  let res = await send(true);
  if (res.status === 400) {
    /* some models reject responseSchema - plain JSON mode instead */
    res = await send(false);
  }
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

/* Provider pick lives with the caller - one entry point here. */
export async function readPrescription(cfg, parts, onStatus) {
  return cfg.provider === 'gemini' ? callGeminiAuto(cfg, parts, onStatus) : callOpenAI(cfg, parts);
}

/* ==========================================================
   Answer -> plain data
   ========================================================== */
const str = (v) => (v == null ? '' : String(v)).trim();
const arr = (v) =>
  (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]).map(str).filter(Boolean);

export function parseAnswer(raw) {
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

export function normalize(raw) {
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

export function plainText(d) {
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
