/* ==========================================================
   Convertly React - Audio Trimmer
   Port of js/audio-trimmer.js
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import MediaDrop from '../components/MediaDrop.jsx';
import MtCard from '../components/MtCard.jsx';
import MtProgress from '../components/MtProgress.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, nextFrame } from '../lib/helpers.js';
import { formatTime, decodeAudio, encodeMp3, encodeWav } from '../lib/audio.js';

const MAX_SIZE = 200 * 1024 * 1024; /* 200 MB */

export default function AudioTrimmer({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [buffer, setBuffer] = useState(null);
  const [url, setUrl] = useState(null);
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState('0');
  const [endMax, setEndMax] = useState('0');
  const [format, setFormat] = useState('mp3');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });
  const [showPlayer, setShowPlayer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  function clearUrl() {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
  }

  function reset() {
    clearUrl();
    setFile(null);
    setBuffer(null);
    setMeta('');
    if (inputRef.current) inputRef.current.value = '';
    setShowPlayer(false);
    setShowOptions(false);
    setProgress((p) => ({ ...p, show: false }));
  }

  async function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (
      !(
        chosen.type.startsWith('audio/') ||
        chosen.type.startsWith('video/') ||
        /\.(mp3|wav|m4a|ogg|aac|mp4|webm|mov)$/i.test(chosen.name)
      )
    ) {
      toast('Please choose an audio or video file.', 'error');
      return;
    }
    if (chosen.size > MAX_SIZE) {
      toast('Please choose a file smaller than 200 MB.', 'error');
      return;
    }

    toast('Reading audio…');
    try {
      const decoded = await decodeAudio(chosen);
      clearUrl();
      setFile(chosen);
      setBuffer(decoded);
      setUrl(URL.createObjectURL(chosen));
      setMeta(formatBytes(chosen.size) + ', length ' + formatTime(decoded.duration));
      setShowPlayer(true);
      setShowOptions(true);
      setStart('0');
      setEnd(decoded.duration.toFixed(1));
      setEndMax(decoded.duration.toFixed(1));
      setProgress((p) => ({ ...p, show: false }));
    } catch (err) {
      console.error(err);
      toast('Could not read audio from this file.', 'error');
    }
  }

  async function trim() {
    if (!buffer || busy) return;
    const duration = buffer.duration;
    const from = Number(start);
    const to = Number(end);

    if (!(from >= 0) || !(to > from) || to > duration + 0.05) {
      toast('Enter a valid start and end time (file length is ' + duration.toFixed(1) + ' s).', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 5, text: 'Working…' });

    try {
      const stem = baseName(file.name) + '-trimmed';
      await nextFrame();
      if (format === 'wav') {
        const blob = encodeWav(buffer, from, to);
        setProgress({ show: true, percent: 100, text: 'Done.' });
        downloadBlob(blob, stem + '.wav');
      } else {
        const blob = await encodeMp3(buffer, 192, from, to, (p) =>
          setProgress({
            show: true,
            percent: 5 + p * 90,
            text: 'Creating MP3… ' + Math.round(p * 100) + '%',
          })
        );
        setProgress({ show: true, percent: 100, text: 'Done.' });
        downloadBlob(blob, stem + '.mp3');
      }
      toast('Audio trimmed.', 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not trim this audio.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Audio Trimmer</h2>
        <p className="mt-sub">
          Cut the part you want from an audio file (or the audio of a video). Save as MP3 or WAV.
        </p>

        <MediaDrop
          id="trim"
          accept="audio/*,video/*"
          text="Drag and drop an audio file here"
          inputRef={inputRef}
          onFiles={choose}
        />
        <MtCard idPrefix="trim" file={file} meta={meta} onRemove={reset} />

        <audio id="trimPlayer" className="mt-media" controls hidden={!showPlayer} src={url || undefined} />

        <div className="mt-row" id="trimOptions" hidden={!showOptions}>
          <label>
            Start (seconds)
            <input
              type="number"
              id="trimStart"
              className="mt-input"
              min="0"
              step="0.1"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            End (seconds)
            <input
              type="number"
              id="trimEnd"
              className="mt-input"
              min="0"
              step="0.1"
              max={endMax}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label>
            Save as
            <select
              id="trimFormat"
              className="mt-input"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="mt-btn mt-primary"
          id="trimBtn"
          disabled={busy || !buffer}
          onClick={trim}
        >
          {busy ? 'Trimming…' : 'Trim audio'}
        </button>

        <MtProgress idPrefix="trim" show={progress.show} percent={progress.percent} text={progress.text} />
      </div>
    </section>
  );
}
