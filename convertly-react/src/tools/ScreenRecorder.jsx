/* ==========================================================
   Convertly React - Screen Recorder
   Port of js/screen-recorder.js (getDisplayMedia + MediaRecorder)
   NOTE: screen sharing only works on https:// or localhost.
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../lib/toast.jsx';
import { downloadBlob } from '../lib/helpers.js';

const fmt = (ms) => {
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

const extFor = (type) => (type.includes('mp4') ? 'mp4' : 'webm');

export default function ScreenRecorder({ id, hidden }) {
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

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.MediaRecorder) {
      toast('Screen recording is not supported here. Use Chrome, Edge or Firefox on https or localhost.', 'error');
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } catch (err) {
      console.error(err);
      toast('Screen recording was cancelled or blocked. Please allow screen sharing.', 'error');
      return;
    }

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setBlob(null);
    setPlayerUrl(null);
    chunksRef.current = [];
    setPlayerShow(false);
    setResultsShow(false);

    const recorder = new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => e.data && e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      clearInterval(timerRef.current);
      stopStream();
      const out = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      urlRef.current = URL.createObjectURL(out);
      setBlob(out);
      setPlayerUrl(urlRef.current);
      setPlayerShow(true);
      setResultsShow(true);
      setRecording(false);
      toast('Recording saved. You can play or download it.', 'success');
    };

    /* The browser's own "Stop sharing" button ends the recording too */
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) videoTrack.addEventListener('ended', stop);

    recorder.start();
    startedAtRef.current = Date.now();
    setTime('0:00');
    timerRef.current = setInterval(() => setTime(fmt(Date.now() - startedAtRef.current)), 250);
    setRecording(true);
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Screen Recorder</h2>
        <p className="mt-sub">Record your screen (and tab audio if you allow it) and download the video.</p>

        <div className="mt-time" id="screenTime">
          {time}
        </div>

        <div className="mt-row">
          <button type="button" className="mt-btn mt-primary" id="screenStart" disabled={recording} onClick={start}>
            Start recording
          </button>
          <button type="button" className="mt-btn mt-danger" id="screenStop" disabled={!recording} onClick={stop}>
            Stop
          </button>
        </div>

        <video id="screenPlayer" className="mt-media" controls playsInline hidden={!playerShow} src={playerUrl || undefined} />

        <div className="mt-result" id="screenResults" hidden={!resultsShow}>
          <button
            type="button"
            className="mt-btn mt-primary"
            id="screenDownload"
            onClick={() => {
              if (blob) downloadBlob(blob, 'screen-recording.' + extFor(blob.type));
            }}
          >
            Download video
          </button>
        </div>
      </div>
    </section>
  );
}
