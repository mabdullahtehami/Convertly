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
  gemini: { label: 'Google Gemini (free)', model: 'gemini-3.8-flash' },
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
export const PROMPT = `You are an expert medical transcriptionist reading a doctor's handwritten prescription.

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
   Image prep - normalise every input to a JPEG the AI can read
   ========================================================== */
function canvasPart(canvas) {
  const url = canvas.toDataURL('image/jpeg', 0.92);
  return { mime: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) };
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
export async function listGeminiModels(apiKey) {
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

export function pickGeminiModel(names) {
  const all = names.slice().sort(
    (a, b) =>
      MODEL_VER(b)[0] - MODEL_VER(a)[0] ||
      MODEL_VER(b)[1] - MODEL_VER(a)[1] ||
      MODEL_VER(b)[2] - MODEL_VER(a)[2]
  );
  const flash = all.filter((n) => /flash/i.test(n) && !MODEL_NOISE.test(n));
  if (flash.length) return flash[0];
  const any = all.filter((n) => !/image|tts|live|transcribe|nano|banana|omni|audio/i.test(n));
  return any[0] || names[0] || null;
}

/* Model gone? Pick one the key has and retry once instead of just failing. */
async function callGeminiAuto(cfg, parts, onModelChange) {
  try {
    return await callGemini(cfg, parts);
  } catch (err) {
    const status = err && err.status;
    const modelIssue =
      status === 404 || (status === 403 && /model/i.test(err.message || '') && !/api key/i.test(err.message || ''));
    if (!modelIssue) throw err;
    let names = null;
    try {
      names = await listGeminiModels(cfg.apiKey);
    } catch (e) {
      /* offline - fall through to the clear error below */
    }
    const picked = names ? pickGeminiModel(names) : null;
    if (!picked || picked === cfg.model) {
      throw new Error("Model '" + cfg.model + "' is not available on this key. Pick another in the Model field.");
    }
    cfg.model = picked;
    if (onModelChange) onModelChange(picked);
    return await callGemini(cfg, parts);
  }
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

/* Provider pick lives with the caller - one entry point here. */
export async function readPrescription(cfg, parts, onModelChange) {
  return cfg.provider === 'gemini' ? callGeminiAuto(cfg, parts, onModelChange) : callOpenAI(cfg, parts);
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
    confidence: Number.isFinite(conf) ? Math.max(0, Math.min(100, Math.round(conf))) : null,
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
