/* ==========================================================
   Convertly React - shared helpers
   (ported from js/common.js)
   ========================================================== */

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function baseName(filename) {
  return filename.replace(/\.[^.]+$/, '') || 'file';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), type, quality)
  );
}

export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
export const isPdfFile = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

/* Load an image file as an <img>.
   The object URL is revoked right away - the pixels are already decoded. */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

/* PNG and WebP keep their transparency, everything else saves best as JPG */
export function imageOut(type) {
  if (type === 'image/png') return { mime: 'image/png', ext: 'png' };
  if (type === 'image/webp') return { mime: 'image/webp', ext: 'webp' };
  return { mime: 'image/jpeg', ext: 'jpg' };
}

/* "1-3, 5, 8-10" -> zero-based page indexes, or null if invalid */
export function parseRanges(text, total) {
  const out = [];
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a || b > total) return null;
    for (let p = a; p <= b; p++) if (!out.includes(p - 1)) out.push(p - 1);
  }
  return out;
}
