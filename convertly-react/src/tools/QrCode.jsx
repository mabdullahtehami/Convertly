/* ==========================================================
   Convertly React - QR Code Generator
   Port of js/qr-code.js (text / URL -> PNG or SVG)
   ========================================================== */
import { useRef, useState } from 'react';
import { useToast } from '../lib/toast.jsx';
import { downloadBlob } from '../lib/helpers.js';
import QRCode from 'qrcode';

export default function QrCode({ id, hidden }) {
  const toast = useToast();
  const canvasRef = useRef(null);

  const [text, setText] = useState('');
  const [size, setSize] = useState('512');
  const [resultsShow, setResultsShow] = useState(false);

  const options = () => ({ width: Number(size), margin: 2 });

  /* Run fn, toast on any failure */
  async function run(fn) {
    try {
      await fn();
    } catch (err) {
      console.error(err);
      toast('Could not create the QR code. Try a shorter text.', 'error');
    }
  }

  function generate() {
    const words = text.trim();
    if (!words) {
      toast('Please enter some text or a URL.', 'error');
      return;
    }
    return run(async () => {
      await QRCode.toCanvas(canvasRef.current, words, options()); // draws the preview
      setResultsShow(true);
    });
  }

  function downloadPng() {
    return run(async () => {
      const dataUrl = await QRCode.toDataURL(text.trim(), options());
      const blob = await (await fetch(dataUrl)).blob(); // data URL -> Blob so downloadBlob() can be reused
      downloadBlob(blob, 'qr-code.png');
    });
  }

  function downloadSvg() {
    return run(async () => {
      const svg = await QRCode.toString(text.trim(), { ...options(), type: 'svg' });
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg');
    });
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="options">
        <div className="field">
          <label htmlFor="qrText">Text or URL</label>
          <textarea
            id="qrText"
            rows="3"
            placeholder="https://example.com"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="qrSize">Size</label>
          <select id="qrSize" value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="256">Small (256 px)</option>
            <option value="512">Medium (512 px)</option>
            <option value="1024">Large (1024 px)</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" id="qrBtn" type="button" onClick={generate}>
          Generate QR code
        </button>
      </div>

      <div className="results" id="qrResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2>Your QR code</h2>
          <div>
            <button className="btn btn-primary btn-sm" id="qrPng" type="button" onClick={downloadPng}>
              Download PNG
            </button>
            <button className="btn btn-quiet btn-sm" id="qrSvg" type="button" onClick={downloadSvg}>
              Download SVG
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <canvas id="qrCanvas" ref={canvasRef} />
        </div>
      </div>
    </section>
  );
}
