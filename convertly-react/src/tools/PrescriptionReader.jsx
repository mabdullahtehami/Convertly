/* ==========================================================
   Convertly React - Handwritten Prescription Reader
   Port of js/prescription-reader.js
   ========================================================== */
import { Fragment, useEffect, useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { DzFileLines } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { baseName, downloadBlob, isPdfFile } from '../lib/helpers.js';
import {
  GEMINI_KEY_URL,
  PROVIDERS,
  fileToParts,
  listGeminiModels,
  normalize,
  parseAnswer,
  plainText,
  readPrescription,
} from '../lib/rxVision.js';

const SETTINGS_KEY = 'convertly.rx.settings';
const DEFAULT_MODELS = Object.values(PROVIDERS).map((p) => p.model).filter(Boolean);

function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch (e) {
    saved = {};
  }
  const provider = PROVIDERS[saved.provider] ? saved.provider : 'gemini';
  return {
    provider,
    apiKey: typeof saved.apiKey === 'string' ? saved.apiKey : '',
    model: typeof saved.model === 'string' && saved.model ? saved.model : PROVIDERS[provider].model,
    baseUrl: typeof saved.baseUrl === 'string' ? saved.baseUrl : '',
  };
}

/* Small presentational bits -------------------------------- */
function Card({ title, children, className }) {
  return (
    <div className={className ? 'rx-card ' + className : 'rx-card'}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Fields({ pairs }) {
  const rows = pairs.filter((p) => p[1]);
  if (!rows.length) return <p className="rx-none">Not written on the prescription.</p>;
  return (
    <dl>
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function ListCard({ title, items }) {
  return (
    <Card title={title}>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function PrescriptionReader({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [settings, setSettings] = useState(loadSettings);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });
  const [result, setResult] = useState(null);
  const [plain, setPlain] = useState('');
  const [modelOptions, setModelOptions] = useState([]);
  const fetchedFor = useRef('');

  /* Settings live only in this browser. */
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      /* private mode / storage full - settings just do not persist */
    }
  }, [settings]);

  /* Fill the Model dropdown with what this key can really use. */
  useEffect(() => {
    const key = settings.apiKey.trim();
    if (settings.provider !== 'gemini' || !key || fetchedFor.current === key) return;
    const timer = setTimeout(async () => {
      let names = null;
      try {
        names = await listGeminiModels(key);
      } catch (e) {
        return; /* helper only - silent when offline */
      }
      if (names && settings.apiKey.trim() === key) {
        fetchedFor.current = key;
        setModelOptions(names);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [settings.provider, settings.apiKey]);

  function update(patch) {
    setSettings((s) => {
      const next = { ...s, ...patch };
      /* switching provider keeps a hand-typed model but swaps a default one */
      if (patch.provider && (!next.model || DEFAULT_MODELS.indexOf(next.model) !== -1)) {
        next.model = PROVIDERS[patch.provider].model;
      }
      return next;
    });
  }

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isPdfFile(chosen) && !chosen.type.startsWith('image/')) {
      toast('Please select an image or a PDF file.', 'error');
      return;
    }
    setFile(chosen);
    setResult(null);
    setPlain('');
    setProgress({ show: false, percent: 0, text: '' });
  }

  function reset() {
    setFile(null);
    setResult(null);
    setPlain('');
    if (inputRef.current) inputRef.current.value = '';
    setProgress({ show: false, percent: 0, text: '' });
  }

  async function convert() {
    if (!file || busy) return;
    if (!settings.apiKey.trim()) {
      toast('Paste your API key first - get a free one at aistudio.google.com.', 'error');
      return;
    }
    if (!settings.model.trim()) {
      toast('Enter the model name.', 'error');
      return;
    }

    setBusy(true);
    setResult(null);
    setProgress({ show: true, percent: 12, text: 'Preparing the prescription image…' });

    try {
      const cfg = {
        provider: settings.provider,
        apiKey: settings.apiKey.trim(),
        model: settings.model.trim(),
        baseUrl: settings.baseUrl.trim(),
      };
      const parts = await fileToParts(file);
      setProgress({ show: true, percent: 45, text: 'Reading the handwriting with AI…' });
      const raw = await readPrescription(cfg, parts, (m) => {
        update({ model: m });
        setProgress({ show: true, percent: 50, text: 'Model updated to ' + m + ' — reading the handwriting…' });
      });
      setProgress({ show: true, percent: 85, text: 'Organizing the results…' });

      const data = normalize(parseAnswer(raw));
      if (!data.transcription && !data.medicines.length && !data.patient.name && !data.doctor.name) {
        throw new Error('Nothing readable was found on this image. Try a clearer photo.');
      }
      setResult(data);
      setPlain(plainText(data));
      setProgress({ show: true, percent: 100, text: 'Done.' });
      toast('Prescription read.', 'success');
    } catch (err) {
      console.error(err);
      setProgress({ show: false, percent: 0, text: '' });
      toast(err && err.message ? err.message : 'Could not read this prescription.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function downloadTxt() {
    if (plain) downloadBlob(new Blob(['\uFEFF' + plain], { type: 'text/plain;charset=utf-8' }), baseName(file.name) + '.txt');
  }

  function downloadJson() {
    if (result) downloadBlob(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }), baseName(file.name) + '.json');
  }

  async function copyText() {
    if (!plain) return;
    try {
      await navigator.clipboard.writeText(plain);
      toast('Copied to clipboard.', 'success');
    } catch (e) {
      toast('Could not copy. Select the text and copy manually.', 'error');
    }
  }

  const conf = result ? result.confidence : null;
  const meds = result ? result.medicines : [];

  return (
    <section className="panel" id={'panel-' + id} hidden={hidden}>
      <Dropzone
        id="rx"
        accept="image/*,application/pdf,.pdf"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzFileLines}
        title={
          <>
            Drop a prescription photo here or <u>browse</u>
          </>
        }
        sub="Doctor's handwriting — photo or scan, JPG / PNG / PDF."
      />

      <FileCard idPrefix="rx" badge={file && isPdfFile(file) ? 'PDF' : 'IMG'} file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="rxProvider">AI provider</label>
          <select id="rxProvider" value={settings.provider} onChange={(e) => update({ provider: e.target.value })}>
            {Object.entries(PROVIDERS).map(([pid, p]) => (
              <option key={pid} value={pid}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rxKey">API key</label>
          <input
            type="password"
            id="rxKey"
            placeholder="Paste your API key"
            autoComplete="off"
            spellCheck={false}
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="rxModel">Model</label>
          <input
            type="text"
            id="rxModel"
            placeholder="model name"
            autoComplete="off"
            spellCheck={false}
            list="rxModelList"
            value={settings.model}
            onChange={(e) => update({ model: e.target.value })}
          />
          <datalist id="rxModelList">
            {modelOptions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        {settings.provider === 'custom' && (
          <div className="field">
            <label htmlFor="rxBase">Base URL (OpenAI-compatible)</label>
            <input
              type="text"
              id="rxBase"
              placeholder="https://api.example.com/v1"
              autoComplete="off"
              spellCheck={false}
              value={settings.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
            />
          </div>
        )}
      </div>

      <p className="hint">
        {settings.provider === 'gemini' ? (
          <>
            Free key:{' '}
            <a href={GEMINI_KEY_URL} target="_blank" rel="noopener noreferrer">
              aistudio.google.com/apikey
            </a>{' '}
            · saved only in this browser.
          </>
        ) : (
          'Saved only in this browser. The image is sent only to the provider you pick.'
        )}
      </p>

      <div className="actions">
        <button className="btn btn-primary" id="rxBtn" type="button" disabled={busy || !file} onClick={convert}>
          {busy ? 'Reading…' : 'Read prescription'}
        </button>
      </div>

      <ProgressBar idPrefix="rx" show={progress.show} percent={progress.percent} text={progress.text} />

      {result && (
        <div className="results">
          <div className="results-head">
            <h2>
              Prescription read
              {conf != null && (
                <span className={'rx-conf ' + (conf >= 75 ? 'good' : conf >= 45 ? 'mid' : 'low')}>{conf}% readable</span>
              )}
            </h2>
            <div className="rx-btns">
              <button className="btn btn-quiet btn-sm" type="button" onClick={copyText}>
                Copy text
              </button>
              <button className="btn btn-quiet btn-sm" type="button" onClick={downloadJson}>
                Download JSON
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={downloadTxt}>
                Download TXT
              </button>
            </div>
          </div>

          <div className="rx-grid">
            <Card title="Patient">
              <Fields
                pairs={[
                  ['Name', result.patient.name],
                  ['Age', result.patient.age],
                  ['Gender', result.patient.gender],
                  ['Date', result.patient.date],
                ]}
              />
            </Card>
            <Card title="Doctor">
              <Fields
                pairs={[
                  ['Name', result.doctor.name],
                  ['Qualification', result.doctor.qualification],
                  ['Clinic', result.doctor.clinic],
                  ['Phone', result.doctor.phone],
                ]}
              />
            </Card>
          </div>

          {result.diagnosis.length > 0 && <ListCard title="Diagnosis / Complaints" items={result.diagnosis} />}

          <Card title={<><span>Medicines </span><span className="rx-count">{meds.length}</span></>}>
            {!meds.length && <p className="rx-none">No medicines could be read on this prescription.</p>}
            {meds.map((m, i) => (
              <div className="rx-med" key={i}>
                <div className="rx-med-name">
                  {m.name}
                  {m.strength && <span>{m.strength}</span>}
                </div>
                {(m.dose || m.frequency || m.duration || m.instructions) && (
                  <div className="rx-med-meta">
                    {m.dose && (
                      <span>
                        <b>Dose:</b> {m.dose}
                      </span>
                    )}
                    {m.frequency && (
                      <span>
                        <b>When:</b> {m.frequency}
                      </span>
                    )}
                    {m.duration && (
                      <span>
                        <b>For:</b> {m.duration}
                      </span>
                    )}
                    {m.instructions && (
                      <span>
                        <b>Note:</b> {m.instructions}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Card>

          {(result.advice.length > 0 || result.tests.length > 0) && (
            <div className="rx-grid">
              {result.advice.length > 0 && <ListCard title="Advice" items={result.advice} />}
              {result.tests.length > 0 && <ListCard title="Tests" items={result.tests} />}
            </div>
          )}

          {result.uncertain.length > 0 && (
            <Card title="Could not read clearly" className="rx-warn">
              <div className="rx-chips">
                {result.uncertain.map((u, i) => (
                  <span className="rx-chip" key={i}>
                    {u}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {result.transcription && (
            <Card title="Full transcription">
              <textarea rows="8" readOnly value={result.transcription} />
            </Card>
          )}
        </div>
      )}

      <p className="hint note">AI-assisted transcription — always confirm medicines and doses with the doctor or pharmacist.</p>
    </section>
  );
}
