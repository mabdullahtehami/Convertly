/* ==========================================================
   Convertly React - Image Converter
   Port of js/image-converter.js (JPG <-> PNG <-> WebP)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzImage } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, canvasToBlob, loadImage, imageOut } from '../lib/helpers.js';

const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export default function ImageConverter({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('jpg');
  const [busy, setBusy] = useState(false);

  function choose(chosen) {
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    setFile(chosen);
  }

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function convert() {
    if (!file || busy) return;
    setBusy(true);

    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff'; // JPG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, TYPES[format], 0.92);
      canvas.width = canvas.height = 0; // give the memory back

      const out = imageOut(blob.type); // use what the browser really produced
      downloadBlob(blob, baseName(file.name) + '.' + out.ext);
      toast('Image converted to ' + out.ext.toUpperCase() + '.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not read this image. Try JPG, PNG or WebP.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="imgconv"
        accept="image/*"
        inputRef={inputRef}
        onFiles={(fileList) => {
          const chosen = fileList && fileList[0];
          if (inputRef.current) inputRef.current.value = '';
          choose(chosen);
        }}
        icon={DzImage}
        title={
          <>
            Drop an image here or <u>browse</u>
          </>
        }
        sub="JPG, PNG or WebP in, any of them out."
      />

      <FileCard idPrefix="imgconv" badge="IMG" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="imgconvFormat">Convert to</label>
          <select id="imgconvFormat" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="imgconvBtn"
          type="button"
          disabled={busy || !file}
          onClick={convert}
        >
          {busy ? 'Converting…' : 'Convert image'}
        </button>
      </div>
    </section>
  );
}
