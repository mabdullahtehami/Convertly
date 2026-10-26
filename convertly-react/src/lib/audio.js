/* ==========================================================
   Convertly React - audio helpers
   Port of the audio half of js/media-ui.js
   ========================================================== */
import lameUrl from 'lamejs/lame.min.js?url';
import { nextFrame } from './helpers.js';

export function formatTime(sec) {
  sec = Math.max(0, sec || 0);
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return m + ':' + s;
}

/* lame.min.js is a classic browser script (no module export),
   so it is loaded as an asset and attached to window.lamejs,
   exactly like the old <script src="...lame.min.js"> tag. */
let lamePromise = null;

export function ensureLame() {
  if (window.lamejs) return Promise.resolve(window.lamejs);
  if (!lamePromise) {
    lamePromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = lameUrl;
      script.async = true;
      script.onload = () => resolve(window.lamejs || null);
      script.onerror = () => {
        lamePromise = null;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }
  return lamePromise;
}

export async function decodeAudio(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('Audio processing is not supported in this browser.');
  const ctx = new AC();
  try {
    return await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    if (ctx.close) ctx.close().catch(() => {});
  }
}

function toInt16(float32, from, to) {
  const out = new Int16Array(to - from);
  for (let i = 0; i < out.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[from + i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export async function encodeMp3(buffer, kbps, startSec, endSec, onProgress) {
  const lame = await ensureLame();
  if (!lame) throw new Error('MP3 library failed to load.');

  const channels = Math.min(buffer.numberOfChannels, 2);
  const rate = buffer.sampleRate;
  const from = Math.max(0, Math.floor(startSec * rate));
  const to = Math.min(buffer.length, Math.floor(endSec * rate));
  if (to <= from) throw new Error('Nothing to convert.');

  const encoder = new lame.Mp3Encoder(channels, rate, kbps);
  const left = toInt16(buffer.getChannelData(0), from, to);
  const right = channels === 2 ? toInt16(buffer.getChannelData(1), from, to) : null;
  const BLOCK = 1152;
  const chunks = [];

  for (let i = 0; i < left.length; i += BLOCK) {
    const l = left.subarray(i, i + BLOCK);
    const out = right ? encoder.encodeBuffer(l, right.subarray(i, i + BLOCK)) : encoder.encodeBuffer(l);
    if (out.length) chunks.push(new Int8Array(out));
    if ((i / BLOCK) % 200 === 0) {
      if (onProgress) onProgress(i / left.length);
      await nextFrame();
    }
  }
  const end = encoder.flush();
  if (end.length) chunks.push(new Int8Array(end));
  return new Blob(chunks, { type: 'audio/mpeg' });
}

export function encodeWav(buffer, startSec, endSec) {
  const channels = Math.min(buffer.numberOfChannels, 2);
  const rate = buffer.sampleRate;
  const from = Math.max(0, Math.floor(startSec * rate));
  const to = Math.min(buffer.length, Math.floor(endSec * rate));
  const n = to - from;
  if (n <= 0) throw new Error('Nothing to convert.');

  const dataSize = n * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const text = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, dataSize, true);

  const data = [];
  for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][from + i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}
