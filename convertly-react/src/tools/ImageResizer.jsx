/* ==========================================================
   Convertly React - Image Resizer
   Port of js/image-resizer.js (new width / height, ratio lock)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzImage } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, canvasToBlob, loadImage, imageOut } from '../lib/helpers.js';

export default function ImageResizer({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const imgRef = useRef(null); // the loaded <img> (not UI state)
  const ratioRef = useRef(1); // width / height of the original

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lock, setLock] = useState(true);
  const [busy, setBusy] = useState(false);

  async function choose(chosen) {
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    try {
      const img = await loadImage(chosen);
      imgRef.current = img;
      ratioRef.current = img.naturalWidth / img.naturalHeight;
      setFile(chosen);
      setMeta(img.naturalWidth + ' × ' + img.naturalHeight + ' · ' + formatBytes(chosen.size));
      setWidth(String(img.naturalWidth)); // start with the original size
      setHeight(String(img.naturalHeight));
    } catch (err) {
      console.error(err);
      toast('Could not read this image. Try JPG, PNG or WebP.', 'error');
    }
  }

  function reset() {
    imgRef.current = null;
    setFile(null);
    setMeta('');
    setWidth('');
    setHeight('');
    if (inputRef.current) inputRef.current.value = '';
  }

  /* Keep the other field in step while the ratio lock is on */
  function onWidth(e) {
    const w = e.target.value;
    setWidth(w);
    if (lock && w) setHeight(String(Math.max(1, Math.round(Number(w) / ratioRef.current))));
  }
  function onHeight(e) {
    const h = e.target.value;
    setHeight(h);
    if (lock && h) setWidth(String(Math.max(1, Math.round(Number(h) * ratioRef.current))));
  }

  async function resize() {
    if (!file || !imgRef.current || busy) return;
    const w = Math.round(Number(width));
    const h = Math.round(Number(height));
    if (!(w >= 1 && w <= 8000 && h >= 1 && h <= 8000)) {
      toast('Enter a size between 1 and 8000 pixels.', 'error');
      return;
    }

    setBusy(true);
    try {
      const out = imageOut(file.type);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (out.mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'; // transparency becomes white in a JPG
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(imgRef.current, 0, 0, w, h);
      const blob = await canvasToBlob(canvas, out.mime, 0.92);
      canvas.width = canvas.height = 0; // give the memory back

      downloadBlob(blob, baseName(file.name) + '-' + w + 'x' + h + '.' + out.ext);
      toast('Image resized to ' + w + ' × ' + h + '.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not resize this image. Try another file.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <Dropzone
        id="imgsize"
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
        sub="Set a new width or height in pixels."
      />

      <FileCard idPrefix="imgsize" badge="IMG" file={file} meta={meta} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="imgsizeW">Width (px)</label>
          <input type="number" id="imgsizeW" min="1" max="8000" value={width} disabled={!file} onChange={onWidth} />
        </div>
        <div className="field">
          <label htmlFor="imgsizeH">Height (px)</label>
          <input type="number" id="imgsizeH" min="1" max="8000" value={height} disabled={!file} onChange={onHeight} />
        </div>
      </div>

      <p className="hint note">
        <label>
          <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Keep the aspect ratio
        </label>
      </p>

      <div className="actions">
        <button className="btn btn-primary" id="imgsizeBtn" type="button" disabled={busy || !file} onClick={resize}>
          {busy ? 'Resizing…' : 'Resize image'}
        </button>
      </div>
    </section>
  );
}
