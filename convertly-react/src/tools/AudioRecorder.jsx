/* ==========================================================
   Convertly React - Audio Recorder
   Port of js/audio-recorder.js
   NOTE: the microphone only works on https:// or localhost.
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import MtProgress from '../components/MtProgress.jsx';
import { useToast } from '../lib/toast.jsx';
import { downloadBlob } from '../lib/helpers.js';
import { decodeAudio, encodeMp3, ensureLame } from '../lib/audio.js';

const fmt = (ms) => {
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

function extFor(type) {
  if (/ogg/.test(type)) return 'ogg';
  if (/mp4|aac/.test(type)) return 'm4a';
  return 'webm';
}

export default function AudioRecorder({ id, hidden }) {
  const toast = useToast();

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const urlRef = useRef(null);

  const [time, setTime] = useState('0:00');
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [playerUrl, setPlayerUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ show: false, percent: 0, text: '' });
  const [resultsShow, setResultsShow] = useState(false);
  const [playerShow, setPlayerShow] = useState(false);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  function stopStream() {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      toast('Recording is not supported here. Use Chrome, Edge or Firefox on https or localhost.', 'error');
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error(err);
      toast('Microphone access was blocked. Please allow the microphone and try again.', 'error');
      return;
    }

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setBlob(null);
    setPlayerUrl(null);
    chunksRef.current = [];
    setPlayerShow(false);
    setResultsShow(false);
    setProgress((p) => ({ ...p, show: false }));

    const recorder = new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => e.data && e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      clearInterval(timerRef.current);
      stopStream();
      const out = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      urlRef.current = URL.createObjectURL(out);
      setBlob(out);
      setPlayerUrl(urlRef.current);
      setPlayerShow(true);
      setResultsShow(true);
      setRecording(false);
      toast('Recording saved. You can play or download it.', 'success');
    };

    recorder.start();
    startedAtRef.current = Date.now();
    setTime('0:00');
    timerRef.current = setInterval(() => setTime(fmt(Date.now() - startedAtRef.current)), 250);
    setRecording(true);
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }

  async function downloadMp3() {
    if (!blob || busy) return;
    const lame = await ensureLame();
    if (!lame) {
      toast('MP3 library failed to load. Check your internet and refresh.', 'error');
      return;
    }

    setBusy(true);
    setProgress({ show: true, percent: 5, text: 'Preparing…' });
    try {
      const audio = await decodeAudio(blob);
      const mp3 = await encodeMp3(audio, 192, 0, audio.duration, (p) =>
        setProgress({
          show: true,
          percent: 10 + p * 85,
          text: 'Creating MP3… ' + Math.round(p * 100) + '%',
        })
      );
      setProgress({ show: true, percent: 100, text: 'Done.' });
      downloadBlob(mp3, 'recording.mp3');
    } catch (err) {
      console.error(err);
      setProgress((p) => ({ ...p, show: false }));
      toast('Could not create the MP3. Download the original recording instead.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Audio Recorder</h2>
        <p className="mt-sub">Record your voice from the microphone and download it.</p>

        <div className="mt-time" id="recTime">
          {time}
        </div>

        <div className="mt-row">
          <button type="button" className="mt-btn mt-primary" id="recStart" disabled={recording} onClick={start}>
            Start recording
          </button>
          <button type="button" className="mt-btn mt-danger" id="recStop" disabled={!recording} onClick={stop}>
            Stop
          </button>
        </div>

        <audio id="recPlayer" className="mt-media" controls hidden={!playerShow} src={playerUrl || undefined} />

        <div className="mt-result" id="recResults" hidden={!resultsShow}>
          <button
            type="button"
            className="mt-btn"
            id="recDownload"
            onClick={() => {
              if (blob) downloadBlob(blob, 'recording.' + extFor(blob.type));
            }}
          >
            Download recording
          </button>
          <button type="button" className="mt-btn mt-primary" id="recMp3" disabled={busy} onClick={downloadMp3}>
            Download as MP3
          </button>
        </div>

        <MtProgress idPrefix="rec" show={progress.show} percent={progress.percent} text={progress.text} />
      </div>
    </section>
  );
}
