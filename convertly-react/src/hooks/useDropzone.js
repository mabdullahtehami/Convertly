/* ==========================================================
   Convertly React - drag & drop helper
   Port of setupDropzone() in js/common.js
   ========================================================== */
import { useCallback, useState } from 'react';

export function useDropzone(onFiles) {
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
      if (e.dataTransfer && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  return { isOver, dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
