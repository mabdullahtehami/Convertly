/* ==========================================================
   Convertly React - file intake helpers
   Port of setupDropzone() and onFileInput() in js/common.js
   ========================================================== */
import { useCallback, useState } from 'react';

function handleError(onError, err) {
  console.error(err);
  if (onError) onError(err);
}

/* Run an `onFiles` handler and route any failure to `onError`.
   The drag & drop path and both file inputs share it, so a rejected
   arrayBuffer() always becomes a toast instead of an unhandled
   rejection (js/common.js only wires up the input path). */
export function deliverFiles(onFiles, onError, files) {
  try {
    const out = onFiles(files);
    if (out && typeof out.catch === 'function') out.catch((err) => handleError(onError, err));
  } catch (err) {
    handleError(onError, err);
  }
}

export function useDropzone(onFiles, onError) {
  const [isOver, setIsOver] = useState(false);

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsOver(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsOver(false);
      if (e.dataTransfer && e.dataTransfer.files.length) deliverFiles(onFiles, onError, e.dataTransfer.files);
    },
    [onFiles, onError]
  );

  return { isOver, dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
