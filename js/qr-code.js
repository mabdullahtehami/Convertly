/* ==========================================================
   Convertly - qr-code.js
   Tool: QR Code Generator (text / URL -> PNG or SVG)
   The qrcode library is an ES module, fetched from jsDelivr
   the first time a code is generated.
   ========================================================== */
'use strict';

(function () {
  UI.addTool('qr', 'QR Code Generator', `
    <div class="options">
      <div class="field">
        <label for="qrText">Text or URL</label>
        <textarea id="qrText" rows="3" placeholder="https://example.com"></textarea>
      </div>
      <div class="field">
        <label for="qrSize">Size</label>
        <select id="qrSize">
          <option value="256">Small (256 px)</option>
          <option value="512" selected>Medium (512 px)</option>
          <option value="1024">Large (1024 px)</option>
        </select>
      </div>
    </div>
    <div class="actions"><button class="btn btn-primary" id="qrBtn" type="button">Generate QR code</button></div>
    <div class="results" id="qrResults" hidden>
      <div class="results-head">
        <h2>Your QR code</h2>
        <div>
          <button class="btn btn-primary btn-sm" id="qrPng" type="button">Download PNG</button>
          <button class="btn btn-quiet btn-sm" id="qrSvg" type="button">Download SVG</button>
        </div>
      </div>
      <div style="text-align:center"><canvas id="qrCanvas"></canvas></div>
    </div>
  `);

  const el = {
    text: $('#qrText'),
    size: $('#qrSize'),
    btn: $('#qrBtn'),
    results: $('#qrResults'),
    canvas: $('#qrCanvas'),
    png: $('#qrPng'),
    svg: $('#qrSvg'),
  };
  let lib = null; // the module is downloaded only once

  async function getLib() {
    if (!lib) {
      try {
        lib = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
      } catch (err) {
        console.error(err);
        toast('QR library failed to load. Check your internet and refresh.', 'error');
      }
    }
    return lib;
  }

  const options = () => ({ width: Number(el.size.value), margin: 2 });

  /* Run fn with the library loaded, toast on any failure */
  async function withLib(fn) {
    const QR = await getLib();
    if (!QR) return;
    try {
      await fn(QR);
    } catch (err) {
      console.error(err);
      toast('Could not create the QR code. Try a shorter text.', 'error');
    }
  }

  el.btn.addEventListener('click', () =>
    withLib(async (QR) => {
      const text = el.text.value.trim();
      if (!text) {
        toast('Please enter some text or a URL.', 'error');
        return;
      }
      await QR.toCanvas(el.canvas, text, options()); // draws the preview
      el.results.hidden = false;
    })
  );

  el.png.addEventListener('click', () =>
    withLib(async (QR) => {
      const dataUrl = await QR.toDataURL(el.text.value.trim(), options());
      const blob = await (await fetch(dataUrl)).blob(); // data URL -> Blob so downloadBlob() can be reused
      downloadBlob(blob, 'qr-code.png');
    })
  );

  el.svg.addEventListener('click', () =>
    withLib(async (QR) => {
      const svg = await QR.toString(el.text.value.trim(), { ...options(), type: 'svg' });
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg');
    })
  );
})();
