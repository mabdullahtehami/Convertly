/* ==========================================================
   Convertly React - Video / Audio to MP3
   Port of js/video-to-mp3.js
   ========================================================== */
import { useRef, useState } from 'react';
import MediaDrop from '../components/MediaDrop.jsx';
import MtCard from '../components/MtCard.jsx';
import MtProgress from '../components/MtProgress.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, nextFrame } from '../lib/helpers.js';
import { decodeAudio, encodeMp3, ensureLame } from '../lib/audio.js';

const MAX_SIZE = 200 * 1024 * 1024; /* 200 MB */

const isMedia = (f) =>
  f.type.startsWith('video/') ||
  f.type.startsWith('audio/') ||
  /\.(mp4|mov|webm|mkv|avi|mp3|wav|m4a|ogg|aac)$/i.test(f.name);

export default function VideoToMp3({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [bitrate, setBitrate] = useState('192');
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });
  const [resultsShow, setResultsShow] = useState(false);

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isMedia(chosen)) {
      toast('Please choose a video or audio file.', 'error');
      return;
    }
    if (chosen.size > MAX_SIZE) {
      toast('Please choose a file smaller than 200 MB.', 'error');
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

  async function convert() {
    if (!file || busy) return;
    const lame = await ensureLame();
    if (!lame) {
      toast('MP3 library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    setBusy(true);
    setResultsShow(false);
    setProgress({ show: true, percent: 5, text: 'Reading file…' });

    try {
      setProgress({ show: true, percent: 15, text: 'Extracting audio…' });
      await nextFrame();
      const audio = await decodeAudio(file);

      const output = await encodeMp3(audio, Number(bitrate), 0, audio.duration, (p) =>
        setProgress({
          show: true,
          percent: 20 + p * 75,
          text: 'Creating MP3… ' + Math.round(p * 100) + '%',
        })
      );

      setProgress({ show: true, percent: 100, text: 'MP3 ready (' + formatBytes(output.size) + ').' });
      setBlob(output);
      setResultsShow(true);
      toast('MP3 created.', 'success');
    } catch (err) {
      console.error('Video to MP3 error:', err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not read audio from this file. Try MP4, WebM, MP3 or WAV.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Video / Audio to MP3</h2>
        <p className="mt-sub">
          Take the sound out of a video (MP4, WebM, MOV) or convert an audio file to MP3.
        </p>

        <MediaDrop
          id="mp3"
          accept="video/*,audio/*"
          text="Drag and drop a video or audio file here"
          inputRef={inputRef}
          onFiles={choose}
        />
        <MtCard idPrefix="mp3" file={file} meta={meta} onRemove={reset} />

        <div className="mt-row">
          <label>
            Quality
            <select id="mp3Bitrate" className="mt-input" value={bitrate} onChange={(e) => setBitrate(e.target.value)}>
              <option value="128">Standard (128 kbps)</option>
              <option value="192">High (192 kbps)</option>
              <option value="320">Best (320 kbps)</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="mt-btn mt-primary"
          id="mp3Btn"
          disabled={busy || !file}
          onClick={convert}
        >
          {busy ? 'Converting…' : 'Convert to MP3'}
        </button>

        <MtProgress idPrefix="mp3" show={progress.show} percent={progress.percent} text={progress.text} />

        <div className="mt-result" id="mp3Results" hidden={!resultsShow}>
          <button
            type="button"
            className="mt-btn mt-primary"
            id="mp3Download"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '.mp3');
            }}
          >
            Download MP3
          </button>
        </div>
      </div>
    </section>
  );
}
