/* ==========================================================
   Convertly React - Image Compressor
   Port of js/image-compressor.js (re-encode as a smaller JPG)
   ========================================================== */
import { useRef, useState } from 'react';
import Dropzone from '../components/Dropzone.jsx';
import FileCard from '../components/FileCard.jsx';
import { DzImage } from '../lib/icons.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, canvasToBlob, loadImage } from '../lib/helpers.js';

export default function ImageCompressor({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [blob, setBlob] = useState(null);
  const [quality, setQuality] = useState('80');
  const [busy, setBusy] = useState(false);
  const [resultsShow, setResultsShow] = useState(false);
  const [summary, setSummary] = useState('Your image is ready');

  function choose(chosen) {
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    setFile(chosen);
    setBlob(null);
    setResultsShow(false);
  }

  function reset() {
    setFile(null);
    setBlob(null);
    setResultsShow(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function compress() {
    if (!file || busy) return;
    setBusy(true);
    setResultsShow(false);

    try {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // transparency becomes white in a JPG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const out = await canvasToBlob(canvas, 'image/jpeg', Number(quality) / 100);
      canvas.width = canvas.height = 0; // give the memory back

      const before = file.size;
      const after = out.size;
      const saved = Math.round((1 - after / before) * 100);
      if (after < before) {
        setSummary(formatBytes(before) + ' to ' + formatBytes(after) + ' (' + saved + '% smaller)');
        toast('Image compressed.', 'success');
      } else {
        setSummary('No size reduction. The original is already small.');
        toast('This image is already small. Try a lower quality.', 'error');
      }
      setBlob(out);
      setResultsShow(true);
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
        id="imgcomp"
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
        sub="JPG, PNG or WebP in, one smaller JPG out."
      />

      <FileCard idPrefix="imgcomp" badge="JPG" file={file} onRemove={reset} />

      <div className="options">
        <div className="field">
          <label htmlFor="imgcompQuality">
            Quality <output htmlFor="imgcompQuality">{quality}%</output>
          </label>
          <input
            type="range"
            id="imgcompQuality"
            min="40"
            max="95"
            step="5"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          />
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          id="imgcompBtn"
          type="button"
          disabled={busy || !file}
          onClick={compress}
        >
          {busy ? 'Compressing…' : 'Compress image'}
        </button>
      </div>

      <div className="results" id="imgcompResults" hidden={!resultsShow}>
        <div className="results-head">
          <h2 id="imgcompSummary">{summary}</h2>
          <button
            className="btn btn-primary btn-sm"
            id="imgcompDownload"
            type="button"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '-compressed.jpg');
            }}
          >
            Download JPG
          </button>
        </div>
      </div>
    </section>
  );
}
