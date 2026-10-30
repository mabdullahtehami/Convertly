/* ==========================================================
   Convertly React - Rotate Image
   Port of js/rotate-image.js (90° / 180° turns on a canvas)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzImage } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { baseName, downloadBlob, canvasToBlob, loadImage, imageOut } from '../lib/helpers.js';

export default function RotateImage({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dir, setDir] = useState('90');
  const [busy, setBusy] = useState(false);

  function choose(fileList) {
    const chosen = fileList && fileList[0];
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

  async function rotate() {
    if (!file || busy) return;
    setBusy(true);

    try {
      const img = await loadImage(file);
      const turn = Number(dir);
      const swap = Math.abs(turn) === 90; // a quarter turn swaps width and height

      const canvas = document.createElement('canvas');
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext('2d');

      const out = imageOut(file.type);
      if (out.mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'; // transparency becomes white in a JPG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.translate(canvas.width / 2, canvas.height / 2); // turn around the centre
      ctx.rotate((turn * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const blob = await canvasToBlob(canvas, out.mime, 0.92);
      canvas.width = canvas.height = 0; // give the memory back

      downloadBlob(blob, baseName(file.name) + '-rotated.' + out.ext);
      toast('Image rotated.', 'success');
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
        id="imgrot"
        accept="image/*"
        inputRef={inputRef}
        onFiles={choose}
        icon={DzImage}
        title={
          <>
            Drop an image here or <u>browse</u>
          </>
        }
        sub="Turn the picture by 90° or 180°."
      />

      <FileCard idPrefix="imgrot" badge="IMG" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="imgrotDir">Rotation</label>
          <select id="imgrotDir" value={dir} onChange={(e) => setDir(e.target.value)}>
            <option value="90">90° clockwise</option>
            <option value="-90">90° counter-clockwise</option>
            <option value="180">180°</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" id="imgrotBtn" type="button" disabled={busy || !file} onClick={rotate}>
          {busy ? 'Rotating…' : 'Rotate image'}
        </button>
      </div>
    </section>
  );
}
