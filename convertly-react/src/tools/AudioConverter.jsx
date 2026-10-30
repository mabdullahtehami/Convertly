/* ==========================================================
   Convertly React - Audio Converter
   Port of js/audio-converter.js (any audio file -> MP3 or WAV)
   ========================================================== */
import { useRef, useState } from 'react';
import MediaDrop from '../components/MediaDrop.jsx';
import MtCard from '../components/MtCard.jsx';
import MtProgress from '../components/MtProgress.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob } from '../lib/helpers.js';
import { decodeAudio, encodeMp3, encodeWav, ensureLame } from '../lib/audio.js';

const MAX_SIZE = 200 * 1024 * 1024; /* 200 MB */

const isAudio = (f) => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name);

export default function AudioConverter({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [format, setFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192');
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });
  const [resultsShow, setResultsShow] = useState(false);

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!isAudio(chosen)) {
      toast('Please choose an audio file.', 'error');
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
    if (format === 'mp3') {
      const lame = await ensureLame();
      if (!lame) {
        toast('MP3 library failed to load. Check your internet and refresh.', 'error');
        return;
      }
    }

    setBusy(true);
    setResultsShow(false);
    setProgress({ show: true, percent: 5, text: 'Reading file…' });

    try {
      const audio = await decodeAudio(file);
      let out;
      if (format === 'wav') {
        out = encodeWav(audio, 0, audio.duration); // WAV is instant
        setProgress({ show: true, percent: 100, text: 'WAV ready (' + formatBytes(out.size) + ').' });
      } else {
        out = await encodeMp3(audio, Number(bitrate), 0, audio.duration, (p) =>
          setProgress({
            show: true,
            percent: 20 + p * 75,
            text: 'Creating MP3… ' + Math.round(p * 100) + '%',
          })
        );
        setProgress({ show: true, percent: 100, text: 'MP3 ready (' + formatBytes(out.size) + ').' });
      }

      setBlob(out);
      setResultsShow(true);
      toast(format.toUpperCase() + ' created.', 'success');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not read audio from this file. Try MP3, WAV, M4A or OGG.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Audio Converter</h2>
        <p className="mt-sub">Convert any audio file to MP3 or WAV, entirely in your browser.</p>

        <MediaDrop
          id="audioconv"
          accept="audio/*"
          text="Drag and drop an audio file here"
          inputRef={inputRef}
          onFiles={choose}
        />
        <MtCard idPrefix="audioconv" file={file} meta={meta} onRemove={reset} />

        <div className="mt-row">
          <label>
            Format
            <select id="audioconvFormat" className="mt-input" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </label>
          <label>
            MP3 quality
            <select id="audioconvBitrate" className="mt-input" value={bitrate} onChange={(e) => setBitrate(e.target.value)}>
              <option value="128">Standard (128 kbps)</option>
              <option value="192">High (192 kbps)</option>
              <option value="320">Best (320 kbps)</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="mt-btn mt-primary"
          id="audioconvBtn"
          disabled={busy || !file}
          onClick={convert}
        >
          {busy ? 'Converting…' : 'Convert'}
        </button>

        <MtProgress idPrefix="audioconv" show={progress.show} percent={progress.percent} text={progress.text} />

        <div className="mt-result" id="audioconvResults" hidden={!resultsShow}>
          <button
            type="button"
            className="mt-btn mt-primary"
            id="audioconvDownload"
            onClick={() => {
              if (blob && file) downloadBlob(blob, baseName(file.name) + '.' + format);
            }}
          >
            Download
          </button>
        </div>
      </div>
    </section>
  );
}
