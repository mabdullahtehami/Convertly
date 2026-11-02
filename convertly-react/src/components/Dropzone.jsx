/* ==========================================================
   Convertly React - .dropzone (PDF tool file picker)
   ========================================================== */
import { useDropzone } from '../hooks/useDropzone.js';
import { useToast } from '../lib/toast.jsx';

export default function Dropzone({ id, accept, multiple = false, onFiles, icon: Icon, title, sub, inputRef }) {
  const toast = useToast();
  const { isOver, dropProps } = useDropzone(onFiles);

  function fileError(err) {
    console.error(err);
    toast('Could not read that file. It may be damaged, moved or locked.', 'error');
  }

  return (
    <label className={isOver ? 'dropzone is-over' : 'dropzone'} id={id + 'Drop'} htmlFor={id + 'Input'} {...dropProps}>
      <input
        ref={inputRef}
        type="file"
        id={id + 'Input'}
        accept={accept}
        multiple={multiple}
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
      <Icon />
      <span className="dz-title">{title}</span>
      <span className="dz-sub">{sub}</span>
    </label>
  );
}
