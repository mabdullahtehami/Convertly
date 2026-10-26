/* ==========================================================
   Convertly React - .mt-drop (media tool file picker)
   Same markup as MT.dropHtml() in js/media-ui.js
   ========================================================== */
import { useDropzone } from '../hooks/useDropzone.js';

export default function MediaDrop({ id, accept, text, onFiles, inputRef }) {
  const { isOver, dropProps } = useDropzone(onFiles);

  return (
    <div className={isOver ? 'mt-drop is-over' : 'mt-drop'} id={id + 'Drop'} {...dropProps}>
      <p>{text}</p>
      <label className="mt-btn">
        Choose file
        <input
          ref={inputRef}
          type="file"
          id={id + 'Input'}
          accept={accept}
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
