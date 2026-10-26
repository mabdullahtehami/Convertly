/* ==========================================================
   Convertly React - Video Compressor
   Port of js/video-compressor.js (real-time re-record to WebM)
   ========================================================== */
import { useRef, useState } from 'react';
import MediaDrop from '../components/MediaDrop.jsx';
import MtCard from '../components/MtCard.jsx';
import MtProgress from '../components/MtProgress.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob } from '../lib/helpers.js';

export default function VideoCompressor({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [size, setSize] = useState('480');
  const [quality, setQuality] = useState('1200000');
  const [mute, setMute] = useState(false);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });
  const [resultsShow, setResultsShow] = useState(false);
  const [summary, setSummary] = useState('');

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!(chosen.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(chosen.name))) {
      toast('Please choose a video file.', 'error');
      return;
    }
    setFile(chosen);
    setBlob(null);
    setMeta(formatBytes(chosen.size));
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  function reset() {
    setFile(null);
    setBlob(null);
    setMeta('');
    if (inputRef.current) inputRef.current.value = '';
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  async function compress() {
    if (!file || busy) return;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      toast('Your browser does not support video compression. Please use Chrome, Edge or Firefox.', 'error');
      return;
    }

    setBusy(true);
    setResultsShow(false);
    setProgress({ show: true, percent: 0, text: 'Preparing…' });

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const isMuted = mute;
    let actx = null;
    let raf = 0;

    try {
      video.src = url;
      video.playsInline = true;
      video.muted = isMuted;
      video.preload = 'auto';
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('Cannot read this video.'));
      });

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const targetH = Number(size) || srcH;
      const scale = Math.min(1, targetH / srcH);
      const w = Math.max(2, Math.round((srcW * scale) / 2) * 2);
      const h = Math.max(2, Math.round((srcH * scale) / 2) * 2);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);

      /* Sound goes into the recording but not to the speakers */
      if (!isMuted) {
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        const source = actx.createMediaElementSource(video);
        const dest = actx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        await actx.resume();
      }

      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) =>
        MediaRecorder.isTypeSupported(m)
      );
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: Number(quality),
        audioBitsPerSecond: 96000,
      });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      const stopped = new Promise((resolve) => (recorder.onstop = resolve));
      const ended = new Promise((resolve) => (video.onended = resolve));

      const draw = () => {
        ctx.drawImage(video, 0, 0, w, h);
        if (isFinite(video.duration) && video.duration > 0) {
          const pct = Math.min(99, (video.currentTime / video.duration) * 100);
          setProgress({
            show: true,
            percent: pct,
            text: 'Compressing… ' + Math.round(pct) + '% (keep this tab open)',
          });
        }
        raf = requestAnimationFrame(draw);
      };

      recorder.start(1000);
      draw();
      await video.play();
      await ended;

      cancelAnimationFrame(raf);
      recorder.stop();
      await stopped;

      const output = new Blob(chunks, { type: 'video/webm' });
      const before = file.size;
      const after = output.size;
      setSummary(
        formatBytes(before) +
          ' to ' +
          formatBytes(after) +
          (after < before ? ' (' + Math.round((1 - after / before) * 100) + '% smaller)' : ' (not smaller, try Small file)')
      );
      setProgress({ show: true, percent: 100, text: 'Done.' });
      setBlob(output);
      setResultsShow(true);
      toast('Video compressed.', 'success');
    } catch (err) {
      console.error('Video compress error:', err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not compress this video. Try another file.', 'error');
    } finally {
      cancelAnimationFrame(raf);
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      if (actx && actx.close) actx.close().catch(() => {});
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Video Compressor</h2>
        <p className="mt-sub">Make a video smaller. The result is saved as a WebM file.</p>

        <MediaDrop
          id="vcomp"
          accept="video/*"
          text="Drag and drop a video file here"
          inputRef={inputRef}
          onFiles={choose}
        />
        <MtCard idPrefix="vcomp" file={file} meta={meta} onRemove={reset} />

        <div className="mt-row">
          <label>
            Size
            <select id="vcompSize" className="mt-input" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="0">Keep original size</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
              <option value="360">360p</option>
            </select>
          </label>
          <label>
            Quality
            <select
              id="vcompQuality"
              className="mt-input"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option value="2500000">High</option>
              <option value="1200000">Medium</option>
              <option value="600000">Small file</option>
            </select>
          </label>
          <label className="mt-check">
            <input type="checkbox" id="vcompMute" checked={mute} onChange={(e) => setMute(e.target.checked)} />{' '}
            Remove sound
          </label>
        </div>

        <p className="mt-note">
          Keep this tab open and visible while compressing. It runs at the speed of the video.
        </p>

        <button
          type="button"
          className="mt-btn mt-primary"
          id="vcompBtn"
          disabled={busy || !file}
          onClick={compress}
        >
          {busy ? 'Compressing…' : 'Compress video'}
        </button>

        <MtProgress idPrefix="vcomp" show={progress.show} percent={progress.percent} text={progress.text} />

        <div className="mt-result" id="vcompResults" hidden={!resultsShow}>
          <span id="vcompSummary">{summary}</span>
          <button
            type="button"
            className="mt-btn mt-primary"
            id="vcompDownload"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '-compressed.webm');
            }}
          >
            Download video
          </button>
        </div>
      </div>
    </section>
  );
}
