/* ==========================================================
   Convertly React - .mt-drop (media tool file picker)
   Same markup as MT.dropHtml() in js/media-ui.js
   ========================================================== */
import { useDropzone } from '../hooks/useDropzone.js';
import { useToast } from '../lib/toast.jsx';

export default function MediaDrop({ id, accept, text, onFiles, inputRef }) {
  const toast = useToast();
  const { isOver, dropProps } = useDropzone(onFiles);

  function fileError(err) {
    console.error(err);
    toast('Could not read that file. It may be damaged, moved or locked.', 'error');
  }

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
          className="vis-hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            e.target.value = '';
            try {
              const out = onFiles(files);
              if (out && typeof out.catch === 'function') out.catch(fileError);
            } catch (err) {
              fileError(err);
            }
          }}
        />
      </label>
    </div>
  );
}
