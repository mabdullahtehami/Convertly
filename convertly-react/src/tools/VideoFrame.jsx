/* ==========================================================
   Convertly React - Video to Image (capture a frame)
   Port of js/video-frame.js
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import MediaDrop from '../components/MediaDrop.jsx';
import MtCard from '../components/MtCard.jsx';
import { useToast } from '../lib/toast.jsx';
import { formatBytes, baseName, downloadBlob, canvasToBlob } from '../lib/helpers.js';

export default function VideoFrame({ id, hidden }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const playerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState('');
  const [url, setUrl] = useState(null);
  const [format, setFormat] = useState('jpg');
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ext, setExt] = useState('jpg');
  const [showPlayer, setShowPlayer] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [resultsShow, setResultsShow] = useState(false);

  /* Same as js/video-frame.js: revoke each URL only when IT changes,
     so capturing a frame never kills the video source URL. */
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function clearUrls() {
    if (url) URL.revokeObjectURL(url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUrl(null);
    setPreviewUrl(null);
  }

  function reset() {
    clearUrls();
    setFile(null);
    setBlob(null);
    setMeta('');
    if (inputRef.current) inputRef.current.value = '';
    const player = playerRef.current;
    if (player) {
      player.pause();
      player.removeAttribute('src');
    }
    setShowPlayer(false);
    setShowOptions(false);
    setResultsShow(false);
  }

  function choose(fileList) {
    const chosen = fileList && fileList[0];
    if (!chosen) return;
    if (!(chosen.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(chosen.name))) {
      toast('Please choose a video file.', 'error');
      return;
    }
    clearUrls();
    setFile(chosen);
    setBlob(null);
    setUrl(URL.createObjectURL(chosen));
    setMeta(formatBytes(chosen.size));
    setShowPlayer(true);
    setShowOptions(true);
    setResultsShow(false);
  }

  async function capture() {
    const v = playerRef.current;
    if (!v || !v.videoWidth) {
      toast('The video is still loading. Try again in a moment.', 'error');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);

      const isPng = format === 'png';
      setExt(isPng ? 'png' : 'jpg');
      const output = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.92);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setBlob(output);
      setPreviewUrl(URL.createObjectURL(output));
      setResultsShow(true);
      toast('Frame captured.', 'success');
    } catch (err) {
      console.error(err);
      toast('Could not capture this frame.', 'error');
    }
  }

  return (
    <section className="panel" id={'panel-' + id} role="tabpanel" hidden={hidden}>
      <div className="mt">
        <h2 className="mt-title">Video to Image</h2>
        <p className="mt-sub">
          Play or drag the video to the moment you want, then capture that frame as a picture.
        </p>

        <MediaDrop
          id="vframe"
          accept="video/*"
          text="Drag and drop a video file here"
          inputRef={inputRef}
          onFiles={choose}
        />
        <MtCard idPrefix="vframe" file={file} meta={meta} onRemove={reset} />

        <video
          id="vframePlayer"
          ref={playerRef}
          className="mt-media"
          controls
          playsInline
          hidden={!showPlayer}
          src={url || undefined}
        />

        <div className="mt-row" id="vframeOptions" hidden={!showOptions}>
          <label>
            Save as
            <select
              id="vframeFormat"
              className="mt-input"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </label>
          <button type="button" className="mt-btn mt-primary" id="vframeBtn" onClick={capture}>
            Capture this frame
          </button>
        </div>

        <div className="mt-result" id="vframeResults" hidden={!resultsShow}>
          <img
            id="vframePreview"
            className="mt-media"
            src={previewUrl || undefined}
            alt="Captured frame"
            style={{ maxHeight: '220px' }}
          />
          <button
            type="button"
            className="mt-btn mt-primary"
            id="vframeDownload"
            onClick={() => {
              if (!blob || !file) return;
              const player = playerRef.current;
              const t = Math.round(player.currentTime * 10) / 10;
              downloadBlob(blob, baseName(file.name) + '-' + t + 's.' + ext);
            }}
          >
            Download image
          </button>
        </div>
      </div>
    </section>
  );
}
